<?php

namespace App\Http\Requests\Appointment;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreAppointmentRequest extends FormRequest
{
    /**
     * Field-level validation only; "can this user book an appointment for
     * this pet" is checked in the controller via AppointmentPolicy::create,
     * since it needs the Pet the request resolves below.
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
            'pet_id' => ['required', 'integer', 'exists:pets,id'],
            'scheduled_at' => ['required', 'date', 'after:now'],
            'reason' => ['nullable', 'string', 'max:500'],
        ];
    }
}
