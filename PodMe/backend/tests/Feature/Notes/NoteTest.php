<?php

namespace Tests\Feature\Notes;

use App\Models\Appointment;
use App\Models\Note;
use App\Models\Pet;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class NoteTest extends TestCase
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

    public function test_staff_can_add_a_note_to_any_appointment(): void
    {
        $employee = User::factory()->create(['role' => User::ROLE_EMPLOYEE]);
        $appointment = Appointment::factory()->create();

        $response = $this->postJson("/api/appointments/{$appointment->id}/notes", [
            'content' => 'Patient is healthy, up to date on vaccines.',
        ], $this->authHeaders($employee));

        $response->assertCreated()
            ->assertJsonPath('content', 'Patient is healthy, up to date on vaccines.')
            ->assertJsonPath('author.id', $employee->id);

        $this->assertDatabaseHas('notes', [
            'appointment_id' => $appointment->id,
            'author_id' => $employee->id,
        ]);
    }

    public function test_a_client_cannot_add_a_note(): void
    {
        $client = User::factory()->create(['role' => User::ROLE_CLIENT]);
        $pet = Pet::factory()->for($client, 'owner')->create();
        $appointment = Appointment::factory()->for($pet)->create();

        $response = $this->postJson("/api/appointments/{$appointment->id}/notes", [
            'content' => 'Trying to self-diagnose.',
        ], $this->authHeaders($client));

        $response->assertStatus(403);
    }

    public function test_adding_a_note_requires_content(): void
    {
        $employee = User::factory()->create(['role' => User::ROLE_EMPLOYEE]);
        $appointment = Appointment::factory()->create();

        $response = $this->postJson("/api/appointments/{$appointment->id}/notes", [], $this->authHeaders($employee));

        $response->assertStatus(422)->assertJsonValidationErrors(['content']);
    }

    public function test_a_client_can_view_notes_for_their_own_appointment(): void
    {
        $client = User::factory()->create(['role' => User::ROLE_CLIENT]);
        $pet = Pet::factory()->for($client, 'owner')->create();
        $appointment = Appointment::factory()->for($pet)->create();
        Note::factory()->for($appointment)->create(['content' => 'All good.']);

        $response = $this->getJson("/api/appointments/{$appointment->id}/notes", $this->authHeaders($client));

        $response->assertOk()->assertJsonCount(1)->assertJsonPath('0.content', 'All good.');
    }

    public function test_a_client_cannot_view_notes_for_another_clients_appointment(): void
    {
        $client = User::factory()->create(['role' => User::ROLE_CLIENT]);
        $owner = User::factory()->create(['role' => User::ROLE_CLIENT]);
        $pet = Pet::factory()->for($owner, 'owner')->create();
        $appointment = Appointment::factory()->for($pet)->create();
        Note::factory()->for($appointment)->create();

        $response = $this->getJson("/api/appointments/{$appointment->id}/notes", $this->authHeaders($client));

        $response->assertStatus(403);
    }

    public function test_staff_can_view_notes_for_any_appointment(): void
    {
        $employee = User::factory()->create(['role' => User::ROLE_EMPLOYEE]);
        $appointment = Appointment::factory()->create();
        Note::factory()->count(2)->for($appointment)->create();

        $response = $this->getJson("/api/appointments/{$appointment->id}/notes", $this->authHeaders($employee));

        $response->assertOk()->assertJsonCount(2);
    }

    public function test_a_note_can_be_added_regardless_of_appointment_status(): void
    {
        $employee = User::factory()->create(['role' => User::ROLE_EMPLOYEE]);
        $appointment = Appointment::factory()->create(['status' => Appointment::STATUS_REQUESTED]);

        $response = $this->postJson("/api/appointments/{$appointment->id}/notes", [
            'content' => 'Called to confirm availability.',
        ], $this->authHeaders($employee));

        $response->assertCreated();
    }

    public function test_an_unauthenticated_request_is_rejected(): void
    {
        $appointment = Appointment::factory()->create();

        $response = $this->getJson("/api/appointments/{$appointment->id}/notes");

        $response->assertStatus(401);
    }
}
