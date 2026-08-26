<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateUserRoleRequest;
use App\Models\User;

class UserController extends Controller
{
    public function index()
    {
        $this->authorize('viewAny', User::class);

        return response()->json(User::orderBy('name')->get(['id', 'name', 'email', 'role', 'is_active']));
    }

    public function updateRole(UpdateUserRoleRequest $request, User $user)
    {
        $this->authorize('updateRole', $user);

        $user->role = $request->validated('role');
        $user->save();

        return response()->json($user);
    }

    public function activate(User $user)
    {
        $this->authorize('activate', $user);

        $user->is_active = true;
        $user->save();

        return response()->json($user);
    }

    public function deactivate(User $user)
    {
        $this->authorize('deactivate', $user);

        $user->is_active = false;
        $user->save();

        // Revoke every existing token immediately, rather than only
        // blocking future logins — a deactivated account should be locked
        // out everywhere right away, not just unable to sign in again.
        $user->tokens()->delete();

        return response()->json($user);
    }
}
