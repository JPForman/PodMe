<?php

namespace Database\Seeders;

use App\Models\Appointment;
use App\Models\Note;
use App\Models\Pet;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed local dev data: one login per role plus enough pets/appointments/
     * notes to exercise every screen without registering accounts by hand.
     * All accounts share the password "password".
     */
    public function run(): void
    {
        User::factory()->create([
            'name' => 'Ada Admin',
            'email' => 'admin@podme.test',
            'role' => User::ROLE_ADMIN,
        ]);

        $employee = User::factory()->create([
            'name' => 'Evan Employee',
            'email' => 'employee@podme.test',
            'role' => User::ROLE_EMPLOYEE,
        ]);

        $client = User::factory()->create([
            'name' => 'Cara Client',
            'email' => 'client@podme.test',
            'role' => User::ROLE_CLIENT,
        ]);

        User::factory()->create([
            'name' => 'Deactivated Dan',
            'email' => 'inactive@podme.test',
            'role' => User::ROLE_CLIENT,
            'is_active' => false,
        ]);

        $dog = Pet::factory()->create([
            'owner_id' => $client->id,
            'name' => 'Biscuit',
            'species' => 'dog',
            'breed' => 'Labrador',
        ]);

        $cat = Pet::factory()->create([
            'owner_id' => $client->id,
            'name' => 'Whiskers',
            'species' => 'cat',
            'breed' => 'Tabby',
        ]);

        Appointment::factory()->create([
            'pet_id' => $dog->id,
            'status' => Appointment::STATUS_REQUESTED,
        ]);

        $confirmed = Appointment::factory()->confirmed()->create([
            'pet_id' => $cat->id,
        ]);
        Note::factory()->create([
            'appointment_id' => $confirmed->id,
            'author_id' => $employee->id,
            'content' => 'Pre-visit check-in: owner reports normal appetite and activity.',
        ]);

        $completed = Appointment::factory()->completed()->create([
            'pet_id' => $dog->id,
            'scheduled_at' => now()->subWeek(),
        ]);
        Note::factory()->create([
            'appointment_id' => $completed->id,
            'author_id' => $employee->id,
            'content' => 'Annual checkup complete. Weight stable, vaccinations up to date.',
        ]);

        Appointment::factory()->cancelled()->create([
            'pet_id' => $cat->id,
            'scheduled_at' => now()->subDays(3),
        ]);
    }
}
