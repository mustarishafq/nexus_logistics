<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class NexusSsoController extends Controller
{
    public function __invoke(Request $request)
    {
        if ($this->requiresHttps() && ! $request->secure()) {
            abort(Response::HTTP_FORBIDDEN, 'HTTPS is required.');
        }

        $result = $this->resolveSso($request);

        if ($result === null) {
            abort(Response::HTTP_UNAUTHORIZED, 'Unauthorized');
        }

        if ($result['return_to'] !== null) {
            $request->session()->put('nexus_return_to', $result['return_to']);
        }

        Auth::login($result['user']);
        $request->session()->regenerate();

        $params = ['access_token' => $result['api_token']];
        if ($result['return_to'] !== null) {
            $params['nexus_return_to'] = $result['return_to'];
        }

        return redirect()->route('home', $params);
    }

    public function exchange(Request $request)
    {
        if ($this->requiresHttps() && ! $request->secure()) {
            return response()->json(['message' => 'HTTPS is required.'], Response::HTTP_FORBIDDEN);
        }

        $result = $this->resolveSso($request);

        if ($result === null) {
            return response()->json(['message' => 'Unauthorized'], Response::HTTP_UNAUTHORIZED);
        }

        return response()->json([
            'access_token' => $result['api_token'],
            'nexus_return_to' => $result['return_to'],
        ]);
    }

    private function resolveSso(Request $request): ?array
    {
        $token = $request->query('token');

        if (! is_string($token) || trim($token) === '') {
            return null;
        }

        try {
            $claims = $this->decodeAndValidateToken($token);
        } catch (\Throwable $exception) {
            return null;
        }

        $returnTo = $request->query('return_to');
        if (! is_string($returnTo) || trim($returnTo) === '') {
            $returnTo = $claims['return_to'] ?? null;
        }

        $returnTo = $this->normalizeExternalUrl($returnTo);

        $user = User::query()->where('email', $claims['email'])->first();

        if (! $user) {
            $user = User::create([
                'name' => $claims['name'] ?: $claims['email'],
                'email' => $claims['email'],
                'password' => Str::random(64),
                'role' => $this->defaultRole(),
                'is_approved' => true,
            ]);
        } elseif (! $user->is_approved) {
            $user->is_approved = true;
            $user->save();
        }

        $user->tokens()->delete();
        $apiToken = $user->createToken('nexus-sso')->plainTextToken;

        return [
            'user' => $user,
            'api_token' => $apiToken,
            'return_to' => $returnTo,
        ];
    }

    private function defaultRole(): string
    {
        $role = (string) config('services.nexus.default_role', 'Viewer');

        return strtolower($role);
    }

    private function requiresHttps(): bool
    {
        return (bool) env('APP_FORCE_TLS')
            || str_starts_with((string) config('app.url'), 'https://');
    }

    private function decodeAndValidateToken(string $token): array
    {
        $parts = explode('.', $token);

        if (count($parts) !== 3) {
            throw new \RuntimeException('Malformed JWT');
        }

        [$encodedHeader, $encodedPayload, $encodedSignature] = $parts;

        $headerJson = $this->base64UrlDecode($encodedHeader);
        $payloadJson = $this->base64UrlDecode($encodedPayload);
        $signature = $this->base64UrlDecode($encodedSignature);

        $header = json_decode($headerJson, true);
        $payload = json_decode($payloadJson, true);

        if (! is_array($header) || ! is_array($payload)) {
            throw new \RuntimeException('Malformed JWT JSON');
        }

        if (($header['alg'] ?? null) !== 'HS256') {
            throw new \RuntimeException('Unexpected JWT algorithm');
        }

        $secret = (string) config('services.nexus.api_key');

        if ($secret === '') {
            throw new \RuntimeException('Missing Nexus secret');
        }

        $expectedSignature = hash_hmac('sha256', $encodedHeader . '.' . $encodedPayload, $secret, true);

        if (! hash_equals($expectedSignature, $signature)) {
            throw new \RuntimeException('Invalid JWT signature');
        }

        $exp = $payload['exp'] ?? null;
        $iss = $payload['iss'] ?? null;
        $expectedIssuer = rtrim((string) config('services.nexus.issuer', 'https://nexus.company.com'), '/');

        if (! is_numeric($exp) || (int) $exp < time()) {
            throw new \RuntimeException('JWT expired');
        }

        if (! is_string($iss) || rtrim($iss, '/') !== $expectedIssuer) {
            throw new \RuntimeException('Invalid JWT issuer');
        }

        $email = $payload['email'] ?? null;
        $name = $payload['name'] ?? null;
        $sub = $payload['sub'] ?? null;
        $returnTo = $payload['return_to'] ?? null;

        if (! is_string($email) || ! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new \RuntimeException('Invalid JWT email');
        }

        return [
            'email' => $email,
            'name' => is_string($name) ? trim($name) : '',
            'sub' => is_string($sub) ? trim($sub) : '',
            'return_to' => is_string($returnTo) ? trim($returnTo) : null,
        ];
    }

    private function normalizeExternalUrl(mixed $url): ?string
    {
        if (! is_string($url)) {
            return null;
        }

        $url = trim($url);
        if ($url === '' || ! filter_var($url, FILTER_VALIDATE_URL)) {
            return null;
        }

        $parts = parse_url($url);
        $scheme = strtolower((string) ($parts['scheme'] ?? ''));
        $host = $parts['host'] ?? null;

        if (! in_array($scheme, ['http', 'https'], true) || ! is_string($host) || $host === '') {
            return null;
        }

        return $url;
    }

    private function base64UrlDecode(string $value): string
    {
        $base64 = strtr($value, '-_', '+/');
        $padding = strlen($base64) % 4;

        if ($padding > 0) {
            $base64 .= str_repeat('=', 4 - $padding);
        }

        $decoded = base64_decode($base64, true);

        if ($decoded === false) {
            throw new \RuntimeException('Invalid base64url segment');
        }

        return $decoded;
    }
}
