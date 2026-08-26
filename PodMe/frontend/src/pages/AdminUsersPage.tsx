import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { activateUser, deactivateUser, listUsers, updateUserRole, type ManagedUser } from '../lib/admin'
import { ApiError, type Role } from '../lib/api'

const ROLES: Role[] = ['client', 'employee', 'admin']

export function AdminUsersPage() {
  const { user, token } = useAuth()
  const [users, setUsers] = useState<ManagedUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) return
    listUsers(token)
      .then(setUsers)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load users.'))
      .finally(() => setIsLoading(false))
  }, [token])

  async function handleRoleChange(id: number, role: Role) {
    if (!token) return
    setError('')
    try {
      const updated = await updateUserRole(id, role, token)
      setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update role.')
    }
  }

  async function handleToggleActive(managedUser: ManagedUser) {
    if (!token) return
    setError('')
    try {
      const action = managedUser.is_active ? deactivateUser : activateUser
      const updated = await action(managedUser.id, token)
      setUsers((prev) => prev.map((u) => (u.id === managedUser.id ? updated : u)))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update status.')
    }
  }

  if (isLoading) return null

  return (
    <section className="auth-page pets-page">
      <h2>All users</h2>
      {error && <p className="form-error">{error}</p>}

      <ul className="pet-list">
        {users.map((managedUser) => {
          const isSelf = managedUser.id === user?.id
          return (
            <li key={managedUser.id} className="pet-card">
              <div className="pet-card-header">
                <strong>
                  {managedUser.name}
                  {isSelf && ' (you)'}
                </strong>
                <span className={managedUser.is_active ? 'role-badge' : 'role-badge role-badge-inactive'}>
                  {managedUser.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p>{managedUser.email}</p>
              <div className="pet-card-actions">
                <select
                  value={managedUser.role}
                  disabled={isSelf}
                  onChange={(e) => handleRoleChange(managedUser.id, e.target.value as Role)}
                >
                  {ROLES.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={isSelf}
                  onClick={() => handleToggleActive(managedUser)}
                >
                  {managedUser.is_active ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
