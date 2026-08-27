import { CalendarClock, LogOut, PawPrint, ShieldCheck } from 'lucide-react'
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
    <section className="page">
      <div className="dashboard-banner">
        <img
          src="https://images.unsplash.com/photo-1544568100-847a948585b9?w=1000&q=70&auto=format&fit=crop"
          alt="A happy dog outdoors"
          loading="lazy"
        />
        <div className="dashboard-banner-content">
          <h2>Welcome, {user.name}</h2>
        </div>
      </div>

      <div className="dashboard-header">
        <span className="role-badge">{user.role}</span>
        <button className="btn btn-secondary" onClick={handleLogout}>
          <LogOut size={16} />
          Log out
        </button>
      </div>

      <h3>{content.heading}</h3>
      <p>{content.body}</p>

      <div className="services-grid">
        <Link to="/pets" className="service-card">
          <div className="service-icon">
            <PawPrint size={20} />
          </div>
          <h3>{user.role === 'client' ? 'Manage your pets' : 'View all pets'}</h3>
        </Link>
        <Link to="/appointments" className="service-card">
          <div className="service-icon">
            <CalendarClock size={20} />
          </div>
          <h3>{user.role === 'client' ? 'Your appointments' : 'View all appointments'}</h3>
        </Link>
        {user.role === 'admin' && (
          <Link to="/admin/users" className="service-card">
            <div className="service-icon">
              <ShieldCheck size={20} />
            </div>
            <h3>Manage users</h3>
          </Link>
        )}
      </div>
    </section>
  )
}
