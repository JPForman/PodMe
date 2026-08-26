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
5. ~~Appointments: model/migration, relationships to Pet and User(s), status field, request/view/cancel (client) and view/update (employee) flows~~ — **done**
6. Notes: model/migration, relationship to Pet/Appointment, write access for employees/admins, read-only for clients — **current step**
7. Admin employee management: screen/endpoints for admins to create/deactivate employee accounts
8. Neon migration: swap local Postgres for Neon in the deployed environment
9. CI/CD: GitHub Actions — test/build on PR, deploy frontend to Firebase Hosting and backend to Cloud Run on merge to main
10. Polish: form validation, error handling, empty/loading states, local dev seed data

Open questions (ask the user before assuming, when relevant step comes up):
- Whether pet photos/file uploads are in scope for MVP (affects whether cloud storage is needed at all)

Deferred (deliberately out of MVP scope, revisit later):
- **Double-booking prevention for appointments.** Step 5 shipped with a plain `scheduled_at`
  datetime and no overlap validation — the user explicitly asked to flag this so it isn't
  forgotten. When picked up: decide whether conflicts are checked per-employee or clinic-wide
  (moot today since there's no per-appointment employee assignment — see Architecture below),
  and whether it's a hard validation error or just a warning.

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

**Appointments (step 5)**: `app/Models/Appointment.php` (`pet_id` FK, `status` string —
`STATUS_REQUESTED`/`CONFIRMED`/`COMPLETED`/`CANCELLED` constants, `scheduled_at` datetime,
`reason` optional text) `belongsTo` `Pet::pet()`; `Pet::appointments()` is the inverse
`hasMany`. No employee-assignment field — any admin/employee can view and act on any
appointment (shared staff access, same model as Pets staff visibility), so there's no
per-appointment owner among staff. `pet_id` and `status` are both left out of `Fillable` (same
pattern as `owner_id`/`role` elsewhere) — `pet_id` is set via `$appointment->pet()->associate()`
and `status` via direct property assignment, never mass assignment, since both matter for
authorization and must never come from client input.

Status changes are **not** a generic `update` endpoint — each transition
(`confirm`/`complete`/`cancel`) is its own route (`PATCH /api/appointments/{id}/{action}`) and
its own `AppointmentPolicy` method. This splits "who is allowed to attempt this transition"
(the Policy's job, 403 on failure) from "does the appointment's current status allow it" (a
plain check in `AppointmentController` returning 422 on failure) — a deliberate teaching
example of separating authorization from business-rule validation. Rules: clients
request/cancel only for their own pets; only staff confirm/complete; either side can cancel
until `completed`. `create` on `AppointmentPolicy` takes the target `Pet` as a second argument
(`$this->authorize('create', [Appointment::class, $pet])`), the standard Laravel pattern for
"can this user create X" checks that depend on a related model rather than the new record
itself. Every response that returns an appointment eager-loads `pet.owner:id,name,email` —
easy to forget on the confirm/complete/cancel actions specifically, since those look up the
model via route binding rather than a query that already joins it; forgetting it silently
drops the pet/owner info the frontend cards render. Covered by
`tests/Feature/Appointments/AppointmentTest.php` (16 tests: ownership, staff-only transitions,
status-transition validation, staff visibility).

**Frontend auth**: `src/context/AuthContext.tsx` holds `{ user, token }` (persisted to
`localStorage`) with `login`/`register`/`logout`, backed by a small fetch wrapper in
`src/lib/api.ts` (`apiFetch`, `ApiError`). `src/routes/ProtectedRoute.tsx` redirects to
`/login` when logged out, and accepts an optional `roles` prop for gating a route to specific
roles client-side — this is convenience/UX only, since real enforcement is server-side.
Pages: `LoginPage`, `RegisterPage`, `DashboardPage`, `PetsPage`, `AppointmentsPage` (routed in
`App.tsx` via `react-router-dom`); `DashboardPage` renders different placeholder content per
role and links to `/pets` and `/appointments`. `PetsPage` renders either an editable list
(client, via the reusable `PetForm` component for both create and edit) or a read-only list
with owner name (staff); API calls live in `src/lib/pets.ts`. `AppointmentsPage` mirrors that
pattern: clients get a `AppointmentForm` to request one (pet picked from their own
`listPets()` results) plus Cancel on their own; staff get Confirm/Mark completed/Cancel
depending on status, no create form; API calls in `src/lib/appointments.ts`. `FormField`
(`src/components/FormField.tsx`) grew `required` and `multiline` props to support Pet's
optional fields and the notes textarea, kept backwards-compatible with the existing Auth forms
(both default to the old behavior).

**No timezone concept in scheduling**: `scheduled_at` is a plain datetime with no timezone
handling anywhere in the stack (single physical office, not a multi-timezone concern). This
matters for display: `Appointment::casts()` marks `scheduled_at` as `datetime`, so Eloquent
always serializes it with a `Z` (UTC) suffix even though no real timezone conversion happened.
Rendering it with `new Date(iso).toLocaleString()` on the frontend would silently reinterpret
those UTC-labeled digits through the browser's local offset and display the wrong time — hit
this exact bug during manual testing. Fixed by `formatScheduledAt()` in
`src/lib/appointments.ts`, which builds the `Date` from the literal digits (year/month/day/
hour/minute) instead of parsing the ISO string, so the displayed time always matches what was
entered regardless of the viewer's timezone.

**Local dev database**: Homebrew Postgres 15 running locally, database `podme_dev`
(`DB_CONNECTION=pgsql`, `DB_HOST=127.0.0.1`, `DB_PORT=5432`, `DB_USERNAME=jpcyborg`, no
password — local trust auth) — not the SQLite Laravel defaults to out of the box. This
environment's permission settings block reading or editing `backend/.env` directly — ask the
user to make `.env` changes themselves when needed.
