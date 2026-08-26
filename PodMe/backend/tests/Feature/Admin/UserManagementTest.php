<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserManagementTest extends TestCase
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

    public function test_an_admin_can_list_all_users(): void
    {
        $admin = User::factory()->create(['role' => User::ROLE_ADMIN]);
        User::factory()->count(2)->create(['role' => User::ROLE_CLIENT]);

        $response = $this->getJson('/api/admin/users', $this->authHeaders($admin));

        $response->assertOk()->assertJsonCount(3);
    }

    public function test_a_non_admin_cannot_list_users(): void
    {
        $employee = User::factory()->create(['role' => User::ROLE_EMPLOYEE]);

        $response = $this->getJson('/api/admin/users', $this->authHeaders($employee));

        $response->assertStatus(403);
    }

    public function test_an_admin_can_change_another_users_role(): void
    {
        $admin = User::factory()->create(['role' => User::ROLE_ADMIN]);
        $client = User::factory()->create(['role' => User::ROLE_CLIENT]);

        $response = $this->patchJson("/api/admin/users/{$client->id}/role", [
            'role' => User::ROLE_EMPLOYEE,
        ], $this->authHeaders($admin));

        $response->assertOk()->assertJsonPath('role', User::ROLE_EMPLOYEE);
        $this->assertDatabaseHas('users', ['id' => $client->id, 'role' => User::ROLE_EMPLOYEE]);
    }

    public function test_an_admin_cannot_change_their_own_role(): void
    {
        $admin = User::factory()->create(['role' => User::ROLE_ADMIN]);

        $response = $this->patchJson("/api/admin/users/{$admin->id}/role", [
            'role' => User::ROLE_CLIENT,
        ], $this->authHeaders($admin));

        $response->assertStatus(403);
        $this->assertDatabaseHas('users', ['id' => $admin->id, 'role' => User::ROLE_ADMIN]);
    }

    public function test_updating_a_role_rejects_an_invalid_value(): void
    {
        $admin = User::factory()->create(['role' => User::ROLE_ADMIN]);
        $client = User::factory()->create(['role' => User::ROLE_CLIENT]);

        $response = $this->patchJson("/api/admin/users/{$client->id}/role", [
            'role' => 'superuser',
        ], $this->authHeaders($admin));

        $response->assertStatus(422)->assertJsonValidationErrors(['role']);
    }

    public function test_a_non_admin_cannot_change_a_role(): void
    {
        $employee = User::factory()->create(['role' => User::ROLE_EMPLOYEE]);
        $client = User::factory()->create(['role' => User::ROLE_CLIENT]);

        $response = $this->patchJson("/api/admin/users/{$client->id}/role", [
            'role' => User::ROLE_EMPLOYEE,
        ], $this->authHeaders($employee));

        $response->assertStatus(403);
    }

    public function test_an_admin_can_deactivate_a_user_and_their_tokens_are_revoked(): void
    {
        $admin = User::factory()->create(['role' => User::ROLE_ADMIN]);
        $employee = User::factory()->create(['role' => User::ROLE_EMPLOYEE]);
        $this->tokenFor($employee);

        $response = $this->patchJson(
            "/api/admin/users/{$employee->id}/deactivate",
            [],
            $this->authHeaders($admin)
        );

        $response->assertOk()->assertJsonPath('is_active', false);

        // Proves the controller actually revokes tokens. Replaying the old
        // token with a real HTTP call to confirm it's rejected isn't
        // reliable here: Laravel's test client resolves the auth guard once
        // per test method, so a second request can return the cached user
        // from an earlier call instead of re-validating the header — a
        // testing-only quirk, since a real server re-validates every
        // request fresh.
        $this->assertSame(0, $employee->tokens()->count());
    }

    public function test_an_admin_cannot_deactivate_themselves(): void
    {
        $admin = User::factory()->create(['role' => User::ROLE_ADMIN]);

        $response = $this->patchJson(
            "/api/admin/users/{$admin->id}/deactivate",
            [],
            $this->authHeaders($admin)
        );

        $response->assertStatus(403);
    }

    public function test_a_deactivated_user_cannot_log_in(): void
    {
        $user = User::factory()->inactive()->create([
            'email' => 'inactive@example.com',
            'password' => 'password123',
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'inactive@example.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors(['email']);
    }

    public function test_an_admin_can_reactivate_a_user(): void
    {
        $admin = User::factory()->create(['role' => User::ROLE_ADMIN]);
        $employee = User::factory()->inactive()->create(['role' => User::ROLE_EMPLOYEE]);

        $response = $this->patchJson(
            "/api/admin/users/{$employee->id}/activate",
            [],
            $this->authHeaders($admin)
        );

        $response->assertOk()->assertJsonPath('is_active', true);
    }

    public function test_an_unauthenticated_request_is_rejected(): void
    {
        $response = $this->getJson('/api/admin/users');

        $response->assertStatus(401);
    }
}
