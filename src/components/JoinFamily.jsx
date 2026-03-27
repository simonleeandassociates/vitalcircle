import { useState } from 'react'
import { UserPlus, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { joinGroupWithCode } from '../utils/groupHelpers'

export default function JoinFamily() {
  const { user, refreshGroupStatus } = useAuth()

  const [code,    setCode]    = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  function handleCodeChange(e) {
    // Auto-uppercase, strip non-alphanumeric
    setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))
  }

  async function handleJoin(e) {
    e.preventDefault()
    if (code.length !== 6) {
      setError('Please enter the full 6-character code.')
      return
    }
    setError('')
    setLoading(true)
    try {
      await joinGroupWithCode(user.id, code)
      await refreshGroupStatus()
      // App.jsx will re-route to /family-dashboard once groupStatus.hasGroup is true
    } catch (err) {
      setError(err.message ?? 'Something went wrong. Please try again.')
      console.error('[VitalCircle] joinGroupWithCode error:', err)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-warm-50 flex items-center justify-center px-5">
      <div className="max-w-[480px] w-full flex flex-col gap-6">

        {/* Header */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center">
            <UserPlus className="w-8 h-8 text-brand-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Join Your Family</h1>
          <p className="text-base text-gray-500 max-w-xs">
            Enter the 6-letter invite code from your senior's VitalCircle app.
          </p>
        </div>

        {/* Input form */}
        <div className="card flex flex-col gap-5">

          {error && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700">
              <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
              <p className="text-base">{error}</p>
            </div>
          )}

          <form onSubmit={handleJoin} className="flex flex-col gap-4">
            <div>
              <label className="block text-base font-semibold text-gray-700 mb-2">
                Invite code
              </label>
              <input
                type="text"
                inputMode="text"
                autoCapitalize="characters"
                autoCorrect="off"
                autoComplete="off"
                spellCheck={false}
                className="input-field text-center text-2xl font-bold tracking-[0.35em] uppercase"
                placeholder="ABC123"
                maxLength={6}
                value={code}
                onChange={handleCodeChange}
              />
              <p className="text-sm text-gray-400 mt-1.5 text-center">
                {code.length} / 6 characters
              </p>
            </div>

            <button
              type="submit"
              className="btn-primary flex items-center justify-center gap-2"
              disabled={code.length !== 6 || loading}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Joining…
                </>
              ) : (
                'Join Family Group'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-400 px-4">
          Ask your senior to open their VitalCircle app to find their invite code.
        </p>

      </div>
    </div>
  )
}
