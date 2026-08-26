<?php

namespace App\Policies;

use App\Models\Appointment;
use App\Models\Pet;
use App\Models\User;

/**
 * Each state transition (confirm/complete/cancel) gets its own policy
 * method instead of one generic "update" — this way WHO is allowed to
 * attempt a transition (a Policy's job) stays separate from WHETHER the
 * appointment's current status allows it (a plain business-rule check the
 * controller makes, returning 422 rather than 403 when it fails).
 */
class AppointmentPolicy
{
    private function isStaff(User $user): bool
    {
        return in_array($user->role, [User::ROLE_ADMIN, User::ROLE_EMPLOYEE], true);
    }

    /**
     * Listing is scoped in the controller (staff see all, clients see their
     * own pets' appointments), so any authenticated user may ask.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Appointment $appointment): bool
    {
        return $this->isStaff($user) || $user->id === $appointment->pet->owner_id;
    }

    /**
     * Only a client requesting an appointment for their own pet — staff
     * don't create requests on a client's behalf in this MVP.
     */
    public function create(User $user, Pet $pet): bool
    {
        return $user->role === User::ROLE_CLIENT && $user->id === $pet->owner_id;
    }

    /**
     * Only staff move a request forward (confirm) or close it out
     * (complete) — clients can request and cancel, not self-approve.
     */
    public function confirm(User $user, Appointment $appointment): bool
    {
        return $this->isStaff($user);
    }

    public function complete(User $user, Appointment $appointment): bool
    {
        return $this->isStaff($user);
    }

    public function cancel(User $user, Appointment $appointment): bool
    {
        return $this->isStaff($user) || $user->id === $appointment->pet->owner_id;
    }
}
