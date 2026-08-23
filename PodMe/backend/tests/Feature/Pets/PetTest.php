<?php

namespace Tests\Feature\Pets;

use App\Models\Pet;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PetTest extends TestCase
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

    public function test_a_client_can_create_a_pet_for_themselves(): void
    {
        $client = User::factory()->create(['role' => User::ROLE_CLIENT]);

        $response = $this->postJson('/api/pets', [
            'name' => 'Fido',
            'species' => 'dog',
            'breed' => 'Beagle',
            'date_of_birth' => '2020-01-01',
            'weight' => 12.5,
            'notes' => 'Friendly, a bit anxious at the vet.',
        ], $this->authHeaders($client));

        $response->assertCreated()->assertJsonPath('name', 'Fido');

        $this->assertDatabaseHas('pets', [
            'name' => 'Fido',
            'owner_id' => $client->id,
        ]);
    }

    public function test_a_client_cannot_assign_a_pet_to_another_owner(): void
    {
        $client = User::factory()->create(['role' => User::ROLE_CLIENT]);
        $other = User::factory()->create(['role' => User::ROLE_CLIENT]);

        $this->postJson('/api/pets', [
            'name' => 'Fido',
            'species' => 'dog',
            'owner_id' => $other->id,
        ], $this->authHeaders($client));

        $this->assertDatabaseHas('pets', [
            'name' => 'Fido',
            'owner_id' => $client->id,
        ]);
    }

    public function test_staff_cannot_create_pets(): void
    {
        $employee = User::factory()->create(['role' => User::ROLE_EMPLOYEE]);

        $response = $this->postJson('/api/pets', [
            'name' => 'Fido',
            'species' => 'dog',
        ], $this->authHeaders($employee));

        $response->assertStatus(403);
    }

    public function test_creating_a_pet_validates_required_fields(): void
    {
        $client = User::factory()->create(['role' => User::ROLE_CLIENT]);

        $response = $this->postJson('/api/pets', [], $this->authHeaders($client));

        $response->assertStatus(422)->assertJsonValidationErrors(['name', 'species']);
    }

    public function test_a_client_only_sees_their_own_pets_in_the_index(): void
    {
        $client = User::factory()->create(['role' => User::ROLE_CLIENT]);
        $other = User::factory()->create(['role' => User::ROLE_CLIENT]);

        Pet::factory()->for($client, 'owner')->create(['name' => 'Mine']);
        Pet::factory()->for($other, 'owner')->create(['name' => 'NotMine']);

        $response = $this->getJson('/api/pets', $this->authHeaders($client));

        $response->assertOk()->assertJsonCount(1)->assertJsonPath('0.name', 'Mine');
    }

    public function test_staff_sees_every_clients_pets_in_the_index(): void
    {
        $admin = User::factory()->create(['role' => User::ROLE_ADMIN]);
        $clientA = User::factory()->create(['role' => User::ROLE_CLIENT]);
        $clientB = User::factory()->create(['role' => User::ROLE_CLIENT]);

        Pet::factory()->for($clientA, 'owner')->create();
        Pet::factory()->for($clientB, 'owner')->create();

        $response = $this->getJson('/api/pets', $this->authHeaders($admin));

        $response->assertOk()->assertJsonCount(2);
    }

    public function test_a_client_cannot_view_another_clients_pet(): void
    {
        $client = User::factory()->create(['role' => User::ROLE_CLIENT]);
        $owner = User::factory()->create(['role' => User::ROLE_CLIENT]);
        $pet = Pet::factory()->for($owner, 'owner')->create();

        $response = $this->getJson("/api/pets/{$pet->id}", $this->authHeaders($client));

        $response->assertStatus(403);
    }

    public function test_staff_can_view_any_clients_pet(): void
    {
        $employee = User::factory()->create(['role' => User::ROLE_EMPLOYEE]);
        $owner = User::factory()->create(['role' => User::ROLE_CLIENT]);
        $pet = Pet::factory()->for($owner, 'owner')->create();

        $response = $this->getJson("/api/pets/{$pet->id}", $this->authHeaders($employee));

        $response->assertOk()->assertJsonPath('id', $pet->id);
    }

    public function test_an_owner_can_update_their_pet(): void
    {
        $client = User::factory()->create(['role' => User::ROLE_CLIENT]);
        $pet = Pet::factory()->for($client, 'owner')->create(['name' => 'Old Name']);

        $response = $this->putJson("/api/pets/{$pet->id}", [
            'name' => 'New Name',
        ], $this->authHeaders($client));

        $response->assertOk()->assertJsonPath('name', 'New Name');
        $this->assertDatabaseHas('pets', ['id' => $pet->id, 'name' => 'New Name']);
    }

    public function test_a_non_owner_cannot_update_the_pet(): void
    {
        $client = User::factory()->create(['role' => User::ROLE_CLIENT]);
        $owner = User::factory()->create(['role' => User::ROLE_CLIENT]);
        $pet = Pet::factory()->for($owner, 'owner')->create();

        $response = $this->putJson("/api/pets/{$pet->id}", [
            'name' => 'Hijacked',
        ], $this->authHeaders($client));

        $response->assertStatus(403);
    }

    public function test_staff_cannot_update_a_clients_pet(): void
    {
        $employee = User::factory()->create(['role' => User::ROLE_EMPLOYEE]);
        $owner = User::factory()->create(['role' => User::ROLE_CLIENT]);
        $pet = Pet::factory()->for($owner, 'owner')->create();

        $response = $this->putJson("/api/pets/{$pet->id}", [
            'name' => 'Hijacked',
        ], $this->authHeaders($employee));

        $response->assertStatus(403);
    }

    public function test_an_owner_can_delete_their_pet(): void
    {
        $client = User::factory()->create(['role' => User::ROLE_CLIENT]);
        $pet = Pet::factory()->for($client, 'owner')->create();

        $response = $this->deleteJson("/api/pets/{$pet->id}", [], $this->authHeaders($client));

        $response->assertOk();
        $this->assertDatabaseMissing('pets', ['id' => $pet->id]);
    }

    public function test_a_non_owner_cannot_delete_the_pet(): void
    {
        $client = User::factory()->create(['role' => User::ROLE_CLIENT]);
        $owner = User::factory()->create(['role' => User::ROLE_CLIENT]);
        $pet = Pet::factory()->for($owner, 'owner')->create();

        $response = $this->deleteJson("/api/pets/{$pet->id}", [], $this->authHeaders($client));

        $response->assertStatus(403);
        $this->assertDatabaseHas('pets', ['id' => $pet->id]);
    }

    public function test_an_unauthenticated_request_is_rejected(): void
    {
        $response = $this->getJson('/api/pets');

        $response->assertStatus(401);
    }
}
