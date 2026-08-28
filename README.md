# 🐾 PodMe

🔗 **Live site:** [podme-vet-app.web.app](https://podme-vet-app.web.app)

A vet office management app for clients, pets, appointments, and visit notes — with
role-based access for **admins**, **employees**, and **clients**.

Built as a hands-on teaching project (an experienced JS/TS dev's first pass at PHP and
Laravel), pairing a Laravel API backend with a React + TypeScript frontend.

## Features

- 🔐 **Auth** — token-based auth via Laravel Sanctum (register / login / logout)
- 🧑‍🤝‍🧑 **Role-based access** — `admin` / `employee` / `client`, enforced server-side via
  middleware and Eloquent Policies
- 🐶 **Pets** — full CRUD, scoped to the owning client; staff can view all pets
- 📅 **Appointments** — request / confirm / complete / cancel workflow with per-transition
  authorization rules
- 📝 **Visit notes** — immutable notes staff attach to appointments, read-only for clients
- 🛠️ **Admin console** — change any user's role, activate/deactivate accounts
- 🔒 **Hardened** — API rate limiting, expiring auth tokens, CSP and security headers on the
  deployed frontend

## Tech stack

| | |
|---|---|
| **Backend** | [Laravel 13](https://laravel.com) (PHP 8.3+), API-only, [Sanctum](https://laravel.com/docs/sanctum) auth |
| **Frontend** | [React 19](https://react.dev) + TypeScript, built with [Vite](https://vitejs.dev), [lucide-react](https://lucide.dev) icons |
| **Database** | Postgres ([Neon](https://neon.tech), serverless) |
| **Target deploy** | Cloud Run (backend) · Firebase Hosting (frontend) · GitHub Actions (CI/CD) |

The backend and frontend are independent projects with no shared tooling — they only talk to
each other over HTTP.

## Project structure

```
PodMe/
├── backend/    # Laravel API (routes/api.php, app/Models, app/Http, app/Policies, tests/)
└── frontend/   # React + TS app (src/pages, src/components, src/context, src/lib)
```

## Getting started

### Prerequisites

- PHP 8.3+ and [Composer](https://getcomposer.org)
- Node.js and npm
- A Postgres database (local or [Neon](https://neon.tech))

### Backend setup

```bash
cd PodMe/backend
composer install
cp .env.example .env        # then set DB_URL to your Postgres connection string
php artisan key:generate
php artisan migrate
php artisan db:seed         # optional: creates one login per role, password "password"
php artisan serve           # http://127.0.0.1:8000
```

Seeded logins (all password `password`): `admin@podme.test`, `employee@podme.test`,
`client@podme.test` (comes with sample pets/appointments/notes), `inactive@podme.test`
(deactivated, to test the login-blocked case).

### Frontend setup

```bash
cd PodMe/frontend
npm install
npm run dev                 # http://localhost:5173
```

## Useful commands

**Backend** (`PodMe/backend`)

| Command | Description |
|---|---|
| `php artisan test` | Run the full test suite (in-memory SQLite, safe to run anytime) |
| `php artisan migrate:fresh` | Drop all tables and re-run migrations |
| `vendor/bin/pint` | Fix PHP code style |
| `php artisan route:list` | Inspect all registered routes |
| `php artisan tinker` | REPL with the app booted |

**Frontend** (`PodMe/frontend`)

| Command | Description |
|---|---|
| `npm run build` | Type-check and build for production |
| `npm run lint` | Lint with oxlint |
| `npm run preview` | Preview the production build locally |

## Roles at a glance

| Role | Can do |
|---|---|
| **Client** | Manage their own pets, request/cancel their own appointments, view visit notes |
| **Employee** | View all pets/appointments, confirm/complete/cancel any appointment, write visit notes |
| **Admin** | Everything employees can, plus manage user roles and activate/deactivate accounts |

## Status

All 12 planned build steps are done: auth, RBAC, pets/appointments/notes, admin user
management, Neon migration, CI/CD, polish (validation, error/loading states, seed data), a
vet-clinic-themed visual pass, and a security hardening pass. CI/CD is live and verified —
GitHub Actions tests every PR and, on merge to `main`, deploys the backend to Cloud Run and the
frontend to Firebase Hosting. The frontend has a persistent header/nav/footer, warm color
palette, hero/service sections on the homepage, and photography sourced from Unsplash. A
full-app security review confirmed the RBAC/mass-assignment/query layer was already solid and
added API rate limiting, expiring auth tokens, and CSP/security headers on the deployed
frontend — `composer audit`/`npm audit` both report zero known vulnerabilities. See
[`CLAUDE.md`](./CLAUDE.md) for the full build plan, architecture notes, and design decisions.

## License

Personal/educational project — no license specified yet.
