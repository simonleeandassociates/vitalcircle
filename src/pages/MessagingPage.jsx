import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Send, AlertCircle } from 'lucide-react'

function formatTime(isoString) {
  const date = new Date(isoString)
  const now  = new Date()
  const isToday =
    date.getDate()     === now.getDate()     &&
    date.getMonth()    === now.getMonth()    &&
    date.getFullYear() === now.getFullYear()

  const time = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  return isToday ? `Today at ${time}` : date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ` at ${time}`
}

function Bubble({ message, isOwn }) {
  return (
    <div className={`flex flex-col gap-1 max-w-[78%] ${isOwn ? 'self-end items-end' : 'self-start items-start'}`}>
      <p className="text-xs text-gray-400 px-1">{message.sender_name ?? 'Unknown'}</p>
      <div className={`px-4 py-3 rounded-2xl text-[16px] leading-relaxed break-words
        ${isOwn
          ? 'bg-brand-600 text-white rounded-br-sm'
          : 'bg-white text-gray-900 border border-gray-100 shadow-sm rounded-bl-sm'}`}>
        {message.content}
      </div>
      <p className="text-xs text-gray-400 px-1">{formatTime(message.created_at)}</p>
    </div>
  )
}

export default function MessagingPage() {
  const { profile, groupStatus } = useAuth()
  const navigate                 = useNavigate()
  const groupId                  = groupStatus?.groupId ?? null
  const isSenior      = profile?.role === 'senior'
  const backPath      = isSenior ? '/checkin' : '/family-dashboard'

  const [messages,  setMessages]  = useState([])
  const [text,      setText]      = useState('')
  const [loading,   setLoading]   = useState(true)
  const [sending,   setSending]   = useState(false)
  const [error,     setError]     = useState('')

  const bottomRef   = useRef(null)
  const inputRef    = useRef(null)

  const scrollToBottom = useCallback((behavior = 'smooth') => {
    bottomRef.current?.scrollIntoView({ behavior })
  }, [])

  // Load initial messages
  useEffect(() => {
    async function fetchMessages() {
      setError('')
      try {
        const { data, error: fetchError } = await supabase
          .from('messages')
          .select('*, users(name, role)')
          .order('created_at', { ascending: true })
        if (fetchError) throw fetchError

        setMessages(
          (data ?? []).map(m => ({
            ...m,
            sender_name: m.users?.name ?? 'Unknown',
            sender_role: m.users?.role,
          }))
        )
      } catch (err) {
        setError('Could not load messages. Please try again.')
        console.error('[VitalCircle] fetchMessages error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchMessages()
  }, [])

  // Auto-scroll to bottom after initial load
  useEffect(() => {
    if (!loading) scrollToBottom('instant')
  }, [loading, scrollToBottom])

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('messages-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        async (payload) => {
          // Fetch sender name for incoming message
          const { data: sender } = await supabase
            .from('users')
            .select('name, role')
            .eq('id', payload.new.sender_id)
            .single()

          const incoming = {
            ...payload.new,
            sender_name: sender?.name ?? 'Unknown',
            sender_role: sender?.role,
          }

          setMessages(prev => {
            // Deduplicate: optimistic insert already added a temp version
            if (prev.some(m => m.id === incoming.id)) return prev
            return [...prev, incoming]
          })
          setTimeout(() => scrollToBottom('smooth'), 50)
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [scrollToBottom])

  async function handleSend() {
    const content = text.trim()
    if (!content || sending) return
    setText('')
    setError('')
    setSending(true)

    // Optimistic insert with a temp id
    const tempId = `temp-${Date.now()}`
    const optimistic = {
      id:          tempId,
      sender_id:   profile.id,
      sender_name: profile.name,
      sender_role: profile.role,
      content,
      created_at:  new Date().toISOString(),
      group_id:    groupId,
    }
    setMessages(prev => [...prev, optimistic])
    setTimeout(() => scrollToBottom('smooth'), 50)

    try {
      const { data, error: insertError } = await supabase
        .from('messages')
        .insert({ sender_id: profile.id, content, group_id: groupId })
        .select()
        .single()
      if (insertError) throw insertError

      // Replace temp entry with real one from DB
      setMessages(prev =>
        prev.map(m => m.id === tempId ? { ...optimistic, id: data.id, created_at: data.created_at } : m)
      )
    } catch (err) {
      setError('Message failed to send. Please try again.')
      // Remove the optimistic entry on failure
      setMessages(prev => prev.filter(m => m.id !== tempId))
      setText(content) // restore input
      console.error('[VitalCircle] send message error:', err)
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="min-h-screen bg-warm-50 flex flex-col">
      <div className="max-w-[480px] w-full mx-auto flex flex-col flex-1">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-5 bg-warm-50 border-b border-gray-100">
          <h1 className="text-2xl font-bold text-gray-900">Messages 💬</h1>
          <button
            onClick={() => navigate(backPath)}
            className="text-base text-brand-600 font-medium py-2 px-1"
          >
            ← Back
          </button>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mx-5 mt-4 flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700">
            <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
            <p className="text-base">{error}</p>
          </div>
        )}

        {/* Message thread */}
        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4" style={{ paddingBottom: '5rem' }}>
          {loading ? (
            <div className="flex flex-col items-center gap-4 py-16">
              <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
              <p className="text-gray-400 text-base">Loading messages…</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <span className="text-5xl">💬</span>
              <p className="text-xl font-semibold text-gray-700">No messages yet</p>
              <p className="text-base text-gray-400">Be the first to say hello!</p>
            </div>
          ) : (
            messages.map(m => (
              <Bubble
                key={m.id}
                message={m}
                isOwn={m.sender_id === profile?.id}
              />
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input bar — fixed to bottom */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 z-10">
          <div className="max-w-[480px] mx-auto flex items-end gap-3">
            <textarea
              ref={inputRef}
              rows={1}
              className="flex-1 px-4 py-3 text-lg border-2 border-gray-200 rounded-2xl bg-white
                         focus:border-brand-400 focus:outline-none placeholder:text-gray-400
                         transition-colors resize-none overflow-hidden leading-snug"
              placeholder="Type a message..."
              value={text}
              onChange={e => {
                setText(e.target.value)
                // Auto-grow up to ~4 lines
                e.target.style.height = 'auto'
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
              }}
              onKeyDown={handleKeyDown}
            />
            <button
              onClick={handleSend}
              disabled={!text.trim() || sending}
              className="w-14 h-14 rounded-2xl bg-brand-600 text-white flex items-center justify-center
                         shadow-md active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              aria-label="Send message"
            >
              <Send className="w-6 h-6" />
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
