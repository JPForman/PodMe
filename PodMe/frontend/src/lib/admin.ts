import { apiFetch, type Role } from './api'

export type ManagedUser = {
  id: number
  name: string
  email: string
  role: Role
  is_active: boolean
}

export function listUsers(token: string): Promise<ManagedUser[]> {
  return apiFetch('/api/admin/users', {}, token)
}

export function updateUserRole(userId: number, role: Role, token: string): Promise<ManagedUser> {
  return apiFetch(
    `/api/admin/users/${userId}/role`,
    { method: 'PATCH', body: JSON.stringify({ role }) },
    token,
  )
}

export function activateUser(userId: number, token: string): Promise<ManagedUser> {
  return apiFetch(`/api/admin/users/${userId}/activate`, { method: 'PATCH' }, token)
}

export function deactivateUser(userId: number, token: string): Promise<ManagedUser> {
  return apiFetch(`/api/admin/users/${userId}/deactivate`, { method: 'PATCH' }, token)
}
