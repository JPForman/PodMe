import { apiFetch } from './api'
import type { Pet } from './pets'

export type AppointmentStatus = 'requested' | 'confirmed' | 'completed' | 'cancelled'

export type Appointment = {
  id: number
  pet_id: number
  status: AppointmentStatus
  scheduled_at: string
  reason: string | null
  pet?: Pet & { owner?: { id: number; name: string; email: string } }
}

export type AppointmentInput = {
  pet_id: number
  scheduled_at: string
  reason?: string
}

export function listAppointments(token: string): Promise<Appointment[]> {
  return apiFetch('/api/appointments', {}, token)
}

export function requestAppointment(input: AppointmentInput, token: string): Promise<Appointment> {
  return apiFetch('/api/appointments', { method: 'POST', body: JSON.stringify(input) }, token)
}

export function confirmAppointment(id: number, token: string): Promise<Appointment> {
  return apiFetch(`/api/appointments/${id}/confirm`, { method: 'PATCH' }, token)
}

export function completeAppointment(id: number, token: string): Promise<Appointment> {
  return apiFetch(`/api/appointments/${id}/complete`, { method: 'PATCH' }, token)
}

export function cancelAppointment(id: number, token: string): Promise<Appointment> {
  return apiFetch(`/api/appointments/${id}/cancel`, { method: 'PATCH' }, token)
}

/**
 * The backend has no timezone concept (one physical vet office, plain
 * datetime column) — scheduled_at comes back UTC-labeled only because
 * Eloquent's datetime cast always serializes that way. Building the Date
 * from the literal digits (instead of `new Date(isoString)`) avoids
 * `toLocaleString` re-shifting them through the browser's UTC offset, so
 * the displayed time always matches what was entered.
 */
export function formatScheduledAt(scheduledAt: string): string {
  const [year, month, day, hour, minute] = scheduledAt.split(/[-T:]/).map(Number)
  const date = new Date(year, month - 1, day, hour, minute)
  return date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}
