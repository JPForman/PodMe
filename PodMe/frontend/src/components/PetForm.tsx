import { useState, type FormEvent } from 'react'
import { ApiError } from '../lib/api'
import type { PetInput } from '../lib/pets'
import { FormField } from './FormField'

type PetFormProps = {
  initial?: Partial<Record<keyof PetInput, string | null>>
  submitLabel: string
  onSubmit: (input: PetInput) => Promise<void>
  onCancel: () => void
}

export function PetForm({ initial, submitLabel, onSubmit, onCancel }: PetFormProps) {
  const [values, setValues] = useState<PetInput>({
    name: initial?.name ?? '',
    species: initial?.species ?? '',
    breed: initial?.breed ?? '',
    date_of_birth: initial?.date_of_birth?.slice(0, 10) ?? '',
    weight: initial?.weight ?? '',
    notes: initial?.notes ?? '',
  })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  function set(key: keyof PetInput) {
    return (value: string) => setValues((v) => ({ ...v, [key]: value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      await onSubmit(values)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="pet-form">
      <FormField label="Name" value={values.name} onChange={set('name')} />
      <FormField label="Species" value={values.species} onChange={set('species')} />
      <FormField label="Breed" value={values.breed ?? ''} onChange={set('breed')} required={false} />
      <FormField
        label="Date of birth"
        type="date"
        value={values.date_of_birth ?? ''}
        onChange={set('date_of_birth')}
        required={false}
      />
      <FormField
        label="Weight (lbs)"
        type="number"
        value={values.weight ?? ''}
        onChange={set('weight')}
        required={false}
      />
      <FormField
        label="Notes"
        value={values.notes ?? ''}
        onChange={set('notes')}
        required={false}
        multiline
      />
      {error && <p className="form-error">{error}</p>}
      <div className="pet-form-actions">
        <button className="btn" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : submitLabel}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  )
}
