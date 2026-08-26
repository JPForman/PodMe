import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ROLE_CONTENT: Record<string, { heading: string; body: string }> = {
  admin: {
    heading: 'Admin tools',
    body: 'Manage employee accounts (coming in a later step).',
  },
  employee: {
    heading: "Today's schedule",
    body: 'View and update appointments (coming in a later step).',
  },
  client: {
    heading: 'Your pets',
    body: 'Book an appointment and view visit notes (coming in a later step).',
  },
}

export function DashboardPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  if (!user) return null
  const content = ROLE_CONTENT[user.role]

  return (
    <section className="auth-page">
      <div className="dashboard-header">
        <h2>Welcome, {user.name}</h2>
        <button className="btn" onClick={handleLogout}>
          Log out
        </button>
      </div>
      <p>
        <span className="role-badge">{user.role}</span>
      </p>
      <h3>{content.heading}</h3>
      <p>{content.body}</p>
      <p>
        <Link to="/pets">{user.role === 'client' ? 'Manage your pets' : 'View all pets'}</Link>
      </p>
      <p>
        <Link to="/appointments">
          {user.role === 'client' ? 'Your appointments' : 'View all appointments'}
        </Link>
      </p>
    </section>
  )
}
