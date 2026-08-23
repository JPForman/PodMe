<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class RoleMiddlewareTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // A throwaway route, registered only for this test, so the
        // middleware can be exercised without depending on real
        // domain routes that don't exist yet.
        Route::middleware(['auth:sanctum', 'role:admin,employee'])
            ->get('/api/_test/staff-only', fn () => response()->json(['ok' => true]));
    }

    private function tokenFor(User $user): string
    {
        return $user->createToken('api')->plainTextToken;
    }

    public function test_a_user_with_an_allowed_role_can_access_the_route(): void
    {
        $admin = User::factory()->create(['role' => User::ROLE_ADMIN]);

        $response = $this->getJson('/api/_test/staff-only', [
            'Authorization' => 'Bearer '.$this->tokenFor($admin),
        ]);

        $response->assertOk()->assertJson(['ok' => true]);
    }

    public function test_a_user_without_an_allowed_role_is_forbidden(): void
    {
        $client = User::factory()->create(['role' => User::ROLE_CLIENT]);

        $response = $this->getJson('/api/_test/staff-only', [
            'Authorization' => 'Bearer '.$this->tokenFor($client),
        ]);

        $response->assertStatus(403);
    }

    public function test_an_unauthenticated_request_is_rejected(): void
    {
        $response = $this->getJson('/api/_test/staff-only');

        $response->assertStatus(401);
    }
}
