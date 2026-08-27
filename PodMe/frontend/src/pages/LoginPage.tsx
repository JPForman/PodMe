import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FormField } from '../components/FormField'
import { useAuth } from '../context/AuthContext'
import { ApiError } from '../lib/api'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Login failed.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="auth-layout">
      <section className="auth-panel">
        <h2>Log in</h2>
        <form onSubmit={handleSubmit}>
          <FormField label="Email" type="email" value={email} onChange={setEmail} />
          <FormField label="Password" type="password" value={password} onChange={setPassword} />
          {error && <p className="form-error">{error}</p>}
          <button className="btn" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Logging in...' : 'Log in'}
          </button>
        </form>
        <p>
          No account? <Link to="/register">Register</Link>
        </p>
      </section>
      <div
        className="auth-image-panel"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1560807707-8cc77767d783?w=700&q=70&auto=format&fit=crop')",
          backgroundPosition: 'center 85%',
        }}
      />
    </div>
  )
}
