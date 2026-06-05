<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class LogoutController extends Controller
{
    public function __invoke(Request $request): RedirectResponse
    {
        $logoutTarget = $request->session()->pull('nexus_return_to');

        if ($request->user()) {
            $request->user()->tokens()->delete();
        }

        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->away($this->resolveLogoutTarget($logoutTarget));
    }

    private function resolveLogoutTarget(mixed $target): string
    {
        if (is_string($target) && trim($target) !== '') {
            $normalizedTarget = $this->normalizeExternalUrl($target);
            if ($normalizedTarget !== null) {
                return $normalizedTarget;
            }
        }

        $fallback = config('services.nexus.logout_fallback');
        if (! is_string($fallback) || trim($fallback) === '') {
            $issuer = (string) config('services.nexus.issuer', 'https://nexus.company.com');
            $fallback = rtrim($issuer, '/') . '/applications';
        }

        $normalizedFallback = $this->normalizeExternalUrl($fallback);
        if ($normalizedFallback !== null) {
            return $normalizedFallback;
        }

        return 'https://nexus.company.com/applications';
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
}
