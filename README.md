# Nexus Logistics

Logistics analytics platform with a React frontend and Laravel API backend. Replaces the former Base44 BaaS with a self-hosted open-source stack using MySQL, Laravel Sanctum authentication, and SMTP email.

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, TanStack Query, Tailwind |
| Backend | Laravel 13, Sanctum, MySQL |
| Auth | Email/password, admin approval, SMTP password reset |

## Prerequisites

- **PHP** 8.3+ with extensions: `pdo_mysql`, `mbstring`, `openssl`, `tokenizer`, `xml`, `ctype`, `json`, `bcmath`
- **Composer** 2.x
- **Node.js** 18+ and npm
- **MySQL** 8.x

## Quick start (local)

### 1. Create the database

```sql
CREATE DATABASE nexus_logistics CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Configure the backend

```bash
cd backend
cp .env.example .env
php artisan key:generate
```

Edit `backend/.env`:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=nexus_logistics
DB_USERNAME=root
DB_PASSWORD=your_password

APP_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5173
CORS_ALLOWED_ORIGINS=http://localhost:5173

# SMTP (required for forgot-password emails)
MAIL_MAILER=smtp
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=587
MAIL_USERNAME=your_smtp_user
MAIL_PASSWORD=your_smtp_password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@yourdomain.com
MAIL_FROM_NAME="Nexus Logistics"
```

For local development without real SMTP, set `MAIL_MAILER=log` — reset links will appear in `backend/storage/logs/laravel.log`.

### 3. Install dependencies

```bash
# From project root
npm install
cd frontend && npm install && cd ..
cd backend && composer install && cd ..
```

### 4. Run everything

From the **project root**:

```bash
npm run dev:full
```

This will:

1. Run database migrations
2. Seed the default admin user
3. Start Laravel API on `http://localhost:8000`
4. Start Vite dev server on `http://localhost:5173`

### 5. Log in

| Field | Value |
|-------|-------|
| URL | http://localhost:5173 |
| Email | `admin@admin.com` |
| Password | `password` |

## Authentication

- **Register**: New users sign up at `/register`. Accounts are created with `is_approved = false` and cannot log in until an admin approves them.
- **Admin approval**: Log in as admin → **Settings → Users** → click **Approve** on pending users.
- **Forgot password**: Uses Laravel's password reset with SMTP. Reset links point to `FRONTEND_URL/reset-password?token=...&email=...`.

## Manual commands

```bash
# Migrations only
cd backend && php artisan migrate

# Seed admin user only
cd backend && php artisan db:seed

# Backend only
cd backend && php artisan serve

# Frontend only
cd frontend && npm run dev

# Production frontend build
cd frontend && npm run build
```

## Cloud deployment

### Backend (Laravel API)

1. Deploy the `backend/` folder to your server (Forge, Railway, Render, AWS EC2, etc.).
2. Set environment variables (same as `.env.example`, with production values).
3. Run:

```bash
composer install --no-dev --optimize-autoloader
php artisan key:generate
php artisan migrate --force
php artisan db:seed --force
php artisan config:cache
php artisan route:cache
```

4. Point your web server (Nginx/Apache) document root to `backend/public`.
5. Set `APP_URL` to your API domain (e.g. `https://api.yourdomain.com`).
6. Configure a managed MySQL database and update `DB_*` variables.

### Frontend (React SPA)

1. Build with your API URL:

```bash
cd frontend
VITE_API_URL=https://api.yourdomain.com/api npm run build
```

2. Deploy the `frontend/dist/` folder to static hosting (Vercel, Netlify, S3 + CloudFront, Nginx).
3. Set `FRONTEND_URL` and `CORS_ALLOWED_ORIGINS` on the backend to your frontend domain.

### Example production env

**Backend:**

```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://api.yourdomain.com
FRONTEND_URL=https://app.yourdomain.com
CORS_ALLOWED_ORIGINS=https://app.yourdomain.com

DB_CONNECTION=mysql
DB_HOST=your-db-host
DB_DATABASE=nexus_logistics
DB_USERNAME=...
DB_PASSWORD=...

MAIL_MAILER=smtp
MAIL_HOST=smtp.sendgrid.net
MAIL_PORT=587
MAIL_USERNAME=apikey
MAIL_PASSWORD=your_sendgrid_api_key
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@yourdomain.com
```

**Frontend build:**

```bash
VITE_API_URL=https://api.yourdomain.com/api npm run build
```

## Database schema

Migrations preserve the original entity structure from the Base44 app:

- `users` — extended with `role` (admin/viewer) and `is_approved`
- `shipments`, `sla_rules`, `source_systems`, `webhook_logs`, `tracking_events`

## Project structure

```
logistics/
├── backend/          # Laravel API
├── frontend/         # React SPA
├── package.json      # Root scripts (dev:full)
└── README.md
```

## License

MIT
