# EMZI Nexus SSO Integration

Reference for Single Sign-On between **EMZI Nexus** and **Nexus Marketing Hub** (nexus_ads).

## Overview

Users launch this app from EMZI Nexus. Nexus signs a short-lived JWT and redirects the browser to `/sso/nexus`. This app validates the token, logs the user in (or provisions a new account), stores a `return_to` URL in session, and redirects to the app home page.

On logout, the user is sent back to EMZI Nexus (the stored `return_to` URL, or a configured fallback).

```
EMZI Nexus                          Nexus Marketing Hub
     │                                       │
     │  GET /sso/nexus?token=...&return_to=  │
     │ ─────────────────────────────────────►│
     │                                       │ validate JWT
     │                                       │ find/create user
     │                                       │ session: nexus_return_to
     │                                       │
     │  redirect to / (home)                 │
     │ ◄─────────────────────────────────────│
     │                                       │
     │  POST /logout                         │
     │ ◄─────────────────────────────────────│
     │                                       │
     │  redirect to return_to / applications │
     │ ─────────────────────────────────────►│
```

## Files

| File | Purpose |
|------|---------|
| `backend/app/Http/Controllers/NexusSsoController.php` | Validates JWT, provisions user, starts session |
| `backend/app/Http/Controllers/Auth/LogoutController.php` | Logs out and redirects back to Nexus |
| `backend/routes/web.php` | Registers SSO and logout routes |
| `backend/config/services.php` | Nexus config keys under `services.nexus` |

## Routes

| Method | Path | Name | Middleware | Description |
|--------|------|------|------------|-------------|
| `GET` | `/sso/nexus` | `sso.nexus` | — | SSO callback from EMZI Nexus |
| `POST` | `/logout` | `logout` | `auth` | Log out and return to Nexus |
| `GET` | `/` | `home` | — | Post-login landing page |

## Environment Variables

Add these to `backend/.env`:

```env
# Shared secret — must match the API Key in EMZI Nexus admin for this application.
NEXUS_API_KEY=

# Expected JWT `iss` claim — must match EMZI Nexus APP_URL (e.g. https://emzinexus.com).
NEXUS_ISSUER=https://emzinexus.com

# Optional logout fallback when session has no return_to. Defaults to {NEXUS_ISSUER}/applications.
NEXUS_LOGOUT_FALLBACK=

# Organization slug used when auto-provisioning new SSO users.
NEXUS_DEFAULT_ORG_SLUG=demo-org

# Spatie role assigned to auto-provisioned SSO users.
NEXUS_DEFAULT_ROLE=Viewer
```

Config mapping in `config/services.php`:

```php
'nexus' => [
    'api_key'          => env('NEXUS_API_KEY'),
    'issuer'           => env('NEXUS_ISSUER', 'https://nexus.company.com'),
    'logout_fallback'  => env('NEXUS_LOGOUT_FALLBACK'),
    'default_org_slug' => env('NEXUS_DEFAULT_ORG_SLUG', 'demo-org'),
    'default_role'     => env('NEXUS_DEFAULT_ROLE', 'Viewer'),
],
```

## EMZI Nexus Application Setup

Register this app in the EMZI Nexus admin panel:

| Field | Value |
|-------|-------|
| **Base URL** | App URL, e.g. `https://nexus-ads.test` |
| **Auth mode** | `jwt` |
| **API Key** | Same value as `NEXUS_API_KEY` in `.env` |
| **SSO endpoint** | `{base_url}/sso/nexus` |

Nexus builds the launch URL:

```
{base_url}/sso/nexus?token={jwt}&return_to={encoded_return_url}
```

Typical `return_to` value from Nexus: `https://emzinexus.com/applications`

## JWT Token

### Algorithm

- **HS256** signed with the application API key (`NEXUS_API_KEY`)

### Expected Claims

| Claim | Required | Description |
|-------|----------|-------------|
| `iss` | Yes | Issuer — must match `NEXUS_ISSUER` (trailing slash ignored) |
| `exp` | Yes | Expiry (Unix timestamp); token rejected if expired |
| `email` | Yes | Valid email address; used to find or create the local user |
| `sub` | No | Nexus user ID |
| `name` | No | Display name; falls back to email |
| `sys` | No | Application slug in Nexus |
| `return_to` | No | URL to redirect on logout; also accepted as query param |

### Example Payload

```json
{
  "iss": "https://emzinexus.com",
  "iat": 1717166400,
  "exp": 1717166460,
  "sub": "42",
  "email": "user@example.com",
  "name": "Jane Doe",
  "sys": "nexus-ads",
  "return_to": "https://emzinexus.com/applications"
}
```

Tokens are short-lived (typically 60 seconds) and single-use in practice.

## Login Flow

1. User clicks the app tile in EMZI Nexus.
2. Browser hits `GET /sso/nexus?token=...&return_to=...`.
3. Controller validates HTTPS when `APP_URL` is `https://` or `APP_FORCE_TLS=true`.
4. JWT signature, expiry, issuer, and email are verified.
5. Valid `return_to` (query param or claim) is stored in session as `nexus_return_to`.
6. User lookup by `email`:
   - **Found** — log in; reactivate if `status !== active`.
   - **Not found** — create user under `NEXUS_DEFAULT_ORG_SLUG` with role `NEXUS_DEFAULT_ROLE`.
7. Session regenerated; redirect to `route('home')`.

### Auto-Provisioned User Fields

| Field | Value |
|-------|-------|
| `organization_id` | Organization matching `NEXUS_DEFAULT_ORG_SLUG` |
| `name` | JWT `name` or `email` |
| `email` | JWT `email` |
| `password` | Random 64-char string (not used for login) |
| `status` | `active` |
| Role | `NEXUS_DEFAULT_ROLE` (default: `Viewer`) |

**Prerequisite:** run seeders so the default organization exists:

```bash
php artisan db:seed --class=OrganizationSeeder
php artisan db:seed --class=RoleSeeder
```

## Logout Flow

1. Authenticated user submits `POST /logout` (CSRF required).
2. Controller pulls `nexus_return_to` from session.
3. Local auth session is cleared and invalidated.
4. Browser redirects to:
   - stored `nexus_return_to`, if valid; else
   - `NEXUS_LOGOUT_FALLBACK`, if set; else
   - `{NEXUS_ISSUER}/applications`

### Logout Button (Blade)

```blade
<form method="POST" action="{{ route('logout') }}">
    @csrf
    <button type="submit">Logout</button>
</form>
```

### Logout Button (React / fetch)

```js
await fetch('/logout', {
  method: 'POST',
  headers: {
    'X-XSRF-TOKEN': decodeURIComponent(
      document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] ?? ''
    ),
    Accept: 'text/html',
  },
  credentials: 'same-origin',
});
window.location.href = '/'; // server responds with 302 to Nexus
```

## Security Notes

- HTTPS is enforced when the app is served over HTTPS (`APP_URL` starts with `https://`) or when `APP_FORCE_TLS=true`.
- External redirect URLs must use `http` or `https` with a valid host.
- JWT validation uses `hash_equals` for signature comparison.
- Invalid or expired tokens return `401 Unauthorized`.
- Missing API key returns `401` during token validation.
- Missing default organization returns `503` when provisioning a new user.

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| `401 Unauthorized` on SSO | Wrong `NEXUS_API_KEY`, expired token, or issuer mismatch | Match API key in Nexus admin; confirm `NEXUS_ISSUER` equals Nexus `APP_URL` |
| `403 HTTPS is required` | HTTP request while app expects TLS | Use HTTPS locally (Herd/Valet) or set `APP_URL=http://...` for local dev |
| `503 Default organization is not configured` | `demo-org` missing | Run `OrganizationSeeder` or set `NEXUS_DEFAULT_ORG_SLUG` to an existing org |
| Logout goes to wrong URL | Session lost or invalid `return_to` | Set `NEXUS_LOGOUT_FALLBACK`; ensure session driver persists (default: `database`) |
| User has no permissions | Default role too restrictive | Change `NEXUS_DEFAULT_ROLE` or assign roles after provisioning |

## Related EMZI Projects

Same SSO pattern is used in:

- `fms` — `NexusSsoController` + `LoginController::logout`
- `emzi_book` — `NexusSsoController` + `LoginController::logout`
- `snipeit` — `NexusSsoController` + `LoginController::logout`
- `phantomnew` — `NexusSsoController` + `SessionsController::destroy`

Nexus token signing source: `nexus/backend/app/Http/Controllers/Api/ApplicationController.php`
