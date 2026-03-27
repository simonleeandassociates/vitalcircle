import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { getUserGroupStatus } from '../utils/groupHelpers'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,        setUser]        = useState(null)
  const [profile,     setProfile]     = useState(null)
  const [groupStatus, setGroupStatus] = useState(null)
  const [loading,     setLoading]     = useState(true)

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
        setGroupStatus(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchGroupStatus(userId) {
    try {
      const status = await getUserGroupStatus(userId)
      setGroupStatus(status)
    } catch (err) {
      console.error('[VitalCircle] fetchGroupStatus error:', err)
      setGroupStatus({ hasGroup: false, groupId: null, role: null, inviteCode: null, seniorName: null })
    }
  }

  // Exposed so InviteCodeDisplay / JoinFamily can trigger a re-check after
  // creating or joining a group. Fetches a fresh session to avoid stale closure.
  async function refreshGroupStatus() {
    if (!supabase) return
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) await fetchGroupStatus(session.user.id)
  }

  async function fetchProfile(authUser) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single()

    if (data) {
      setProfile(data)
      await fetchGroupStatus(authUser.id)
      setLoading(false)
      return
    }

    // No profile row found — create a fallback so the user is never stranded.
    // Use role from auth metadata (set during sign-up) so family members aren't
    // incorrectly treated as seniors.
    console.warn('[VitalCircle] No profile found for user, creating fallback row.', error)
    const fallback = {
      id:    authUser.id,
      email: authUser.email,
      name:  authUser.user_metadata?.name ?? authUser.email.split('@')[0],
      role:  authUser.user_metadata?.role ?? 'senior',
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
    await fetchGroupStatus(authUser.id)
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
    <AuthContext.Provider
      value={{ user, profile, groupStatus, loading, signUp, signIn, signOut, refreshGroupStatus }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
