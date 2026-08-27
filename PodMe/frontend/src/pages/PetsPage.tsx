import { useEffect, useState } from 'react'
import { PawPrint, Pencil, Trash2 } from 'lucide-react'
import { PetForm } from '../components/PetForm'
import { useAuth } from '../context/AuthContext'
import { ApiError } from '../lib/api'
import { createPet, deletePet, listPets, updatePet, type Pet, type PetInput } from '../lib/pets'

export function PetsPage() {
  const { user, token } = useAuth()
  const isClient = user?.role === 'client'

  const [pets, setPets] = useState<Pet[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  useEffect(() => {
    if (!token) return
    listPets(token)
      .then(setPets)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load pets.'))
      .finally(() => setIsLoading(false))
  }, [token])

  async function handleCreate(input: PetInput) {
    if (!token) return
    const pet = await createPet(input, token)
    setPets((prev) => [...prev, pet])
    setIsAdding(false)
  }

  async function handleUpdate(id: number, input: PetInput) {
    if (!token) return
    const pet = await updatePet(id, input, token)
    setPets((prev) => prev.map((p) => (p.id === id ? pet : p)))
    setEditingId(null)
  }

  async function handleDelete(id: number) {
    if (!token) return
    if (!window.confirm('Delete this pet? This cannot be undone.')) return
    setDeletingId(id)
    try {
      await deletePet(id, token)
      setPets((prev) => prev.filter((p) => p.id !== id))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete pet.')
    } finally {
      setDeletingId(null)
    }
  }

  if (isLoading) return <p className="loading-text">Loading pets...</p>

  return (
    <section className="page">
      <h2>{isClient ? 'Your pets' : 'All pets'}</h2>
      {error && <p className="form-error">{error}</p>}

      {isClient && !isAdding && pets.length > 0 && (
        <button className="btn" onClick={() => setIsAdding(true)}>
          Add a pet
        </button>
      )}
      {isClient && isAdding && (
        <PetForm submitLabel="Add pet" onSubmit={handleCreate} onCancel={() => setIsAdding(false)} />
      )}

      {pets.length === 0 && !isAdding && (
        <div className="empty-state">
          <img
            className="empty-state-image"
            src="https://images.unsplash.com/photo-1552053831-71594a27632d?w=320&q=70&auto=format&fit=crop"
            alt="A retriever puppy holding a tulip"
            loading="lazy"
          />
          <PawPrint className="empty-state-icon" size={28} />
          <p>No pets yet.</p>
          {isClient && (
            <button className="btn empty-state-cta" onClick={() => setIsAdding(true)}>
              Add a pet
            </button>
          )}
        </div>
      )}

      <ul className="pet-list">
        {pets.map((pet) => (
          <li key={pet.id} className="pet-card">
            {editingId === pet.id ? (
              <PetForm
                initial={pet}
                submitLabel="Save"
                onSubmit={(input) => handleUpdate(pet.id, input)}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <>
                <div className="pet-card-header">
                  <strong>{pet.name}</strong>
                  <span className="role-badge">{pet.species}</span>
                </div>
                {pet.breed && <p>Breed: {pet.breed}</p>}
                {pet.date_of_birth && <p>Born: {pet.date_of_birth.slice(0, 10)}</p>}
                {pet.weight && <p>Weight: {pet.weight} lbs</p>}
                {pet.notes && <p>{pet.notes}</p>}
                {!isClient && pet.owner && <p>Owner: {pet.owner.name}</p>}
                {isClient && (
                  <div className="pet-card-actions">
                    <button className="btn" onClick={() => setEditingId(pet.id)} disabled={deletingId === pet.id}>
                      <Pencil size={14} />
                      Edit
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={() => handleDelete(pet.id)}
                      disabled={deletingId === pet.id}
                    >
                      <Trash2 size={14} />
                      {deletingId === pet.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                )}
              </>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
