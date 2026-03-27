import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { AlertCircle, CheckCircle, Copy, CheckCheck, ChevronDown, ChevronUp } from 'lucide-react'

const FEELING_OPTIONS = [
  { score: 1, emoji: '😞', label: 'Rough' },
  { score: 2, emoji: '😕', label: 'Not great' },
  { score: 3, emoji: '😐', label: 'Okay' },
  { score: 4, emoji: '🙂', label: 'Good' },
  { score: 5, emoji: '😊', label: 'Great' },
]

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function ErrorBanner({ message }) {
  if (!message) return null
  return (
    <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700">
      <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
      <p className="text-base leading-snug">{message}</p>
    </div>
  )
}

function YesNoButtons({ value, onChange, yesLabel = 'Yes', noLabel = 'No' }) {
  return (
    <div className="flex gap-3">
      <button
        type="button"
        onClick={() => onChange(true)}
        className={`flex-1 py-4 text-lg font-semibold rounded-2xl border-2 transition-all active:scale-95
          ${value === true
            ? 'bg-green-500 border-green-500 text-white shadow-md'
            : 'bg-white border-gray-200 text-gray-700'}`}
      >
        {yesLabel}
      </button>
      <button
        type="button"
        onClick={() => onChange(false)}
        className={`flex-1 py-4 text-lg font-semibold rounded-2xl border-2 transition-all active:scale-95
          ${value === false
            ? 'bg-red-400 border-red-400 text-white shadow-md'
            : 'bg-white border-gray-200 text-gray-700'}`}
      >
        {noLabel}
      </button>
    </div>
  )
}

function SuccessScreen({ onDone }) {
  return (
    <div className="min-h-screen bg-warm-50 flex flex-col items-center justify-center px-6">
      <div className="max-w-sm w-full flex flex-col items-center gap-6 text-center">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle className="w-14 h-14 text-green-500" strokeWidth={1.5} />
        </div>

        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Check-in complete! 🎉
          </h2>
          <p className="text-lg text-gray-500">
            Your family has been notified
          </p>
        </div>

        <div className="w-full card bg-green-50 border-green-100 text-center">
          <p className="text-base text-green-800">
            Great job taking care of yourself today. See you tomorrow! 💚
          </p>
        </div>

        <button onClick={onDone} className="btn-primary w-full max-w-sm">
          Done
        </button>
      </div>
    </div>
  )
}

function InviteCodeBanner({ code }) {
  const [open,   setOpen]   = useState(false)
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try { await navigator.clipboard.writeText(code) } catch { /* ignore */ }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="card bg-blue-50 border-blue-100 flex flex-col gap-2">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center justify-between w-full text-left"
      >
        <span className="text-sm font-semibold text-blue-700">
          👨‍👩‍👧 Share your invite code with family
        </span>
        {open
          ? <ChevronUp className="w-4 h-4 text-blue-500 shrink-0" />
          : <ChevronDown className="w-4 h-4 text-blue-500 shrink-0" />
        }
      </button>
      {open && (
        <div className="flex items-center justify-between gap-3 pt-1">
          <span className="text-2xl font-bold tracking-[0.25em] text-brand-700 select-all">
            {code}
          </span>
          <button
            onClick={handleCopy}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all
              ${copied
                ? 'bg-green-100 text-green-700'
                : 'bg-brand-600 text-white active:scale-95'}`}
          >
            {copied ? <CheckCheck className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      )}
    </div>
  )
}

export default function CheckInPage() {
  const { profile, groupStatus, signOut } = useAuth()
  const navigate = useNavigate()

  const [feelingScore, setFeelingScore]       = useState(null)
  const [medicationsTaken, setMedicationsTaken] = useState(null)
  const [needsHelp, setNeedsHelp]             = useState(null)
  const [notes, setNotes]                     = useState('')
  const [loading, setLoading]                 = useState(false)
  const [error, setError]                     = useState('')
  const [submitted, setSubmitted]             = useState(false)

  const canSubmit = feelingScore !== null

  async function handleSubmit() {
    if (!canSubmit) return
    setError('')
    setLoading(true)
    try {
      const { data, error: insertError } = await supabase.from('checkins').insert({
        user_id:          profile.id,
        feeling_score:    feelingScore,
        medications_taken: medicationsTaken ?? false,
        needs_help:       needsHelp ?? false,
        notes:            notes.trim() || null,
      }).select().single()
      if (insertError) throw insertError

      try {
        await supabase.functions.invoke('send-checkin-notification', {
          body: { checkin_id: data.id, user_id: profile.id },
        })
      } catch (notifErr) {
        console.error('[VitalCircle] Notification failed:', notifErr)
      }

      setSubmitted(true)
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return <SuccessScreen onDone={signOut} />
  }

  return (
    <div className="min-h-screen bg-warm-50">
      <div className="max-w-[480px] mx-auto px-5 py-8 flex flex-col gap-6">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 leading-tight">
            {getGreeting()}, {profile?.name?.split(' ')[0] ?? 'there'} 👋
          </h1>
          <p className="text-lg text-gray-500 mt-1">How are you doing today?</p>
        </div>

        {groupStatus?.inviteCode && (
          <InviteCodeBanner code={groupStatus.inviteCode} />
        )}

        <ErrorBanner message={error} />

        {/* Q1 — Feeling score */}
        <div className="card flex flex-col gap-4">
          <div>
            <p className="text-xl font-semibold text-gray-900">How are you feeling?</p>
            <p className="text-base text-gray-400 mt-0.5">Tap the face that matches how you feel</p>
          </div>
          <div className="flex justify-between gap-2">
            {FEELING_OPTIONS.map(({ score, emoji, label }) => (
              <button
                key={score}
                type="button"
                onClick={() => setFeelingScore(score)}
                className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-2xl border-2 transition-all active:scale-95
                  ${feelingScore === score
                    ? 'border-brand-500 bg-brand-50 shadow-md'
                    : 'border-gray-100 bg-gray-50'}`}
              >
                <span className="text-3xl leading-none">{emoji}</span>
                <span className={`text-xs font-medium leading-tight text-center
                  ${feelingScore === score ? 'text-brand-700' : 'text-gray-400'}`}>
                  {label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Q2 — Medications */}
        <div className="card flex flex-col gap-4">
          <div>
            <p className="text-xl font-semibold text-gray-900">Did you take your medications today?</p>
          </div>
          <YesNoButtons value={medicationsTaken} onChange={setMedicationsTaken} />
        </div>

        {/* Q3 — Needs help */}
        <div className="card flex flex-col gap-4">
          <div>
            <p className="text-xl font-semibold text-gray-900">Do you need any help today?</p>
          </div>
          <YesNoButtons value={needsHelp} onChange={setNeedsHelp} />
        </div>

        {/* Notes */}
        <div className="card flex flex-col gap-3">
          <p className="text-xl font-semibold text-gray-900">Anything else you'd like to share?</p>
          <textarea
            className="input-field resize-none"
            rows={4}
            placeholder="Type here..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
          <p className="text-sm text-gray-400 text-right">{notes.length}/500</p>
        </div>

        {/* Quick links */}
        <div className="flex gap-6 px-1">
          <button
            onClick={() => navigate('/medications')}
            className="text-base font-semibold text-brand-600 py-1"
          >
            My Medications 💊
          </button>
          <button
            onClick={() => navigate('/messages')}
            className="text-base font-semibold text-brand-600 py-1"
          >
            Messages 💬
          </button>
        </div>

        {/* Submit */}
        <div className="pb-6">
          {!canSubmit && (
            <p className="text-center text-base text-gray-400 mb-3">
              Select how you're feeling to continue
            </p>
          )}
          <button
            onClick={handleSubmit}
            className="btn-primary"
            disabled={!canSubmit || loading}
          >
            {loading ? 'Submitting…' : 'Submit Check-in'}
          </button>
        </div>

      </div>
    </div>
  )
}
