import { apiFetch } from './api'

export type Note = {
  id: number
  appointment_id: number
  author_id: number
  content: string
  created_at: string
  author?: { id: number; name: string }
}

export type NoteInput = {
  content: string
}

export function listNotes(appointmentId: number, token: string): Promise<Note[]> {
  return apiFetch(`/api/appointments/${appointmentId}/notes`, {}, token)
}

export function createNote(appointmentId: number, input: NoteInput, token: string): Promise<Note> {
  return apiFetch(
    `/api/appointments/${appointmentId}/notes`,
    { method: 'POST', body: JSON.stringify(input) },
    token,
  )
}
