import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FormField } from '../components/FormField'
import { useAuth } from '../context/AuthContext'
import { ApiError } from '../lib/api'

export function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setErrors({})
    setIsSubmitting(true)
    try {
      await register(name, email, password, passwordConfirmation)
      navigate('/dashboard')
    } catch (err) {
      if (err instanceof ApiError && err.errors) {
        setErrors(err.errors)
      } else {
        setError(err instanceof ApiError ? err.message : 'Registration failed.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="auth-layout">
      <section className="auth-panel">
        <h2>Register</h2>
        <p>New accounts are always created with the "client" role.</p>
        <form onSubmit={handleSubmit}>
          <FormField label="Name" value={name} onChange={setName} error={errors.name?.[0]} />
          <FormField
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            error={errors.email?.[0]}
          />
          <FormField
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            error={errors.password?.[0]}
          />
          <FormField
            label="Confirm password"
            type="password"
            value={passwordConfirmation}
            onChange={setPasswordConfirmation}
          />
          {error && <p className="form-error">{error}</p>}
          <button className="btn" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Registering...' : 'Register'}
          </button>
        </form>
        <p>
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </section>
      <div
        className="auth-image-panel"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1601979031925-424e53b6caaa?w=700&q=70&auto=format&fit=crop')",
        }}
      />
    </div>
  )
}
