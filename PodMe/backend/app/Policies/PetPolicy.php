<?php

namespace App\Policies;

use App\Models\Pet;
use App\Models\User;

/**
 * A Policy is the Laravel-native place for "can this user do X to this
 * specific record" checks — the Express equivalent would be a hand-rolled
 * `if` inside the route handler, but here it's centralized in one class and
 * wired to the model automatically by naming convention (Pet -> PetPolicy).
 * The controller calls $this->authorize('update', $pet) and Laravel routes
 * that to the matching method below, aborting 403 on false.
 */
class PetPolicy
{
    private function isStaff(User $user): bool
    {
        return in_array($user->role, [User::ROLE_ADMIN, User::ROLE_EMPLOYEE], true);
    }

    /**
     * Listing is handled by scoping the query in the controller (staff see
     * all pets, clients see their own), so any authenticated user may ask.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Pet $pet): bool
    {
        return $this->isStaff($user) || $user->id === $pet->owner_id;
    }

    /**
     * Only clients create pets, and only for themselves — the controller
     * forces owner_id to the authenticated user regardless of input.
     */
    public function create(User $user): bool
    {
        return $user->role === User::ROLE_CLIENT;
    }

    public function update(User $user, Pet $pet): bool
    {
        return $user->id === $pet->owner_id;
    }

    public function delete(User $user, Pet $pet): bool
    {
        return $user->id === $pet->owner_id;
    }
}
