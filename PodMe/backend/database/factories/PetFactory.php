<?php

namespace Database\Factories;

use App\Models\Pet;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Pet>
 */
class PetFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'owner_id' => User::factory(),
            'name' => fake()->firstName(),
            'species' => fake()->randomElement(['dog', 'cat', 'bird', 'rabbit']),
            'breed' => fake()->word(),
            'date_of_birth' => fake()->dateTimeBetween('-10 years', '-1 month')->format('Y-m-d'),
            'weight' => fake()->randomFloat(2, 1, 60),
            'notes' => fake()->boolean(30) ? fake()->sentence() : null,
        ];
    }
}
