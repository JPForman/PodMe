<?php

namespace Database\Factories;

use App\Models\Appointment;
use App\Models\Note;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Note>
 */
class NoteFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'appointment_id' => Appointment::factory(),
            'author_id' => User::factory(['role' => User::ROLE_EMPLOYEE]),
            'content' => fake()->sentence(10),
        ];
    }
}
