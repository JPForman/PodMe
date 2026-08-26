export const API_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000'

export type Role = 'admin' | 'employee' | 'client'

export type User = {
  id: number
  name: string
  email: string
  role: Role
}

export class ApiError extends Error {
  status: number
  errors?: Record<string, string[]>

  constructor(status: number, data: { message?: string; errors?: Record<string, string[]> } | null) {
    super(data?.message ?? 'Something went wrong.')
    this.status = status
    this.errors = data?.errors
  }
}

export async function apiFetch(path: string, options: RequestInit = {}, token?: string | null) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  const data = await res.json().catch(() => null)
  if (!res.ok) throw new ApiError(res.status, data)
  return data
}
