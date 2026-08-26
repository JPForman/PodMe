import { useState, type FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'
import { ApiError } from '../lib/api'
import { createNote, listNotes, type Note } from '../lib/notes'

type NotesSectionProps = {
  appointmentId: number
  canWrite: boolean
}

export function NotesSection({ appointmentId, canWrite }: NotesSectionProps) {
  const { token } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [notes, setNotes] = useState<Note[] | null>(null)
  const [content, setContent] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function open() {
    setIsOpen(true)
    if (notes !== null || !token) return
    try {
      setNotes(await listNotes(appointmentId, token))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load notes.')
    }
  }

  async function handleAdd(e: FormEvent) {
    e.preventDefault()
    if (!token || !content.trim()) return
    setError('')
    setIsSubmitting(true)
    try {
      const note = await createNote(appointmentId, { content }, token)
      setNotes((prev) => [note, ...(prev ?? [])])
      setContent('')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to add note.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) {
    return (
      <button type="button" className="btn btn-secondary" onClick={open}>
        Notes
      </button>
    )
  }

  return (
    <div className="notes-section">
      {error && <p className="form-error">{error}</p>}
      {notes === null && <p>Loading notes...</p>}
      {notes?.length === 0 && <p>No notes yet.</p>}
      {notes && notes.length > 0 && (
        <ul className="notes-list">
          {notes.map((note) => (
            <li key={note.id} className="note-item">
              <p>{note.content}</p>
              <span className="note-meta">
                {note.author?.name ?? 'Staff'} · {new Date(note.created_at).toLocaleDateString()}
              </span>
            </li>
          ))}
        </ul>
      )}
      {canWrite && (
        <form onSubmit={handleAdd} className="note-form">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Add a note..."
            required
          />
          <button className="btn" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Adding...' : 'Add note'}
          </button>
        </form>
      )}
    </div>
  )
}
