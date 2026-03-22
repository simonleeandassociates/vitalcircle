import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react'

const SENIOR_NAME = 'Simon Lee'

const FEELING_MAP = {
  1: { emoji: '😞', label: 'Rough' },
  2: { emoji: '😕', label: 'Not great' },
  3: { emoji: '😐', label: 'Okay' },
  4: { emoji: '🙂', label: 'Good' },
  5: { emoji: '😊', label: 'Great' },
}

function getStatus(score) {
  if (score >= 4) return { color: 'bg-green-500',  ring: 'ring-green-200',  label: 'Doing well',      text: 'text-green-700'  }
  if (score === 3) return { color: 'bg-yellow-400', ring: 'ring-yellow-200', label: 'Doing okay',      text: 'text-yellow-700' }
  return              { color: 'bg-red-500',    ring: 'ring-red-200',   label: 'Needs attention', text: 'text-red-700'    }
}

function formatTime(isoString) {
  const date = new Date(isoString)
  const now  = new Date()
  const isToday =
    date.getDate()     === now.getDate()     &&
    date.getMonth()    === now.getMonth()    &&
    date.getFullYear() === now.getFullYear()

  const time = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  if (isToday) return `Today at ${time}`

  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  const isYesterday =
    date.getDate()     === yesterday.getDate()     &&
    date.getMonth()    === yesterday.getMonth()    &&
    date.getFullYear() === yesterday.getFullYear()
  if (isYesterday) return `Yesterday at ${time}`

  return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ` at ${time}`
}

function StatusCircle({ score }) {
  const status = getStatus(score)
  return (
    <div className={`w-20 h-20 rounded-full ${status.color} ring-4 ${status.ring}
                     flex items-center justify-center shadow-md shrink-0`}>
      <span className="text-4xl leading-none">{FEELING_MAP[score]?.emoji}</span>
    </div>
  )
}

function CheckInCard({ checkin }) {
  const status  = getStatus(checkin.feeling_score)
  const feeling = FEELING_MAP[checkin.feeling_score] ?? { emoji: '❓', label: 'Unknown' }

  return (
    <div className="flex flex-col gap-4">
      {/* Status hero */}
      <div className="card flex items-center gap-5">
        <StatusCircle score={checkin.feeling_score} />
        <div className="flex flex-col gap-1 min-w-0">
          <p className="text-xl font-bold text-gray-900">{SENIOR_NAME}</p>
          <p className={`text-lg font-semibold ${status.text}`}>{status.label}</p>
          <p className="text-sm text-gray-400">{formatTime(checkin.created_at)}</p>
        </div>
      </div>

      {/* Detail rows */}
      <div className="card flex flex-col gap-5">
        <p className="text-lg font-semibold text-gray-700 border-b border-gray-100 pb-3">
          Check-in details
        </p>

        {/* Feeling */}
        <div className="flex items-center justify-between">
          <p className="text-base text-gray-600">Feeling</p>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{feeling.emoji}</span>
            <span className="text-base font-semibold text-gray-800">{feeling.label}</span>
          </div>
        </div>

        {/* Medications */}
        <div className="flex items-center justify-between">
          <p className="text-base text-gray-600">Medications taken</p>
          {checkin.medications_taken ? (
            <div className="flex items-center gap-1.5 text-green-600">
              <CheckCircle className="w-6 h-6" />
              <span className="text-base font-semibold">Yes</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-red-500">
              <XCircle className="w-6 h-6" />
              <span className="text-base font-semibold">No</span>
            </div>
          )}
        </div>

        {/* Needs help */}
        <div className="flex items-center justify-between">
          <p className="text-base text-gray-600">Needs help</p>
          {checkin.needs_help ? (
            <div className="flex items-center gap-1.5 text-red-500">
              <AlertCircle className="w-6 h-6" />
              <span className="text-base font-semibold">Yes</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-green-600">
              <CheckCircle className="w-6 h-6" />
              <span className="text-base font-semibold">No</span>
            </div>
          )}
        </div>
      </div>

      {/* Notes */}
      {checkin.notes && (
        <div className="card bg-warm-100 border-warm-200 flex flex-col gap-2">
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Note from {SENIOR_NAME.split(' ')[0]}</p>
          <p className="text-base text-gray-800 leading-relaxed">"{checkin.notes}"</p>
        </div>
      )}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="card bg-gray-50 border-gray-100 flex flex-col items-center gap-3 py-10 text-center">
      <span className="text-5xl">🕐</span>
      <p className="text-xl font-semibold text-gray-700">No check-ins yet</p>
      <p className="text-base text-gray-400">
        {SENIOR_NAME.split(' ')[0]} hasn't checked in today
      </p>
    </div>
  )
}

export default function FamilyDashboard() {
  const { signOut } = useAuth()
  const navigate    = useNavigate()

  const [checkin,   setCheckin]   = useState(undefined) // undefined = loading, null = none
  const [loading,   setLoading]   = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error,     setError]     = useState('')

  const fetchLatest = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError('')

    try {
      const { data, error: fetchError } = await supabase
        .from('checkins')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (fetchError) throw fetchError
      setCheckin(data ?? null)
    } catch (err) {
      setError('Could not load check-in data. Please try again.')
      console.error('[VitalCircle] fetchLatest error:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { fetchLatest() }, [fetchLatest])

  return (
    <div className="min-h-screen bg-warm-50">
      <div className="max-w-[480px] mx-auto px-5 py-8 flex flex-col gap-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Family Dashboard</h1>
          <button
            onClick={signOut}
            className="text-base text-brand-600 font-medium py-2 px-1"
          >
            Sign out
          </button>
        </div>

        {/* Quick links */}
        <div className="flex gap-6">
          <button
            onClick={() => navigate('/medications')}
            className="text-base font-semibold text-brand-600 py-1"
          >
            Medications 💊
          </button>
          <button
            onClick={() => navigate('/messages')}
            className="text-base font-semibold text-brand-600 py-1"
          >
            Messages 💬
          </button>
        </div>

        {/* Error banner */}
        {error && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700">
            <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
            <p className="text-base">{error}</p>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center gap-4 py-16">
            <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
            <p className="text-gray-400 text-base">Loading check-in…</p>
          </div>
        ) : checkin ? (
          <CheckInCard checkin={checkin} />
        ) : (
          <EmptyState />
        )}

        {/* Refresh */}
        {!loading && (
          <div className="pb-4">
            <button
              onClick={() => fetchLatest(true)}
              disabled={refreshing}
              className="btn-primary flex items-center justify-center gap-2"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
