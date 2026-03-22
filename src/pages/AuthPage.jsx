import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Heart, Users, ChevronRight, Eye, EyeOff, AlertCircle } from 'lucide-react'

const ROLES = [
  {
    id: 'senior',
    label: 'I am a Senior',
    description: 'Age 65+, looking for support and connection',
    icon: '👴',
    color: 'border-brand-400 bg-brand-50',
    selectedColor: 'border-brand-600 bg-brand-100 ring-2 ring-brand-400',
  },
  {
    id: 'family',
    label: 'I am a Family Member',
    description: 'Adult child or caregiver supporting a loved one',
    icon: '👨‍👩‍👧',
    color: 'border-warm-400 bg-warm-50',
    selectedColor: 'border-warm-600 bg-warm-100 ring-2 ring-warm-400',
  },
]

function Logo() {
  return (
    <div className="flex flex-col items-center gap-2 mb-8">
      <div className="w-16 h-16 bg-brand-600 rounded-2xl flex items-center justify-center shadow-lg">
        <Heart className="w-9 h-9 text-white fill-white" />
      </div>
      <h1 className="text-3xl font-bold text-gray-900">VitalCircle</h1>
      <p className="text-gray-500 text-base text-center">
        Family care, made simple
      </p>
    </div>
  )
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

export default function AuthPage() {
  const [mode, setMode] = useState('landing') // landing | signin | signup
  const { signIn, signUp } = useAuth()

  return (
    <div className="min-h-screen bg-warm-50 flex flex-col">
      <div className="flex-1 flex flex-col justify-center px-6 py-10 max-w-md mx-auto w-full">
        {mode === 'landing' && <Landing onSignIn={() => setMode('signin')} onSignUp={() => setMode('signup')} />}
        {mode === 'signin' && <SignIn onBack={() => setMode('landing')} signIn={signIn} />}
        {mode === 'signup' && <SignUp onBack={() => setMode('landing')} signUp={signUp} onHaveAccount={() => setMode('signin')} />}
      </div>
    </div>
  )
}

function Landing({ onSignIn, onSignUp }) {
  return (
    <div className="flex flex-col gap-6">
      <Logo />

      <div className="card flex flex-col gap-3">
        <p className="text-lg font-medium text-gray-700 text-center">What VitalCircle does for you:</p>
        {[
          { icon: '✅', text: 'Daily well-being check-ins for peace of mind' },
          { icon: '💊', text: 'Medication reminders that actually stick' },
          { icon: '💬', text: 'Simple messaging with your whole family' },
          { icon: '🏥', text: 'Medicare guidance in plain English' },
        ].map(item => (
          <div key={item.text} className="flex items-center gap-3">
            <span className="text-2xl">{item.icon}</span>
            <p className="text-base text-gray-700">{item.text}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <button className="btn-primary" onClick={onSignUp}>
          Get Started — It's Free
        </button>
        <button className="btn-secondary" onClick={onSignIn}>
          I Already Have an Account
        </button>
      </div>

      <p className="text-center text-sm text-gray-400">
        Your information is private and secure
      </p>
    </div>
  )
}

function SignIn({ onBack, signIn }) {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn({ email, password })
    } catch (err) {
      setError(err.message || 'Sign in failed. Please check your email and password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Logo />

      <div className="card flex flex-col gap-5">
        <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>

        <ErrorBanner message={error} />

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-base font-medium text-gray-700 mb-1.5">
              Email address
            </label>
            <input
              type="email"
              className="input-field"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div>
            <label className="block text-base font-medium text-gray-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                className="input-field pr-14"
                placeholder="Your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 p-1"
                onClick={() => setShowPw(v => !v)}
                aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn-primary mt-1" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>

      <button
        onClick={onBack}
        className="text-brand-600 text-base font-medium text-center py-2"
      >
        ← Back
      </button>
    </div>
  )
}

function SignUp({ onBack, signUp, onHaveAccount }) {
  const [step, setStep]         = useState(1) // 1: role | 2: details
  const [role, setRole]         = useState('')
  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  function handleRoleNext() {
    if (!role) return
    setStep(2)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    setLoading(true)
    try {
      await signUp({ email, password, name, role })
    } catch (err) {
      setError(err.message || 'Sign up failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Logo />

      {/* Progress indicator */}
      <div className="flex items-center gap-3 px-1">
        {[1, 2].map(n => (
          <div key={n} className="flex items-center gap-3 flex-1">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-base font-bold transition-colors
              ${step >= n ? 'bg-brand-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
              {n}
            </div>
            {n < 2 && (
              <div className={`flex-1 h-1 rounded-full transition-colors
                ${step > n ? 'bg-brand-600' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
        <p className="text-sm text-gray-500 w-24 text-right">
          Step {step} of 2
        </p>
      </div>

      {step === 1 && (
        <div className="flex flex-col gap-5">
          <div className="card">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Who are you?</h2>
            <p className="text-base text-gray-500 mb-5">
              This helps us personalize your experience.
            </p>
            <div className="flex flex-col gap-4">
              {ROLES.map(r => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRole(r.id)}
                  className={`flex items-center gap-4 p-4 border-2 rounded-2xl text-left transition-all
                    ${role === r.id ? r.selectedColor : r.color}`}
                >
                  <span className="text-4xl">{r.icon}</span>
                  <div className="flex-1">
                    <p className="text-lg font-semibold text-gray-900">{r.label}</p>
                    <p className="text-sm text-gray-600 mt-0.5">{r.description}</p>
                  </div>
                  {role === r.id && (
                    <div className="w-6 h-6 bg-brand-600 rounded-full flex items-center justify-center shrink-0">
                      <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <button
            className="btn-primary"
            onClick={handleRoleNext}
            disabled={!role}
          >
            Continue <ChevronRight className="inline w-5 h-5 ml-1" />
          </button>

          <p className="text-center text-base text-gray-500">
            Already have an account?{' '}
            <button onClick={onHaveAccount} className="text-brand-600 font-medium">
              Sign in
            </button>
          </p>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-5">
          <div className="card flex flex-col gap-5">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Create your account</h2>
              <p className="text-base text-gray-500 mt-1">
                Joining as a{' '}
                <span className="font-semibold text-brand-700">
                  {role === 'senior' ? 'Senior' : 'Family Member'}
                </span>
              </p>
            </div>

            <ErrorBanner message={error} />

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-base font-medium text-gray-700 mb-1.5">
                  Your name
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="First and last name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  autoComplete="name"
                  required
                />
              </div>

              <div>
                <label className="block text-base font-medium text-gray-700 mb-1.5">
                  Email address
                </label>
                <input
                  type="email"
                  className="input-field"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>

              <div>
                <label className="block text-base font-medium text-gray-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    className="input-field pr-14"
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 p-1"
                    onClick={() => setShowPw(v => !v)}
                    aria-label={showPw ? 'Hide password' : 'Show password'}
                  >
                    {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button type="submit" className="btn-primary mt-1" disabled={loading}>
                {loading ? 'Creating account…' : 'Create My Account'}
              </button>
            </form>
          </div>

          <button
            onClick={() => setStep(1)}
            className="text-brand-600 text-base font-medium text-center py-2"
          >
            ← Back
          </button>
        </div>
      )}
    </div>
  )
}
