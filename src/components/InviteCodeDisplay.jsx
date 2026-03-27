import { useEffect, useState } from 'react'
import { Copy, CheckCheck, Users, RefreshCw } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { createGroupForSenior } from '../utils/groupHelpers'

export default function InviteCodeDisplay() {
  const { user, refreshGroupStatus } = useAuth()

  const [inviteCode, setInviteCode] = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState('')
  const [copied,     setCopied]     = useState(false)
  const [continuing, setContinuing] = useState(false)

  useEffect(() => {
    async function setup() {
      try {
        const { inviteCode: code } = await createGroupForSenior(user.id)
        setInviteCode(code)
      } catch (err) {
        setError(err.message ?? 'Could not create your family group. Please try again.')
        console.error('[VitalCircle] createGroupForSenior error:', err)
      } finally {
        setLoading(false)
      }
    }
    setup()
  }, [user.id])

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(inviteCode)
    } catch {
      const el = document.createElement('textarea')
      el.value = inviteCode
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  async function handleContinue() {
    setContinuing(true)
    await refreshGroupStatus()
    // App.jsx will re-route once groupStatus.hasGroup becomes true
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-warm-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
          <p className="text-gray-500 text-lg">Setting up your family group…</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-warm-50 flex items-center justify-center px-5">
        <div className="card max-w-sm w-full flex flex-col items-center gap-4 text-center">
          <span className="text-5xl">⚠️</span>
          <p className="text-lg font-semibold text-red-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-5 h-5" />
            Try again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-warm-50">
      <div className="max-w-[480px] mx-auto px-5 py-10 flex flex-col gap-6">

        {/* Header */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Users className="w-7 h-7 text-brand-600" />
            <h1 className="text-2xl font-bold text-gray-900">Your Family Code</h1>
          </div>
          <p className="text-base text-gray-500">
            Share this code with your family so they can connect and see your daily check-ins.
          </p>
        </div>

        {/* Code display */}
        <div className="card flex flex-col items-center gap-5 py-8">
          <p className="text-sm font-semibold text-gray-400 uppercase tracking-widest">
            Invite code
          </p>
          <div className="flex gap-2">
            {inviteCode.split('').map((char, i) => (
              <div
                key={i}
                className="w-11 h-14 rounded-xl bg-brand-50 border-2 border-brand-200
                           flex items-center justify-center
                           text-3xl font-bold text-brand-700 select-all"
              >
                {char}
              </div>
            ))}
          </div>
          <button
            onClick={handleCopy}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-base transition-all
              ${copied
                ? 'bg-green-100 text-green-700 border border-green-200'
                : 'bg-brand-600 text-white hover:bg-brand-700 active:scale-95'
              }`}
          >
            {copied ? <CheckCheck className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            {copied ? 'Copied!' : 'Copy code'}
          </button>
        </div>

        {/* Instructions */}
        <div className="card bg-blue-50 border-blue-100 flex flex-col gap-3">
          <p className="text-sm font-semibold text-blue-700 uppercase tracking-wide">
            How it works
          </p>
          <ol className="flex flex-col gap-2 text-base text-blue-900">
            <li className="flex gap-2">
              <span className="font-bold shrink-0">1.</span>
              Share this 6-letter code with your family member
            </li>
            <li className="flex gap-2">
              <span className="font-bold shrink-0">2.</span>
              They create a VitalCircle account and enter the code
            </li>
            <li className="flex gap-2">
              <span className="font-bold shrink-0">3.</span>
              You're connected — they'll see your daily check-ins
            </li>
          </ol>
        </div>

        <button
          onClick={handleContinue}
          disabled={continuing}
          className="btn-primary flex items-center justify-center gap-2"
        >
          {continuing ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Loading…
            </>
          ) : (
            "I've shared my code — Continue →"
          )}
        </button>

      </div>
    </div>
  )
}
