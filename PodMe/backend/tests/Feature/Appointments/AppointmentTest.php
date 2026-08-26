<?php

namespace Tests\Feature\Appointments;

use App\Models\Appointment;
use App\Models\Pet;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AppointmentTest extends TestCase
{
    use RefreshDatabase;

    private function tokenFor(User $user): string
    {
        return $user->createToken('api')->plainTextToken;
    }

    private function authHeaders(User $user): array
    {
        return ['Authorization' => 'Bearer '.$this->tokenFor($user)];
    }

    public function test_a_client_can_request_an_appointment_for_their_own_pet(): void
    {
        $client = User::factory()->create(['role' => User::ROLE_CLIENT]);
        $pet = Pet::factory()->for($client, 'owner')->create();

        $response = $this->postJson('/api/appointments', [
            'pet_id' => $pet->id,
            'scheduled_at' => now()->addWeek()->toDateTimeString(),
            'reason' => 'Annual checkup',
        ], $this->authHeaders($client));

        $response->assertCreated()->assertJsonPath('status', Appointment::STATUS_REQUESTED);

        $this->assertDatabaseHas('appointments', [
            'pet_id' => $pet->id,
            'status' => Appointment::STATUS_REQUESTED,
        ]);
    }

    public function test_a_client_cannot_request_an_appointment_for_another_clients_pet(): void
    {
        $client = User::factory()->create(['role' => User::ROLE_CLIENT]);
        $owner = User::factory()->create(['role' => User::ROLE_CLIENT]);
        $pet = Pet::factory()->for($owner, 'owner')->create();

        $response = $this->postJson('/api/appointments', [
            'pet_id' => $pet->id,
            'scheduled_at' => now()->addWeek()->toDateTimeString(),
        ], $this->authHeaders($client));

        $response->assertStatus(403);
    }

    public function test_staff_cannot_request_an_appointment(): void
    {
        $employee = User::factory()->create(['role' => User::ROLE_EMPLOYEE]);
        $owner = User::factory()->create(['role' => User::ROLE_CLIENT]);
        $pet = Pet::factory()->for($owner, 'owner')->create();

        $response = $this->postJson('/api/appointments', [
            'pet_id' => $pet->id,
            'scheduled_at' => now()->addWeek()->toDateTimeString(),
        ], $this->authHeaders($employee));

        $response->assertStatus(403);
    }

    public function test_requesting_an_appointment_rejects_a_past_datetime(): void
    {
        $client = User::factory()->create(['role' => User::ROLE_CLIENT]);
        $pet = Pet::factory()->for($client, 'owner')->create();

        $response = $this->postJson('/api/appointments', [
            'pet_id' => $pet->id,
            'scheduled_at' => now()->subDay()->toDateTimeString(),
        ], $this->authHeaders($client));

        $response->assertStatus(422)->assertJsonValidationErrors(['scheduled_at']);
    }

    public function test_a_client_only_sees_appointments_for_their_own_pets(): void
    {
        $client = User::factory()->create(['role' => User::ROLE_CLIENT]);
        $other = User::factory()->create(['role' => User::ROLE_CLIENT]);
        $myPet = Pet::factory()->for($client, 'owner')->create();
        $otherPet = Pet::factory()->for($other, 'owner')->create();

        Appointment::factory()->for($myPet)->create();
        Appointment::factory()->for($otherPet)->create();

        $response = $this->getJson('/api/appointments', $this->authHeaders($client));

        $response->assertOk()->assertJsonCount(1);
    }

    public function test_staff_sees_every_clients_appointments(): void
    {
        $admin = User::factory()->create(['role' => User::ROLE_ADMIN]);
        $petA = Pet::factory()->create();
        $petB = Pet::factory()->create();

        Appointment::factory()->for($petA)->create();
        Appointment::factory()->for($petB)->create();

        $response = $this->getJson('/api/appointments', $this->authHeaders($admin));

        $response->assertOk()->assertJsonCount(2);
    }

    public function test_staff_can_confirm_a_requested_appointment(): void
    {
        $employee = User::factory()->create(['role' => User::ROLE_EMPLOYEE]);
        $appointment = Appointment::factory()->create();

        $response = $this->patchJson("/api/appointments/{$appointment->id}/confirm", [], $this->authHeaders($employee));

        $response->assertOk()->assertJsonPath('status', Appointment::STATUS_CONFIRMED);
    }

    public function test_a_client_cannot_confirm_their_own_appointment(): void
    {
        $client = User::factory()->create(['role' => User::ROLE_CLIENT]);
        $pet = Pet::factory()->for($client, 'owner')->create();
        $appointment = Appointment::factory()->for($pet)->create();

        $response = $this->patchJson("/api/appointments/{$appointment->id}/confirm", [], $this->authHeaders($client));

        $response->assertStatus(403);
    }

    public function test_confirming_an_already_confirmed_appointment_fails(): void
    {
        $employee = User::factory()->create(['role' => User::ROLE_EMPLOYEE]);
        $appointment = Appointment::factory()->confirmed()->create();

        $response = $this->patchJson("/api/appointments/{$appointment->id}/confirm", [], $this->authHeaders($employee));

        $response->assertStatus(422);
    }

    public function test_staff_can_complete_a_confirmed_appointment(): void
    {
        $employee = User::factory()->create(['role' => User::ROLE_EMPLOYEE]);
        $appointment = Appointment::factory()->confirmed()->create();

        $response = $this->patchJson("/api/appointments/{$appointment->id}/complete", [], $this->authHeaders($employee));

        $response->assertOk()->assertJsonPath('status', Appointment::STATUS_COMPLETED);
    }

    public function test_completing_a_requested_appointment_fails(): void
    {
        $employee = User::factory()->create(['role' => User::ROLE_EMPLOYEE]);
        $appointment = Appointment::factory()->create();

        $response = $this->patchJson("/api/appointments/{$appointment->id}/complete", [], $this->authHeaders($employee));

        $response->assertStatus(422);
    }

    public function test_a_client_can_cancel_their_own_requested_appointment(): void
    {
        $client = User::factory()->create(['role' => User::ROLE_CLIENT]);
        $pet = Pet::factory()->for($client, 'owner')->create();
        $appointment = Appointment::factory()->for($pet)->create();

        $response = $this->patchJson("/api/appointments/{$appointment->id}/cancel", [], $this->authHeaders($client));

        $response->assertOk()->assertJsonPath('status', Appointment::STATUS_CANCELLED);
    }

    public function test_a_client_cannot_cancel_another_clients_appointment(): void
    {
        $client = User::factory()->create(['role' => User::ROLE_CLIENT]);
        $owner = User::factory()->create(['role' => User::ROLE_CLIENT]);
        $pet = Pet::factory()->for($owner, 'owner')->create();
        $appointment = Appointment::factory()->for($pet)->create();

        $response = $this->patchJson("/api/appointments/{$appointment->id}/cancel", [], $this->authHeaders($client));

        $response->assertStatus(403);
    }

    public function test_staff_can_cancel_any_appointment(): void
    {
        $employee = User::factory()->create(['role' => User::ROLE_EMPLOYEE]);
        $appointment = Appointment::factory()->confirmed()->create();

        $response = $this->patchJson("/api/appointments/{$appointment->id}/cancel", [], $this->authHeaders($employee));

        $response->assertOk()->assertJsonPath('status', Appointment::STATUS_CANCELLED);
    }

    public function test_a_completed_appointment_cannot_be_cancelled(): void
    {
        $employee = User::factory()->create(['role' => User::ROLE_EMPLOYEE]);
        $appointment = Appointment::factory()->completed()->create();

        $response = $this->patchJson("/api/appointments/{$appointment->id}/cancel", [], $this->authHeaders($employee));

        $response->assertStatus(422);
    }

    public function test_an_unauthenticated_request_is_rejected(): void
    {
        $response = $this->getJson('/api/appointments');

        $response->assertStatus(401);
    }
}
