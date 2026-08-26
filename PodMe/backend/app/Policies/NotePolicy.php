<?php

namespace App\Policies;

use App\Models\Appointment;
use App\Models\User;

/**
 * Viewing notes is gated by AppointmentPolicy::view (if you can see the
 * appointment, you can see its notes — clients read-only, staff any), so
 * this policy only needs to answer the one new question notes introduce:
 * who can write one. There's no update/delete method because notes have
 * no edit or delete endpoints — an intentional immutable visit record.
 */
class NotePolicy
{
    /**
     * Only staff write notes, same shape as AppointmentPolicy::create
     * taking the parent Appointment as context.
     */
    public function create(User $user, Appointment $appointment): bool
    {
        return in_array($user->role, [User::ROLE_ADMIN, User::ROLE_EMPLOYEE], true);
    }
}
