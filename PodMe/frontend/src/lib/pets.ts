import { apiFetch } from './api'

export type Pet = {
  id: number
  owner_id: number
  name: string
  species: string
  breed: string | null
  date_of_birth: string | null
  weight: string | null
  notes: string | null
  owner?: { id: number; name: string; email: string }
}

export type PetInput = {
  name: string
  species: string
  breed?: string
  date_of_birth?: string
  weight?: string
  notes?: string
}

export function listPets(token: string): Promise<Pet[]> {
  return apiFetch('/api/pets', {}, token)
}

export function createPet(input: PetInput, token: string): Promise<Pet> {
  return apiFetch('/api/pets', { method: 'POST', body: JSON.stringify(input) }, token)
}

export function updatePet(id: number, input: PetInput, token: string): Promise<Pet> {
  return apiFetch(`/api/pets/${id}`, { method: 'PUT', body: JSON.stringify(input) }, token)
}

export function deletePet(id: number, token: string): Promise<{ message: string }> {
  return apiFetch(`/api/pets/${id}`, { method: 'DELETE' }, token)
}
