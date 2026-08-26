<?php

namespace Database\Factories;

use App\Models\Appointment;
use App\Models\Pet;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Appointment>
 */
class AppointmentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'pet_id' => Pet::factory(),
            'status' => Appointment::STATUS_REQUESTED,
            'scheduled_at' => fake()->dateTimeBetween('+1 day', '+1 month'),
            'reason' => fake()->boolean(70) ? fake()->sentence() : null,
        ];
    }

    public function confirmed(): static
    {
        return $this->state(fn (array $attributes) => ['status' => Appointment::STATUS_CONFIRMED]);
    }

    public function completed(): static
    {
        return $this->state(fn (array $attributes) => ['status' => Appointment::STATUS_COMPLETED]);
    }

    public function cancelled(): static
    {
        return $this->state(fn (array $attributes) => ['status' => Appointment::STATUS_CANCELLED]);
    }
}
