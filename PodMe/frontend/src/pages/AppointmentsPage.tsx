import { useEffect, useState } from 'react'
import { AppointmentForm } from '../components/AppointmentForm'
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

export function AppointmentsPage() {
  const { user, token } = useAuth()
  const isClient = user?.role === 'client'

  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [pets, setPets] = useState<Pet[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isRequesting, setIsRequesting] = useState(false)

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
    const updated = await action(id, token)
    setAppointments((prev) => prev.map((a) => (a.id === id ? updated : a)))
  }

  if (isLoading) return null

  return (
    <section className="auth-page pets-page">
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

      {appointments.length === 0 && <p>No appointments yet.</p>}

      <ul className="pet-list">
        {appointments.map((appointment) => (
          <li key={appointment.id} className="pet-card">
            <div className="pet-card-header">
              <strong>{appointment.pet?.name ?? 'Pet'}</strong>
              <span className="role-badge">{STATUS_LABEL[appointment.status]}</span>
            </div>
            <p>When: {formatScheduledAt(appointment.scheduled_at)}</p>
            {appointment.reason && <p>{appointment.reason}</p>}
            {!isClient && appointment.pet?.owner && <p>Owner: {appointment.pet.owner.name}</p>}
            <div className="pet-card-actions">
              {!isClient && appointment.status === 'requested' && (
                <button className="btn" onClick={() => handleTransition(confirmAppointment, appointment.id)}>
                  Confirm
                </button>
              )}
              {!isClient && appointment.status === 'confirmed' && (
                <button className="btn" onClick={() => handleTransition(completeAppointment, appointment.id)}>
                  Mark completed
                </button>
              )}
              {(appointment.status === 'requested' || appointment.status === 'confirmed') && (
                <button
                  className="btn btn-secondary"
                  onClick={() => handleTransition(cancelAppointment, appointment.id)}
                >
                  Cancel
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
