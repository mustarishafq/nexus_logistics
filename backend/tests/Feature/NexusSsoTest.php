<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class NexusSsoTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'services.nexus.api_key' => 'test-secret-key',
            'services.nexus.issuer' => 'https://emzinexus.com',
            'services.nexus.default_role' => 'Viewer',
            'app.frontend_url' => 'http://localhost:5173',
        ]);
    }

    public function test_sso_provisions_new_user_and_redirects_to_frontend_with_token(): void
    {
        $token = $this->makeJwt([
            'iss' => 'https://emzinexus.com',
            'iat' => time(),
            'exp' => time() + 60,
            'email' => 'jane@example.com',
            'name' => 'Jane Doe',
            'return_to' => 'https://emzinexus.com/applications',
        ]);

        $response = $this->get('/sso/nexus?token=' . urlencode($token));

        $response->assertRedirect();
        $location = $response->headers->get('Location');
        $this->assertStringContainsString('access_token=', $location);
        $this->assertStringContainsString('nexus_return_to=', $location);

        $homeResponse = $this->get($location);
        $homeResponse->assertRedirect();
        $frontendLocation = $homeResponse->headers->get('Location');
        $this->assertStringStartsWith('http://localhost:5173', $frontendLocation);
        $this->assertStringContainsString('access_token=', $frontendLocation);

        $this->assertDatabaseHas('users', [
            'email' => 'jane@example.com',
            'name' => 'Jane Doe',
            'role' => 'viewer',
            'is_approved' => true,
        ]);

        $user = User::where('email', 'jane@example.com')->first();
        $this->assertNotNull($user);
        $this->assertCount(1, $user->tokens);
    }

    public function test_sso_logs_in_existing_user_and_approves_pending_account(): void
    {
        $user = User::factory()->create([
            'email' => 'existing@example.com',
            'is_approved' => false,
        ]);

        $token = $this->makeJwt([
            'iss' => 'https://emzinexus.com',
            'iat' => time(),
            'exp' => time() + 60,
            'email' => 'existing@example.com',
        ]);

        $response = $this->get('/sso/nexus?token=' . urlencode($token));

        $response->assertRedirect();
        $this->assertAuthenticatedAs($user->fresh());
        $this->assertTrue($user->fresh()->is_approved);
    }

    public function test_sso_api_exchange_returns_json_token_for_frontend_callback(): void
    {
        $token = $this->makeJwt([
            'iss' => 'https://emzinexus.com',
            'iat' => time(),
            'exp' => time() + 60,
            'email' => 'api@example.com',
            'name' => 'API User',
            'return_to' => 'https://emzinexus.com/applications',
        ]);

        $response = $this->getJson('/api/sso/nexus?token=' . urlencode($token));

        $response->assertOk()
            ->assertJsonStructure(['access_token', 'nexus_return_to'])
            ->assertJsonPath('nexus_return_to', 'https://emzinexus.com/applications');

        $this->assertDatabaseHas('users', [
            'email' => 'api@example.com',
            'name' => 'API User',
        ]);
    }

    public function test_sso_rejects_invalid_token(): void
    {
        $response = $this->get('/sso/nexus?token=not-a-jwt');

        $response->assertUnauthorized();
    }

    public function test_sso_rejects_expired_token(): void
    {
        $token = $this->makeJwt([
            'iss' => 'https://emzinexus.com',
            'iat' => time() - 120,
            'exp' => time() - 60,
            'email' => 'late@example.com',
        ]);

        $response = $this->get('/sso/nexus?token=' . urlencode($token));

        $response->assertUnauthorized();
    }

    public function test_logout_redirects_to_nexus_return_to(): void
    {
        $user = User::factory()->create([
            'is_approved' => true,
        ]);

        $response = $this->actingAs($user)
            ->withSession(['nexus_return_to' => 'https://emzinexus.com/applications'])
            ->post('/logout');

        $response->assertRedirect('https://emzinexus.com/applications');
        $this->assertGuest();
    }

    private function makeJwt(array $payload): string
    {
        $header = $this->base64UrlEncode(json_encode(['alg' => 'HS256', 'typ' => 'JWT'], JSON_THROW_ON_ERROR));
        $encodedPayload = $this->base64UrlEncode(json_encode($payload, JSON_THROW_ON_ERROR));
        $signature = $this->base64UrlEncode(hash_hmac(
            'sha256',
            $header . '.' . $encodedPayload,
            'test-secret-key',
            true
        ));

        return $header . '.' . $encodedPayload . '.' . $signature;
    }

    private function base64UrlEncode(string $value): string
    {
        return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
    }
}
