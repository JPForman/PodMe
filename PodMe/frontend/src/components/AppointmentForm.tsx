import { useState, type FormEvent } from 'react'
import { ApiError } from '../lib/api'
import type { AppointmentInput } from '../lib/appointments'
import type { Pet } from '../lib/pets'
import { FormField } from './FormField'

type AppointmentFormProps = {
  pets: Pet[]
  onSubmit: (input: AppointmentInput) => Promise<void>
  onCancel: () => void
}

export function AppointmentForm({ pets, onSubmit, onCancel }: AppointmentFormProps) {
  const [petId, setPetId] = useState(String(pets[0]?.id ?? ''))
  const [scheduledAt, setScheduledAt] = useState('')
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [minDateTime] = useState(
    () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16),
  )

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setFieldErrors({})
    setIsSubmitting(true)
    try {
      await onSubmit({ pet_id: Number(petId), scheduled_at: scheduledAt, reason: reason || undefined })
    } catch (err) {
      if (err instanceof ApiError && err.errors) {
        setFieldErrors(err.errors)
      } else {
        setError(err instanceof ApiError ? err.message : 'Something went wrong.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="pet-form">
      <label className="field">
        <span>Pet</span>
        <select value={petId} onChange={(e) => setPetId(e.target.value)} required>
          {pets.map((pet) => (
            <option key={pet.id} value={pet.id}>
              {pet.name}
            </option>
          ))}
        </select>
        {fieldErrors.pet_id?.[0] && <em className="field-error">{fieldErrors.pet_id[0]}</em>}
      </label>
      <FormField
        label="Date & time"
        type="datetime-local"
        value={scheduledAt}
        onChange={setScheduledAt}
        min={minDateTime}
        error={fieldErrors.scheduled_at?.[0]}
      />
      <FormField
        label="Reason"
        value={reason}
        onChange={setReason}
        required={false}
        multiline
        error={fieldErrors.reason?.[0]}
      />
      {error && <p className="form-error">{error}</p>}
      <div className="pet-form-actions">
        <button className="btn" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Requesting...' : 'Request appointment'}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  )
}
