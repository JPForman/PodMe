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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  function set(key: keyof PetInput) {
    return (value: string) => setValues((v) => ({ ...v, [key]: value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setFieldErrors({})
    setIsSubmitting(true)
    try {
      await onSubmit(values)
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
      <FormField label="Name" value={values.name} onChange={set('name')} error={fieldErrors.name?.[0]} />
      <FormField
        label="Species"
        value={values.species}
        onChange={set('species')}
        error={fieldErrors.species?.[0]}
      />
      <FormField
        label="Breed"
        value={values.breed ?? ''}
        onChange={set('breed')}
        required={false}
        error={fieldErrors.breed?.[0]}
      />
      <FormField
        label="Date of birth"
        type="date"
        value={values.date_of_birth ?? ''}
        onChange={set('date_of_birth')}
        required={false}
        error={fieldErrors.date_of_birth?.[0]}
      />
      <FormField
        label="Weight (lbs)"
        type="number"
        min="0"
        step="any"
        value={values.weight ?? ''}
        onChange={set('weight')}
        required={false}
        error={fieldErrors.weight?.[0]}
      />
      <FormField
        label="Notes"
        value={values.notes ?? ''}
        onChange={set('notes')}
        required={false}
        multiline
        error={fieldErrors.notes?.[0]}
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
