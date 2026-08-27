import { useEffect, useState } from 'react'
import { CalendarClock, CheckCircle2, ClipboardCheck, Clock, XCircle } from 'lucide-react'
import { AppointmentForm } from '../components/AppointmentForm'
import { NotesSection } from '../components/NotesSection'
import { useAuth } from '../context/AuthContext'
import { ApiError } from '../lib/api'
import {
  cancelAppointment,
  completeAppointment,
  confirmAppointment,
  formatScheduledAt,
  listAppointments,
  requestAppointment,
  type Appointment,
  type AppointmentInput,
} from '../lib/appointments'
import { listPets, type Pet } from '../lib/pets'

const STATUS_LABEL: Record<Appointment['status'], string> = {
  requested: 'Requested',
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

const STATUS_CLASS: Record<Appointment['status'], string> = {
  requested: 'status-requested',
  confirmed: 'status-confirmed',
  completed: 'status-completed',
  cancelled: 'status-cancelled',
}

const STATUS_ICON: Record<Appointment['status'], typeof Clock> = {
  requested: Clock,
  confirmed: CheckCircle2,
  completed: ClipboardCheck,
  cancelled: XCircle,
}

export function AppointmentsPage() {
  const { user, token } = useAuth()
  const isClient = user?.role === 'client'

  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [pets, setPets] = useState<Pet[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isRequesting, setIsRequesting] = useState(false)
  const [pendingId, setPendingId] = useState<number | null>(null)

  useEffect(() => {
    if (!token) return
    Promise.all([listAppointments(token), isClient ? listPets(token) : Promise.resolve([])])
      .then(([appts, myPets]) => {
        setAppointments(appts)
        setPets(myPets)
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load appointments.'))
      .finally(() => setIsLoading(false))
  }, [token, isClient])

  async function handleRequest(input: AppointmentInput) {
    if (!token) return
    const appointment = await requestAppointment(input, token)
    setAppointments((prev) => [...prev, appointment])
    setIsRequesting(false)
  }

  async function handleTransition(action: (id: number, token: string) => Promise<Appointment>, id: number) {
    if (!token) return
    setPendingId(id)
    try {
      const updated = await action(id, token)
      setAppointments((prev) => prev.map((a) => (a.id === id ? updated : a)))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update appointment.')
    } finally {
      setPendingId(null)
    }
  }

  if (isLoading) return <p className="loading-text">Loading appointments...</p>

  return (
    <section className="page">
      <h2>{isClient ? 'Your appointments' : 'All appointments'}</h2>
      {error && <p className="form-error">{error}</p>}

      {isClient && !isRequesting && pets.length > 0 && (
        <button className="btn" onClick={() => setIsRequesting(true)}>
          Request an appointment
        </button>
      )}
      {isClient && pets.length === 0 && <p>Add a pet before requesting an appointment.</p>}
      {isClient && isRequesting && (
        <AppointmentForm pets={pets} onSubmit={handleRequest} onCancel={() => setIsRequesting(false)} />
      )}

      {appointments.length === 0 && !isRequesting && (
        <div className="empty-state">
          <img
            className="empty-state-image"
            src="https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=320&q=70&auto=format&fit=crop"
            alt="A French bulldog puppy in a yellow hoodie"
            loading="lazy"
          />
          <CalendarClock className="empty-state-icon" size={28} />
          <p>No appointments yet.</p>
          {isClient && pets.length > 0 && (
            <button className="btn empty-state-cta" onClick={() => setIsRequesting(true)}>
              Request an appointment
            </button>
          )}
        </div>
      )}

      <ul className="pet-list">
        {appointments.map((appointment) => {
          const StatusIcon = STATUS_ICON[appointment.status]
          return (
          <li key={appointment.id} className="pet-card">
            <div className="pet-card-header">
              <strong>{appointment.pet?.name ?? 'Pet'}</strong>
              <span className={`status-badge ${STATUS_CLASS[appointment.status]}`}>
                <StatusIcon size={13} />
                {STATUS_LABEL[appointment.status]}
              </span>
            </div>
            <p>When: {formatScheduledAt(appointment.scheduled_at)}</p>
            {appointment.reason && <p>{appointment.reason}</p>}
            {!isClient && appointment.pet?.owner && <p>Owner: {appointment.pet.owner.name}</p>}
            <div className="pet-card-actions">
              {!isClient && appointment.status === 'requested' && (
                <button
                  className="btn"
                  disabled={pendingId === appointment.id}
                  onClick={() => handleTransition(confirmAppointment, appointment.id)}
                >
                  <CheckCircle2 size={14} />
                  Confirm
                </button>
              )}
              {!isClient && appointment.status === 'confirmed' && (
                <button
                  className="btn"
                  disabled={pendingId === appointment.id}
                  onClick={() => handleTransition(completeAppointment, appointment.id)}
                >
                  <ClipboardCheck size={14} />
                  Mark completed
                </button>
              )}
              {(appointment.status === 'requested' || appointment.status === 'confirmed') && (
                <button
                  className="btn btn-secondary"
                  disabled={pendingId === appointment.id}
                  onClick={() => handleTransition(cancelAppointment, appointment.id)}
                >
                  <XCircle size={14} />
                  Cancel
                </button>
              )}
            </div>
            <NotesSection appointmentId={appointment.id} canWrite={!isClient} />
          </li>
          )
        })}
      </ul>
    </section>
  )
}
