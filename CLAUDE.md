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
2. ~~Auth: Sanctum setup, signup/login/logout, `role` field on the user model~~ — **done**
3. ~~RBAC: role-checking middleware, reflected in frontend UI (real enforcement stays server-side)~~ — **done**
4. ~~Pets: model/migration, relationship to User, full CRUD from the client role's perspective~~ — **done**
5. Appointments: model/migration, relationships to Pet and User(s), status field, request/view/cancel (client) and view/update (employee) flows — **current step**
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

**RBAC**: a single `role` column on `users` (values: `admin` / `employee` / `client`, plain
string column with a `client` default — not a DB-level enum) — deliberately not using the
`spatie/laravel-permission` package, to keep the mental model simple while teaching. `role` is
intentionally left out of `User`'s mass-assignable (`Fillable`) attributes so it can never be
set via client-supplied input; the register endpoint always forces new accounts to `client`,
and constants `User::ROLE_ADMIN` / `ROLE_EMPLOYEE` / `ROLE_CLIENT` exist on the model. Auth is
done: `POST /api/register`, `POST /api/login`, `POST /api/logout` (Sanctum token
issuance/revocation) live in `app/Http/Controllers/Auth/AuthController.php`, validated by
`app/Http/Requests/Auth/{Register,Login}Request.php`.

Role enforcement (step 3) is a custom route middleware — `app/Http/Middleware/EnsureUserHasRole.php`
reads `$request->user()->role` and aborts 403 if it isn't in the roles passed to it; it's
registered under the alias `role` in `bootstrap/app.php` (`withMiddleware`), so any route can
add `->middleware('role:admin,employee')` next to `auth:sanctum`. It stays available for
coarse, model-less checks, but per-record authorization (step 4 onward) uses Eloquent Policies
instead — see Pets below.

**Pets (step 4)**: `app/Models/Pet.php` (fields: `name`, `species` required; `breed`,
`date_of_birth`, `weight`, `notes` optional; `owner_id` FK to `users`, left out of `Fillable`
same as `role` on `User` so it's always set server-side from the authenticated user, never
from client input) `belongsTo` `User::owner()`; `User::pets()` is the inverse `hasMany`.
Authorization is `app/Policies/PetPolicy.php` (Laravel's per-record equivalent of a hand-rolled
`if` in an Express handler, auto-wired to `Pet` by naming convention, invoked via
`$this->authorize()` — added to the base `Controller` via the `AuthorizesRequests` trait):
clients can create/view/update/delete only their own pets; admins/employees can view any pet
(needed for appointments/notes in steps 5-6) but cannot create/edit/delete on a client's
behalf. `app/Http/Controllers/PetController.php` is a standard resource controller wired with
`Route::apiResource('pets', PetController::class)` in `routes/api.php`; `index` branches on
role to return either `$user->pets` (client) or all pets with `owner` eager-loaded (staff).
Validation is in `app/Http/Requests/Pet/{Store,Update}PetRequest.php`. Covered by
`tests/Feature/Pets/PetTest.php` (ownership, staff visibility, and validation, 14 tests).

**Frontend auth**: `src/context/AuthContext.tsx` holds `{ user, token }` (persisted to
`localStorage`) with `login`/`register`/`logout`, backed by a small fetch wrapper in
`src/lib/api.ts` (`apiFetch`, `ApiError`). `src/routes/ProtectedRoute.tsx` redirects to
`/login` when logged out, and accepts an optional `roles` prop for gating a route to specific
roles client-side — this is convenience/UX only, since real enforcement is server-side.
Pages: `LoginPage`, `RegisterPage`, `DashboardPage`, `PetsPage` (routed in `App.tsx` via
`react-router-dom`); `DashboardPage` renders different placeholder content per role and links
to `/pets`. `PetsPage` renders either an editable list (client, via the reusable `PetForm`
component for both create and edit) or a read-only list with owner name (staff); API calls
live in `src/lib/pets.ts`. `FormField` (`src/components/FormField.tsx`) grew `required` and
`multiline` props to support Pet's optional fields and the notes textarea, kept
backwards-compatible with the existing Auth forms (both default to the old behavior).

**Local dev database**: Homebrew Postgres 15 running locally, database `podme_dev`
(`DB_CONNECTION=pgsql`, `DB_HOST=127.0.0.1`, `DB_PORT=5432`, `DB_USERNAME=jpcyborg`, no
password — local trust auth) — not the SQLite Laravel defaults to out of the box. This
environment's permission settings block reading or editing `backend/.env` directly — ask the
user to make `.env` changes themselves when needed.
