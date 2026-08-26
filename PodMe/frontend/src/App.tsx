import { Link, Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import { useAuth } from './context/AuthContext'
import { AdminUsersPage } from './pages/AdminUsersPage'
import { AppointmentsPage } from './pages/AppointmentsPage'
import { DashboardPage } from './pages/DashboardPage'
import { LoginPage } from './pages/LoginPage'
import { PetsPage } from './pages/PetsPage'
import { RegisterPage } from './pages/RegisterPage'
import { ProtectedRoute } from './routes/ProtectedRoute'

function HomePage() {
  const { user } = useAuth()
  if (user) return <Navigate to="/dashboard" replace />

  return (
    <section id="center">
      <h1>PodMe</h1>
      <p>
        <Link to="/login">Log in</Link> or <Link to="/register">register</Link> to continue.
      </p>
    </section>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pets"
        element={
          <ProtectedRoute>
            <PetsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/appointments"
        element={
          <ProtectedRoute>
            <AppointmentsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute roles={['admin']}>
            <AdminUsersPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default App
