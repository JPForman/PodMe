<?php

namespace App\Http\Requests\Admin;

use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserRoleRequest extends FormRequest
{
    /**
     * Field-level validation only; "can this admin change this user's
     * role" (admin-only, not themselves) is checked in the controller via
     * UserPolicy::updateRole.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'role' => ['required', 'string', Rule::in([User::ROLE_ADMIN, User::ROLE_EMPLOYEE, User::ROLE_CLIENT])],
        ];
    }
}
