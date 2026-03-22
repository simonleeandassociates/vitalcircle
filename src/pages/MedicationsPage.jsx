import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Trash2, AlertCircle, Plus } from 'lucide-react'

const REMINDER_OPTIONS = [
  { id: 'morning',  label: 'Morning', time: '8AM'  },
  { id: 'noon',     label: 'Noon',    time: '12PM' },
  { id: 'evening',  label: 'Evening', time: '6PM'  },
  { id: 'bedtime',  label: 'Bedtime', time: '9PM'  },
]

function ReminderBadge({ value }) {
  const opt = REMINDER_OPTIONS.find(o => o.id === value)
  const label = opt ? `${opt.label} ${opt.time}` : value
  return (
    <span className="inline-block px-3 py-1 bg-brand-100 text-brand-700 text-sm font-semibold rounded-full">
      {label}
    </span>
  )
}

function MedCard({ med, onDelete }) {
  const [confirming, setConfirming] = useState(false)

  return (
    <div className="card flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5 min-w-0">
          <p className="text-xl font-bold text-gray-900 leading-tight">{med.name}</p>
          {med.dosage && (
            <p className="text-base text-gray-400">{med.dosage}</p>
          )}
        </div>
        {onDelete && !confirming && (
          <button
            onClick={() => setConfirming(true)}
            className="p-2 text-red-400 hover:text-red-600 active:scale-95 transition-all shrink-0"
            aria-label={`Remove ${med.name}`}
          >
            <Trash2 className="w-6 h-6" />
          </button>
        )}
      </div>

      {med.reminder_times?.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {med.reminder_times.map(t => (
            <ReminderBadge key={t} value={t} />
          ))}
        </div>
      )}

      {confirming && (
        <div className="flex flex-col gap-3 pt-2 border-t border-gray-100">
          <p className="text-base font-semibold text-red-600">Remove this medication?</p>
          <div className="flex gap-3">
            <button
              onClick={() => setConfirming(false)}
              className="flex-1 py-3 text-base font-semibold rounded-2xl border-2 border-gray-200 bg-white text-gray-700 active:scale-95 transition-all"
            >
              No
            </button>
            <button
              onClick={() => onDelete(med.id)}
              className="flex-1 py-3 text-base font-semibold rounded-2xl bg-red-500 text-white border-2 border-red-500 active:scale-95 transition-all"
            >
              Yes, remove
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function EmptyState({ isFamilyView }) {
  return (
    <div className="card bg-gray-50 border-gray-100 flex flex-col items-center gap-3 py-10 text-center">
      <span className="text-5xl">💊</span>
      <p className="text-xl font-semibold text-gray-700">No medications added yet</p>
      <p className="text-base text-gray-400">
        {isFamilyView
          ? 'Add your senior\'s medications using the form above'
          : 'Your family will add your medications here'}
      </p>
    </div>
  )
}

function AddMedForm({ onAdd }) {
  const [name,     setName]     = useState('')
  const [dosage,   setDosage]   = useState('')
  const [times,    setTimes]    = useState([])
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  function toggleTime(id) {
    setTimes(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    )
  }

  async function handleAdd(e) {
    e.preventDefault()
    if (!name.trim()) return
    setError('')
    setLoading(true)
    try {
      await onAdd({ name: name.trim(), dosage: dosage.trim() || null, reminder_times: times })
      setName('')
      setDosage('')
      setTimes([])
    } catch (err) {
      setError(err.message || 'Could not add medication. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card flex flex-col gap-4">
      <p className="text-xl font-bold text-gray-900">Add Medication</p>

      {error && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700">
          <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
          <p className="text-base">{error}</p>
        </div>
      )}

      <form onSubmit={handleAdd} className="flex flex-col gap-4">
        <div>
          <label className="block text-base font-medium text-gray-700 mb-1.5">
            Medication name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            className="input-field"
            placeholder="e.g. Lisinopril"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-base font-medium text-gray-700 mb-1.5">
            Dosage <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            type="text"
            className="input-field"
            placeholder="e.g. 10mg"
            value={dosage}
            onChange={e => setDosage(e.target.value)}
          />
        </div>

        <div>
          <p className="text-base font-medium text-gray-700 mb-2">Reminder times</p>
          <div className="grid grid-cols-2 gap-2">
            {REMINDER_OPTIONS.map(opt => {
              const selected = times.includes(opt.id)
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => toggleTime(opt.id)}
                  className={`py-3 px-4 rounded-2xl border-2 text-base font-semibold transition-all active:scale-95
                    ${selected
                      ? 'bg-brand-600 border-brand-600 text-white shadow-sm'
                      : 'bg-white border-gray-200 text-gray-600'}`}
                >
                  {opt.label}
                  <span className={`block text-sm font-normal ${selected ? 'text-brand-100' : 'text-gray-400'}`}>
                    {opt.time}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <button
          type="submit"
          className="btn-primary flex items-center justify-center gap-2"
          disabled={!name.trim() || loading}
        >
          <Plus className="w-5 h-5" />
          {loading ? 'Adding…' : 'Add Medication'}
        </button>
      </form>
    </div>
  )
}

export default function MedicationsPage() {
  const { profile } = useAuth()
  const navigate    = useNavigate()
  const isSenior    = profile?.role === 'senior'

  const [meds,    setMeds]    = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  const fetchMeds = useCallback(async () => {
    setError('')
    try {
      const { data, error: fetchError } = await supabase
        .from('medications')
        .select('*')
        .order('created_at', { ascending: false })
      if (fetchError) throw fetchError
      setMeds(data ?? [])
    } catch (err) {
      setError('Could not load medications. Please try again.')
      console.error('[VitalCircle] fetchMeds error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchMeds() }, [fetchMeds])

  async function handleAdd({ name, dosage, reminder_times }) {
    const { data, error: insertError } = await supabase
      .from('medications')
      .insert({ name, dosage, reminder_times })
      .select()
      .single()
    if (insertError) throw insertError
    setMeds(prev => [data, ...prev])
  }

  async function handleDelete(id) {
    const { error: deleteError } = await supabase
      .from('medications')
      .delete()
      .eq('id', id)
    if (deleteError) {
      console.error('[VitalCircle] delete med error:', deleteError)
      return
    }
    setMeds(prev => prev.filter(m => m.id !== id))
  }

  return (
    <div className="min-h-screen bg-warm-50">
      <div className="max-w-[480px] mx-auto px-5 py-8 flex flex-col gap-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">
            {isSenior ? 'My Medications 💊' : 'Medications 💊'}
          </h1>
          <button
            onClick={() => navigate(isSenior ? '/checkin' : '/family-dashboard')}
            className="text-base text-brand-600 font-medium py-2 px-1"
          >
            ← Back
          </button>
        </div>

        {/* Error banner */}
        {error && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700">
            <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
            <p className="text-base">{error}</p>
          </div>
        )}

        {/* Add form — family only */}
        {!isSenior && <AddMedForm onAdd={handleAdd} />}

        {/* Medication list */}
        {loading ? (
          <div className="flex flex-col items-center gap-4 py-12">
            <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
            <p className="text-gray-400 text-base">Loading medications…</p>
          </div>
        ) : meds.length === 0 ? (
          <EmptyState isFamilyView={!isSenior} />
        ) : (
          <div className="flex flex-col gap-4">
            {meds.map(med => (
              <MedCard
                key={med.id}
                med={med}
                onDelete={isSenior ? null : handleDelete}
              />
            ))}
          </div>
        )}

        {/* Info message — senior only */}
        {isSenior && !loading && (
          <p className="text-center text-sm text-gray-400 pb-4">
            Your family manages your medication list
          </p>
        )}

      </div>
    </div>
  )
}
