# CLAUDE.md

Guidance for working in this repository.

## What this is

A **school thrift-store & lost-and-found collection platform**. Parents and students buy
second-hand or lost-and-found items from the institution (school/university) they are registered to,
pay online (ZAR via **PayFast**), receive a **reference number**, and present it at the school to
collect the physical item.

## Project memory — keep PROJECT_BRAIN.md current

After completing any meaningful task, update **`PROJECT_BRAIN.md`** (repo root) so it stays a
compressed but complete snapshot of the project — overview, architecture, key decisions, completed
work, active work, blockers, and next actions — such that a fresh session can reconstruct the project
from that file alone. Edit it in place to reflect the current state (it is a living snapshot, not a
running history). This is the fastest way for a new session to get oriented; read it first.

## Architecture

Four independently-run apps. **There is no root `package.json`** — install and run each separately.

| Folder         | App                        | Stack                         | Dev URL                |
|----------------|----------------------------|-------------------------------|------------------------|
| `backend/`     | REST API                   | Node, Express 5 (ESM), pg     | http://localhost:5000  |
| `frontend/`    | Customer app (parents/students) | React 19 + Vite          | http://localhost:5173  |
| `admin/`       | Platform admin app         | React 19 + Vite               | http://localhost:5174  |
| `school-admin/`| School staff app (collections) | React 19 + Vite           | http://localhost:5175  |

All three React apps talk to the API via the shared `src/lib/axios.js`, whose base URL is
`import.meta.env.VITE_API_URL || "http://localhost:5000/api"` — env-driven, falling back to
localhost in dev. Set `VITE_API_URL` per app for other environments.

## Running locally

```bash
# Backend (port 5000) — nodemon auto-reloads on .js changes (NOT on .env changes)
cd backend && npm install && npm run dev      # or: npm start

# Each React app (separate terminals)
cd frontend && npm install && npm run dev      # 5173
cd admin && npm install && npm run dev         # 5174
cd school-admin && npm install && npm run dev  # 5175
```

Backend env: copy `backend/.env.example` to `backend/.env` and fill it in. `.env` is git-ignored.

## Backend

ES modules. Entry: `backend/server.js`. Layout:

- `config/` — `db.js` (pg `Pool` from `DATABASE_URL`), `cloudinary.js`
- `controllers/` — request handlers + SQL. Unit tests live beside them as `*.test.js`.
- `middleware/` — `authMiddleware.js` (`protect` = JWT required; `allowRoles(...roles)`), `multer.js`
- `routes/` — one Express router per resource, mounted in `server.js`
- `services/` — `payfastService.js` (signature build/verify), `emailService.js` (nodemailer)
- `db/migrations/` — SQL migrations (incremental deltas on the base schema), in filename order.
  Apply with the runner: `npm run migrate` (pending only), `npm run migrate:status`,
  `npm run migrate:baseline` (adopt the runner on an already-migrated DB). `db/migrate.js` tracks
  applied files in a `schema_migrations` table.

Route groups (all under `/api`): `auth`, `institutions`, `parents`, `students`, `users`,
`products`, `cart`, `checkout`, `payments`, `orders` (a user's own orders), `admin/orders`,
`admin/registrations`, `school`.

Tests (`cd backend`):
- `npm test` — fast pure-function unit tests (Node's built-in runner, no DB). Lives in `*.test.js`.
- `npm run test:integration` — integration tests (`test-int/*.int.js`) that run the real
  controllers against a **throwaway test database**. The runner (`test-int/run.js`) creates
  `thriftstore_test` (derived from `DATABASE_URL`, or set `TEST_DATABASE_URL`), applies
  `db/schema.sql` (a `pg_dump --schema-only` of the full schema), and truncates between tests.
  `config/db.js` points the pool at the test DB only when `NODE_ENV=test`. Plain `npm test` never
  touches a DB (it doesn't discover `test-int/`).

### Auth model

JWT payload: `{ id, role, institution_id, status }`. Roles: `admin`, `student`, `parent`,
`school`, `university`. Most data is **scoped by `institution_id`** — when adding endpoints for a
specific role, scope queries to `req.user.institution_id` (see `controllers/schoolController.js`).
Admins have `institution_id = null` and are not institution-scoped.

## React apps — conventions

All three apps share the same structure and libraries:

- **Feature-folder layout:** `src/features/<feature>/{api,hooks,pages,components,store}`.
- **Server state:** TanStack Query (`useQuery` / `useMutation`); keep `queryKey`s stable and
  `invalidateQueries` after mutations.
- **Client/UI state:** Zustand stores (e.g. `authStore`). Auth token is kept in the store and
  mirrored to `localStorage`.
- **HTTP:** the shared `src/lib/axios.js` instance; pass the token via an
  `authHeaders(token)` helper (`Authorization: Bearer <token>`).
- **Styling:** Tailwind CSS v4 (via `@tailwindcss/vite`), Lexend font. The customer/admin apps use
  custom theme tokens (e.g. `text-on-surface`, `bg-primary`); standard palette utilities
  (`teal-600`, etc.) are also available.
- **Routing:** `react-router-dom` with a central `src/app/router.jsx`; protected areas use a
  `ProtectedRoute`.
- Show user-facing errors **inline**, not via `alert()`.

## Domain model

- **Registration & approval:** public sign-ups are created with `status = 'pending'` and **cannot
  log in** until an admin approves them (`login` returns `403` otherwise). Admin approves/rejects in
  the admin app; approval can send an email (`emailService`, graceful — logs if SMTP unset). The
  `approval_status` enum is `pending | approved | rejected`.
- **Buying & collection:** items live in `products` (per institution, with a permanent
  `reference_number` like `ITEM-2026-000123`). A checkout creates a `collection_orders` row
  (`ORD-2026-000123`) + `collection_order_items`, and a PayFast payment. On a verified PayFast ITN
  the order becomes `ready_for_collection` and products become `Reserved`.
- **Claiming:** at the school, staff (school-admin app) verify the order/item reference and mark the
  order `collected` → items `collected`, products `Claimed`.
- **Key enums (values must match exactly):** `product_status` = Available, Sold, Pending, Reserved,
  Claimed, Cancelled · `listing_type` = "Thrift Store", "Lost and Found" · `collection_order_status`
  includes payment_pending, ready_for_collection, collected, cancelled, expired, payment_failed.

## Gotchas

- **`backend/.env` changes need a full backend restart** — nodemon watches `.js`, not `.env`.
- **Don't commit dependencies or build output.** `node_modules` and `dist` are git-ignored (root
  `.gitignore` + each app's own `.gitignore`), but a new app/folder won't be until it has a
  `.gitignore` — confirm before committing build artifacts.
- **DB migrations are deltas on a base schema** — apply with `npm run migrate` (tracks applied
  files in `schema_migrations`). On a DB that was already migrated by hand, run
  `npm run migrate:baseline` once to adopt the runner. `db/schema.sql` is the full `pg_dump` used
  for fresh DBs (and the integration test DB).
- **PayFast ITN signatures must include blank fields** when verifying (PayFast signs every posted
  field); outgoing payment requests omit them. See `services/payfastService.js`.
- Verify changes against the running app/DB where practical. The backend has both unit tests
  (`npm test`, no DB) and integration tests (`npm run test:integration`, throwaway DB) — but they
  don't cover every controller, so don't assume a passing suite means a path is exercised.
