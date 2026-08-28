# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Write non verbose code. When appropriate, make sure to use global variables for css and use reusable components.

Update the root README.md file when appropriate.

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

Target deployment: Neon (Postgres) for the backend's DB, Cloud Run for the backend
container, Firebase Hosting for the frontend static build, GitHub Actions for CI/CD — see
CI/CD (step 9) below for how these are wired together. The whole stack is meant to run on
free tiers — flag it before adding anything (file uploads, email/SMS, etc.) that would
require a paid service.

## Plan & progress

Keep this section current — update it whenever a step below is completed or the plan changes.

Build order:
1. ~~Scaffold: Laravel backend (API-only) + React/TS frontend, running locally, talking to each other~~ — **done**
2. ~~Auth: Sanctum setup, signup/login/logout, `role` field on the user model~~ — **done**
3. ~~RBAC: role-checking middleware, reflected in frontend UI (real enforcement stays server-side)~~ — **done**
4. ~~Pets: model/migration, relationship to User, full CRUD from the client role's perspective~~ — **done**
5. ~~Appointments: model/migration, relationships to Pet and User(s), status field, request/view/cancel (client) and view/update (employee) flows~~ — **done**
6. ~~Notes: model/migration, relationship to Pet/Appointment, write access for employees/admins, read-only for clients~~ — **done**
7. ~~Admin user management: screen/endpoints for admins to change any user's role and activate/deactivate accounts~~ — **done**
8. ~~Neon migration: swap local Postgres for Neon in the deployed environment~~ — **done**
9. ~~CI/CD: GitHub Actions — test/build on PR, deploy frontend to Firebase Hosting and backend to Cloud Run on merge to main~~ — **done**. Verified end-to-end on 2026-08-26: backend live at
   `https://podme-backend-uzmmmpgnvq-ue.a.run.app`, frontend at `https://podme-vet-app.web.app`,
   frontend bundle confirmed pointing at the live backend URL.
10. ~~Polish: form validation, error handling, empty/loading states, local dev seed data~~ — **done**
11. ~~Visual redesign: vet-clinic-themed look and feel across the whole frontend~~ — **done**
12. ~~Security hardening: API rate limiting, Sanctum token expiration, frontend security headers/CSP~~ — **done**

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
entered regardless of the viewer's timezone. `Note::created_at` doesn't need this treatment —
it's a genuine server-generated instant rather than user-entered wall-clock time, so the
frontend renders it with plain `new Date(...).toLocaleDateString()` and lets real UTC-to-local
conversion happen.

**Notes (step 6)**: `app/Models/Note.php` (`appointment_id` FK, `author_id` FK to `users`,
`content` text) `belongsTo` both `Appointment::appointment()` and `User::author()`;
`Appointment::notes()` is the inverse `hasMany`. Notes are nested under their appointment
rather than a flat `/api/notes` resource (`GET/POST /api/appointments/{appointment}/notes` in
`app/Http/Controllers/NoteController.php`) since a note only ever makes sense in the context
of one visit — the same reasoning as the appointment status actions. There is no
update/destroy: notes are an intentional immutable visit record once written. `NotePolicy`
only defines `create(User, Appointment)` (staff-only, same "second-argument context" pattern
as `AppointmentPolicy::create`) — viewing is gated by reusing `AppointmentPolicy::view` in
`NoteController::index` (if you can see the appointment, you can see its notes; clients
read-only, staff any), so there's no separate view-permission logic to duplicate.
`app/Http/Requests/Note/StoreNoteRequest.php` validates `content`. `author_id` and
`appointment_id` are left out of `Fillable` (same pattern as `pet_id`/`status` on Appointment)
— set via `$note->appointment()->associate()` / `$note->author()->associate($request->user())`.
Covered by `tests/Feature/Notes/NoteTest.php` (8 tests: staff-only write, client read-only
scoped to their own pets, validation).

**Frontend notes UI**: `src/components/NotesSection.tsx` is self-contained (unlike `PetForm`/
`AppointmentForm`, which are pure forms driven by the parent page) — it reads `useAuth()`
directly and manages its own fetch/expand/submit state, rendered per-appointment-card in
`AppointmentsPage` as `<NotesSection appointmentId={appointment.id} canWrite={!isClient} />`.
Starts collapsed as a "Notes" button; expanding lazy-loads that appointment's notes on first
open so idle appointment cards don't all fetch notes up front. `canWrite` only renders the
add-note textarea/button for staff; clients get the read-only list. API calls in
`src/lib/notes.ts`.

**Admin user management (step 7)**: no create-account flow — users always self-register via
`/api/register` (forced to `client`, per the RBAC section above), and admins only manage
*existing* accounts: change any user's role (client/employee/admin) or toggle an `is_active`
boolean. `is_active` was deliberately added as a plain boolean column (`database/migrations/
..._add_is_active_to_users_table.php`, cast in `User::casts()`) rather than Laravel's
SoftDeletes — a real on/off flag reads as exactly what it does, where SoftDeletes' automatic
query-scope-hiding is designed for actual record deletion and could surprise other
relations/queries later. Like `role`, `is_active` is left out of `Fillable`; `AuthController::
login` rejects with a validation error if `$user->is_active` is false, and deactivating a user
(`Admin\UserController::deactivate`) also calls `$user->tokens()->delete()` so every existing
Sanctum token is revoked immediately rather than just blocking future logins.

`app/Policies/UserPolicy.php` covers `viewAny`/`updateRole`/`activate`/`deactivate`, all
admin-only — but the interesting rule isn't "who," it's "on whom": every method also checks
`$user->id !== $target->id`, so an admin can't demote or deactivate their own account and
accidentally lock out every admin. This is why the routes use plain `auth:sanctum` rather than
`role:admin` middleware — the coarse role middleware can't express a per-record "except
yourself" rule, only a real Policy can. Routes live under `/api/admin/users` in
`App\Http\Controllers\Admin\UserController` (a new `Admin\` controller namespace, same
convention as `Auth\AuthController`). Covered by
`tests/Feature/Admin/UserManagementTest.php` (11 tests). One test-only caveat worth knowing:
you can't prove "an old token stops working" by replaying it with a second HTTP call inside
the same test method — Laravel's test client resolves the auth guard once per test and a
second call can return the previously-cached user instead of re-validating the header, a
testing-only artifact since a real server re-validates every request fresh. The test instead
asserts the token row count drops to 0, which is what the controller code actually does.

**Frontend admin UI**: `src/pages/AdminUsersPage.tsx` (`/admin/users`, gated via
`<ProtectedRoute roles={['admin']}>`) lists every user with a role `<select>` and an Activate/
Deactivate button per row; the signed-in admin's own row renders both controls `disabled`,
mirroring the backend's self-protection rule (defense in depth — the server still enforces it
regardless). API calls in `src/lib/admin.ts`.

**Database (step 8 — Neon)**: local dev and the future deployed environment both point at the
same Neon (serverless Postgres) project now — there's no separate local Postgres anymore.
`config/database.php`'s `pgsql` connection already supported a `DB_URL` env var and an
`sslmode` option out of the box (Laravel default config, untouched), so the only change was
`.env`: `DB_URL` set to Neon's connection string (`postgresql://...?sslmode=require` — Laravel's
`ConfigurationUrlParser` aliases both `postgres://` and `postgresql://` to the `pgsql` driver,
so Neon's string works unmodified). Use Neon's **direct** connection string, not the pooled
`-pooler` one — PgBouncer in transaction mode doesn't support everything Laravel's migrator
needs. This environment's permission settings block reading or editing `backend/.env`
directly — ask the user to make `.env` changes themselves when needed. Don't trust
`config('database.connections.pgsql.host')` to verify which DB is active — Laravel only merges
`DB_URL` into the config at connection-build time, not into the raw config array, so that call
always shows the unparsed default; check `DB::connection()->getConfig('host')` instead, which
reflects the actual resolved connection. Tests are unaffected either way — they always run
against in-memory SQLite regardless of `.env` (see Commands below).

**CI/CD (step 9)**: one workflow, `.github/workflows/ci-cd.yml`, four jobs. `test-backend` /
`test-frontend` run on every PR and every push to `main` (build+test only). `deploy-backend` /
`deploy-frontend` are gated to `push` events on `main` via `needs:` on their test job;
`deploy-frontend` also depends on `deploy-backend` specifically so it can inject the
just-deployed Cloud Run URL into the frontend build as `VITE_API_URL` (the URL isn't knowable
before the service exists). `API_URL` in `src/lib/api.ts` now reads
`import.meta.env.VITE_API_URL`, falling back to `http://127.0.0.1:8000` for local dev — see
`src/vite-env.d.ts` for the type declaration Vite needs for a custom env var.

GCP project: reused the existing `dnd-friendly` project (already running an unrelated app)
rather than a fresh one — creating a new project hit a "linked projects" quota on the billing
account, and switching billing accounts was more setup than the teaching goal called for.
PodMe's resources are name-prefixed (`podme-*`) and IAM-isolated from the sibling app rather
than sharing its service accounts: own Artifact Registry repo (`podme-backend`, `us-east1`),
own Cloud Run service (`podme-backend`), own Firebase Hosting site (`podme-vet-app` —
Firebase Hosting supports multiple independently-addressable sites per project, so this
doesn't need to share the project's default site or its `*.web.app` domain), and two
dedicated service accounts:
- `podme-deployer` — what GitHub Actions authenticates as. Has `run.admin`,
  `artifactregistry.writer`, `firebasehosting.admin` at the project level (these operations
  don't support finer-grained resource-scoped roles), plus `iam.serviceAccountUser` scoped
  only to `podme-backend-runtime` (a per-service-account IAM binding, not a project-level
  role) so it can deploy Cloud Run as that identity without being able to impersonate the
  sibling app's service accounts too.
- `podme-backend-runtime` — the identity Cloud Run actually runs as at request time. Only
  holds `secretmanager.secretAccessor`, and only on the two secrets below.

Auth: Workload Identity Federation, not a downloaded service-account JSON key — GitHub's OIDC
token exchanges for short-lived GCP credentials, so there's no long-lived credential sitting in
a GitHub secret at all. Reused the existing `github-pool` WIF pool (just a shared OIDC trust
root, no per-app exposure) but added a new provider, `github-provider-podme`, with its own
`attributeCondition` (`assertion.repository=='JPForman/PodMe'`) rather than widening the
sibling app's existing provider — so a compromised PodMe Actions run can't mint credentials
for the other app's deployer, or vice versa.

Secrets: `APP_KEY` and `DB_URL` live in Secret Manager (`podme-app-key`, `podme-db-url`), not
as GitHub Actions secrets. The workflow fetches them as plain env vars via
`google-github-actions/get-secretmanager-secrets` only where it must — running migrations
directly from the runner — while Cloud Run mounts them itself via `--set-secrets`, so the
running container's copy never passes through GitHub at all. `podme-db-url` was seeded with a
placeholder ("REPLACE_ME") since Claude can't read `backend/.env` (blocked by this
environment's permissions) — the user set the real Neon connection string afterward with
`gcloud secrets versions add podme-db-url --data-file=- --project=dnd-friendly`.

Migrations: run directly from the GitHub Actions runner as a `deploy-backend` step (not inside
the Cloud Run container), straight against Neon over the public internet, before the Cloud Run
deploy step — simpler than exec-ing into a running container or standing up a separate Cloud
Run Job for what's currently a single-command need. Needs `DB_CONNECTION=pgsql` set alongside
`DB_URL` in that step's env — `config/database.php`'s default connection falls back to
`sqlite` (`env('DB_CONNECTION', 'sqlite')`) when `DB_CONNECTION` isn't set, so `DB_URL` alone
isn't enough to point the migrator at Postgres.

Pitfalls hit getting the first deploy green (fixed, but worth knowing if similar errors show
up again after touching this area): `composer.lock` had drifted to require PHP ≥8.4 (locked
symfony 8.1.x) even though `composer.json`/this doc still said "PHP 8.3+" — CI and the
Dockerfile both target PHP 8.4 to match; `tests/Unit` was an empty directory that existed
locally but was never actually committed (git doesn't track empty directories), so a fresh CI
checkout couldn't find it — fixed with a `.gitkeep`, and worth remembering the next time a
`tests/*` subdirectory is added; the FrankenPHP base image has neither the PHP `zip` extension
nor an `unzip` binary, so `composer install` in the Dockerfile failed until `apt-get install
unzip` was added.

Backend container: `PodMe/backend/Dockerfile` builds on FrankenPHP (`dunglas/frankenphp`)
rather than hand-assembling nginx + php-fpm as separate processes — it's a single binary that
serves the app directly, which is Laravel's own current recommendation for containerizing
without extra process-supervision config (a rough JS analogue: one process serving requests,
like Fastify's built-in server, instead of nginx reverse-proxying to a separate app process).
Trade-off worth knowing: no `config:cache`/`route:cache` at container startup — skipped for
simplicity, since config is just read fresh from Cloud Run's injected env vars on every
request, which is fine at this app's traffic level.

**Polish (step 10)**: `database/seeders/DatabaseSeeder.php` now seeds one login per role
(`admin@podme.test` / `employee@podme.test` / `client@podme.test`, plus a deactivated
`inactive@podme.test`, all password `password`) via `User::factory()->create([...])`, using
the same factories `tests/Feature/*` already relied on
(`database/factories/{User,Pet,Appointment,Note}Factory.php`). Worth knowing: Eloquent
factories instantiate models inside `Model::unguarded()`, so passing `role`/`is_active` to
`create()` works even though both are deliberately excluded from `User`'s `Fillable` — mass-
assignment protection only applies to attributes coming from request input, not factory-built
models. The client login gets two pets and one appointment in each status (requested/
confirmed/completed/cancelled, with notes on the confirmed and completed ones) so every screen
has something to render without registering accounts by hand. Run `php artisan migrate:fresh
--seed` to reset.

`PetForm`/`AppointmentForm` now surface **per-field** backend validation errors (they only
showed `ApiError.message` as one generic string before) — same `error={errors.field?.[0]}`
pattern `RegisterPage` already used, now applied consistently. `FormField` grew optional
`min`/`step` passthroughs for this: the weight input needed `step="any"` because the browser's
default `step="1"` on `<input type="number">` silently blocks submitting a fractional value
(a real bug this surfaced — editing a pet with a decimal weight like `52.62` couldn't be saved
at all, since native HTML5 validation rejected it before the request ever went out); the
appointment datetime input got `min={now}` so the browser blocks picking a past time up front,
mirroring `StoreAppointmentRequest`'s `after:now` rule instead of only catching it after a
round-trip. Every page that gated on `isLoading` returned `null` (a blank flash on every
navigation, including `ProtectedRoute` on every protected route) — replaced with a
`.loading-text` message. `PetsPage`'s delete button had no confirmation and no pending state
(a misclick permanently deleted a pet with no undo); it now calls `window.confirm()` first and
disables the row's buttons while the request is in flight, and `AppointmentsPage`'s
confirm/complete/cancel transitions got the same per-row pending-disable treatment to prevent
double-submits from a slow network.

**Visual redesign (step 11)**: the frontend went from an unstyled Vite/React scaffold (purple
docs-site palette, no icons, no imagery, no persistent nav) to a vet-clinic-themed look
inspired by real veterinary hospital sites. `src/index.css`'s `:root` CSS-variable palette was
recolored (warm teal `--accent`, amber `--accent-2`, cream `--bg`) with the same variable
*names* kept so every consuming class restyled for free — including the existing
`@media (prefers-color-scheme: dark)` override block, which mirrors the same names with
dark-appropriate values, same pattern as before. Fonts are Google Fonts loaded via a plain
`<link>` in `index.html` (Fredoka for headings, Inter for body) — no build-tooling font
package. Icons are `lucide-react` (a new npm dependency). Photography is hotlinked directly
from Unsplash's CDN (`images.unsplash.com/photo-<slug>`) rather than downloaded/stored — there
is no file-upload or image-hosting service in this app, and the free-tier constraint ruled one
out, so every photo URL used was manually verified (HTTP 200 + visual content check) before
being hardcoded into the relevant page.

A persistent layout shell didn't exist before this step — every page was a bare `<section>`
with no header/nav/footer, and cross-page links only lived inline on `DashboardPage`. New
`src/components/layout/{SiteHeader,SiteFooter,SiteLayout}.tsx` fill that gap.
`SiteLayout` is wired in via React Router's *layout route* pattern in `App.tsx` — a parent
`<Route element={<SiteLayout />}>` with no `path` of its own, wrapping the existing route list;
`SiteLayout` renders `<SiteHeader/>`, then `<main><Outlet/></main>`, then `<SiteFooter/>`, so
the header/footer render once instead of being repeated per route. This is why the old fixed
`#root { width: 1126px; border-inline: ... }` rule was deleted — page-width constraint moved to
a single `.site-main` rule on that shared `<main>` instead of a per-page class. `SiteHeader`
reads `useAuth()` directly to switch between nav links + logout (authenticated) and Log
in/Register buttons (guest); `ProtectedRoute` itself needed no changes since it just nests
inside the layout route exactly as before.

`HomePage` was promoted from a 3-line placeholder function inline in `App.tsx` into a real
`src/pages/HomePage.tsx` landing page (hero banner, services grid, trust badges) — the
services list and trust-badge stats (e.g. "500+ Happy Pets") are intentionally fictional
placeholder marketing copy, approved as fine for a demo app with no real clinic behind it.
`AppointmentsPage` gained a `STATUS_CLASS` lookup object (same pattern as its existing
`STATUS_LABEL` map) mapping each `Appointment['status']` to a `status-{requested,confirmed,
completed,cancelled}` CSS modifier class, so appointment status badges are color-coded instead
of all sharing the generic `.role-badge` look.

**Security hardening (step 12)**: a full-app security review (not diff-based — the repo has
no tracked upstream branch) found the RBAC/mass-assignment/query layer already solid (Eloquent
everywhere, no raw SQL; `role`/`is_active`/`owner_id`/`pet_id`/`status`/`appointment_id`/
`author_id` all kept out of `Fillable`; no XSS sinks anywhere in the frontend — zero matches
for `dangerouslySetInnerHTML`/`innerHTML`/`eval`; `APP_DEBUG` safely defaults false and CI sets
it explicitly false in prod; CI/CD already uses Workload Identity Federation, not static GCP
keys) but surfaced three gaps, now fixed:

- **API rate limiting** — previously nonexistent (`bootstrap/app.php` never called
  `throttleApi()` or registered any `RateLimiter::for()`), so `/api/login`/`/api/register` were
  fully brute-forceable. Named limiters now live in `app/Providers/AppServiceProvider.php`
  (Laravel 11+ removed `RouteServiceProvider`, the old home for these) — `api` (60/min, keyed by
  user id or IP) applied globally via `$middleware->throttleApi()` in `bootstrap/app.php`, plus
  tighter `login` and `register` limiters (5/min each, `login` keyed by `email|ip` so one
  attacker email isn't throttled by the *other* users sharing its IP) applied per-route in
  `routes/api.php`. Verified against a running dev server: the 6th rapid login/register attempt
  returns `429` with a `Retry-After` header.
- **Sanctum token expiration** — `config/sanctum.php`'s `expiration` was `null` (tokens never
  expired); now `10080` (7 days, in minutes). Sanctum checks `created_at > now() - expiration`,
  so this invalidates every *already-issued* token past 7 days old the moment it ships, not
  just new ones — worth knowing if testing against a long-lived dev session. This exposed a
  frontend gap: `apiFetch` had no 401 handling at all (an expired token would render as a
  generic per-page error, not a re-login prompt). Fixed via a small handler-registry in
  `src/lib/api.ts` (`setUnauthorizedHandler`) that `AuthContext.tsx` wires up in a `useEffect`
  to clear `localStorage`/state on any 401 from an authenticated request (guarded by `token &&`
  so a plain wrong-password 422 on the login page never triggers it) — `ProtectedRoute` already
  redirects to `/login` whenever `user` is `null`, so no new redirect logic was needed.
- **Frontend security headers** — `firebase.json` had no `headers` block at all. Added
  `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`,
  `Permissions-Policy`, `Strict-Transport-Security` (no `preload` — that's a harder-to-reverse
  commitment than fits this pass), and a `Content-Security-Policy` scoped to what the app
  actually loads: Unsplash images (`img-src`), Google Fonts (`font-src`/part of `style-src`),
  the Cloud Run backend (`connect-src https://*.run.app` — a wildcard rather than the exact
  current URL, so the CSP survives the backend's URL changing later). `script-src` intentionally
  excludes `'unsafe-inline'` — the one inline `<script>` in `index.html` (a pre-paint
  theme-flash-prevention snippet) is instead allowlisted by an exact `sha256-` hash of its
  literal text, computed via `openssl dgst -sha256 -binary <script text> | openssl base64`; a
  comment directly above that script in `index.html` flags that editing its text invalidates
  the hash and silently reintroduces the theme flash (cosmetic breakage, not functional) until
  the hash in `firebase.json` is recomputed. `style-src` does keep `'unsafe-inline'`, since
  several pages use React's `style={{...}}` prop (rendered as literal inline `style=""`
  attributes with no practical hash/nonce for dynamic values) — a much smaller relaxation than
  `'unsafe-inline'` on `script-src` would be, since style injection alone can't execute JS.

`composer audit` and `npm audit` were both run as a check (not auto-upgrade) — zero
vulnerabilities found in either dependency tree at the time of this review.
