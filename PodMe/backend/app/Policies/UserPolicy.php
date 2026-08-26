<?php

namespace App\Policies;

use App\Models\User;

/**
 * Every action here is admin-only, so the interesting rule isn't "who" but
 * "on whom" — an admin can manage any account except their own, preventing
 * a self-demotion or self-deactivation from locking every admin out.
 */
class UserPolicy
{
    private function canManage(User $user, User $target): bool
    {
        return $user->role === User::ROLE_ADMIN && $user->id !== $target->id;
    }

    public function viewAny(User $user): bool
    {
        return $user->role === User::ROLE_ADMIN;
    }

    public function updateRole(User $user, User $target): bool
    {
        return $this->canManage($user, $target);
    }

    public function activate(User $user, User $target): bool
    {
        return $this->canManage($user, $target);
    }

    public function deactivate(User $user, User $target): bool
    {
        return $this->canManage($user, $target);
    }
}
