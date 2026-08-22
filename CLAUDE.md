# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Write non verbose code. When appropriate, make sure to use global variables for css and use reusable components.

## Project

A vet office management app (clients/pets/appointments/visit notes with role-based access:
admin / employee / client) built as a **teaching project** — the user is an experienced
JS/TS developer who is new to PHP and Laravel. When writing backend code, briefly explain
Laravel/PHP concepts the first time they show up (service providers, Eloquent, migrations,
routing, middleware, form requests, policies/gates, artisan commands) and relate them to the
Node/Express equivalents the user already knows. Pause before significant architectural
decisions rather than assuming — the user wants to make those calls.

The two apps under `PodMe/` are independent projects with no shared tooling between them;
they only talk to each other over HTTP.

- `PodMe/backend` — Laravel 13, API-only (REST), PHP 8.3+
- `PodMe/frontend` — React 19 + TypeScript, built with Vite

Target deployment (not yet wired up): Neon (Postgres) for the backend's DB, Cloud Run for
the backend container, Firebase Hosting for the frontend static build, GitHub Actions for
CI/CD. The whole stack is meant to run on free tiers — flag it before adding anything
(file uploads, email/SMS, etc.) that would require a paid service.

## Plan & progress

Keep this section current — update it whenever a step below is completed or the plan changes.

Build order:
1. ~~Scaffold: Laravel backend (API-only) + React/TS frontend, running locally, talking to each other~~ — **done**
2. Auth: Sanctum setup, signup/login/logout, `role` field on the user model — **current step**
3. RBAC: policies/middleware enforcing role permissions, reflected in frontend UI (real enforcement stays server-side)
4. Pets: model/migration, relationship to User, full CRUD from the client role's perspective
5. Appointments: model/migration, relationships to Pet and User(s), status field, request/view/cancel (client) and view/update (employee) flows
6. Notes: model/migration, relationship to Pet/Appointment, write access for employees/admins, read-only for clients
7. Admin employee management: screen/endpoints for admins to create/deactivate employee accounts
8. Neon migration: swap local Postgres for Neon in the deployed environment
9. CI/CD: GitHub Actions — test/build on PR, deploy frontend to Firebase Hosting and backend to Cloud Run on merge to main
10. Polish: form validation, error handling, empty/loading states, local dev seed data

Open questions (ask the user before assuming, when relevant step comes up):
- Whether appointment scheduling needs double-booking prevention in MVP, or a plain date/time field is enough
- Whether pet photos/file uploads are in scope for MVP (affects whether cloud storage is needed at all)

## Commands

### Backend (`PodMe/backend`)

```
composer install                       # install PHP deps
php artisan serve                       # dev server at http://127.0.0.1:8000
php artisan migrate                     # run migrations against the DB in .env
php artisan migrate:fresh                # drop all tables and re-run migrations
php artisan test                        # run the full PHPUnit suite (Unit + Feature)
php artisan test --filter=TestName      # run a single test
vendor/bin/pint                         # fix PHP code style (Laravel's formatter)
php artisan route:list                  # inspect all registered routes
php artisan tinker                      # REPL with the app booted
```

Tests always run against an in-memory SQLite DB regardless of what `.env` points to
(configured in `phpunit.xml`), so `php artisan test` is safe to run without touching the dev DB.

### Frontend (`PodMe/frontend`)

```
npm install
npm run dev       # Vite dev server at http://localhost:5173
npm run build     # tsc -b && vite build
npm run lint      # oxlint
npm run preview   # preview the production build locally
```

No frontend test runner is configured yet.

## Architecture

**Routing split**: `bootstrap/app.php` is Laravel 11+'s central app config file (replaces
the old `app/Http/Kernel.php` pattern) and wires both `routes/web.php` and `routes/api.php`.
Since this is an API-only backend for a separately-hosted SPA, all real endpoints belong in
`routes/api.php` — routes there are automatically prefixed with `/api`. `routes/web.php` is
unused Laravel boilerplate.

**Auth**: Laravel Sanctum in *token* mode (not cookie/session SPA mode) — the frontend holds
a bearer token and sends it via the `Authorization` header, not cookies. CORS is left at
Laravel's defaults (`allowed_origins: '*'` on `api/*`), which works for token auth but would
need `supports_credentials` if cookie-based auth were ever introduced instead.

**RBAC**: a single `role` column on `users` (values: `admin` / `employee` / `user`), enforced
with Laravel policies/gates — deliberately not using the `spatie/laravel-permission` package,
to keep the mental model simple while teaching. Only the default Laravel `User` model/migration
exists so far; `role` and the app's real domain models (Pets, Appointments, Notes) are not yet
implemented.

**Local dev database**: Homebrew Postgres 15 running locally, database `podme_dev`
(`DB_CONNECTION=pgsql`, `DB_HOST=127.0.0.1`, `DB_PORT=5432`, `DB_USERNAME=jpcyborg`, no
password — local trust auth) — not the SQLite Laravel defaults to out of the box. This
environment's permission settings block reading or editing `backend/.env` directly — ask the
user to make `.env` changes themselves when needed.
