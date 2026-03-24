import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase) { setLoading(false); return }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user)
      else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(authUser) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single()

    if (data) {
      setProfile(data)
      setLoading(false)
      return
    }

    // No profile row found (e.g. signup insert failed). Create a fallback row
    // so the user is never stranded. Role defaults to 'senior'; they can change
    // it later. We use upsert to avoid a duplicate-key error on repeated retries.
    console.warn('[VitalCircle] No profile found for user, creating fallback row.', error)
    const fallback = {
      id:   authUser.id,
      email: authUser.email,
      name:  authUser.email.split('@')[0],
      role: 'senior',
    }
    const { data: created, error: createError } = await supabase
      .from('users')
      .upsert(fallback, { onConflict: 'id' })
      .select()
      .single()

    if (createError) {
      console.error('[VitalCircle] Fallback profile creation failed:', createError)
    }

    setProfile(created ?? fallback)
    setLoading(false)
  }

  async function signUp({ email, password, name, role }) {
    if (!supabase) throw new Error('Supabase is not configured. Add credentials to .env.local')
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name: name.trim(), role } },
    })
    if (error) throw error

    // Wait for the auth user to propagate before writing the public profile.
    await new Promise(resolve => setTimeout(resolve, 1000))

    const MAX_ATTEMPTS = 3
    let lastProfileError = null
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const { error: profileError } = await supabase.from('users').insert({
        id: data.user.id,
        email,
        name,
        role,
      })
      if (!profileError) {
        lastProfileError = null
        break
      }
      lastProfileError = profileError
      if (attempt < MAX_ATTEMPTS) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    if (lastProfileError) {
      console.error('[VitalCircle] Profile insert failed after retries:', lastProfileError)
    }

    return data
  }

  async function signIn({ email, password }) {
    if (!supabase) throw new Error('Supabase is not configured. Add credentials to .env.local')
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  async function signOut() {
    if (!supabase) return
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
