# Thrift Store — School Thrift & Lost-and-Found Collection Platform

A full-stack web application that lets students and parents browse, reserve, pay for, and
collect second-hand ("thrift") items and lost-and-found property from their institution
(school or university). Administrators manage users, institutions, inventory, and the
collection/fulfilment workflow through a separate admin app.

> Payments are handled in **ZAR (South African Rand)** via **PayFast**, and product
> listings can be auto-described from photos using the **OpenAI** API.

---

## Architecture

The repository is a **three-part monorepo** with no root `package.json` — each app is
installed and run independently from its own folder.

```
Thrift-store
├── frontend/   Customer-facing React SPA (Vite)     → http://localhost:5173
├── admin/      Administrator React SPA (Vite)        → http://localhost:5174
└── backend/    Express REST API (Node, ES modules)   → http://localhost:5000
```

Both client apps talk to the backend at `http://localhost:5000/api` (configured in
`src/lib/axios.js`).

### Tech stack

| Layer    | Technologies |
|----------|--------------|
| Frontend & Admin | React 19, Vite 8, React Router 7, TanStack Query 5, Zustand, Axios, Tailwind CSS 4, React-Toastify, Lexend font |
| Backend  | Node.js, Express 5 (ES modules), PostgreSQL (`pg`), JWT (`jsonwebtoken`), bcrypt, Multer, Cloudinary, OpenAI, `validator`, `dotenv`, CORS |
| Payments | PayFast (sandbox/live), with MD5-signed requests and an ITN/webhook callback |
| Tooling  | ESLint 10, nodemon, Node's built-in test runner (`node --test`) |

---

## Backend (`/backend`)

An Express API using ES modules. Entry point: `server.js` (default port `5000`).

### Mounted routers

| Base path             | Purpose |
|-----------------------|---------|
| `/api/auth`           | Login & registration (users + admin) |
| `/api/institutions`   | List / register schools & universities |
| `/api/parents`        | Admin-driven parent registration |
| `/api/students`       | Admin-driven student registration |
| `/api/products`       | Product listing, creation, AI image analysis |
| `/api/users`          | Current-user profile & password management |
| `/api/cart`           | Collection cart (add/remove/clear/checkout) |
| `/api/checkout`       | Payment methods & checkout creation |
| `/api/payments`       | Payment confirmation + PayFast ITN / webhook |
| `/api/admin/orders`   | Admin order list, detail, and "mark collected" |

### Selected endpoints

```
POST  /api/auth/register/student-parent
POST  /api/auth/register/institution
POST  /api/auth/login
POST  /api/auth/admin/login
POST  /api/auth/admin/register/staff        (admin)

GET   /api/institutions
POST  /api/institutions/admin/register/institution   (admin)

POST  /api/products/analyze     (admin, multipart: image1..image5 → OpenAI)
POST  /api/products             (admin, multipart: image1..image5 → Cloudinary)
GET   /api/products             (auth)

GET    /api/cart                (auth)
POST   /api/cart/items          (auth)
DELETE /api/cart/items/:cartItemId
DELETE /api/cart                (auth)
POST   /api/cart/checkout       (auth)

GET   /api/checkout/payment-methods   (auth)
POST  /api/checkout/create            (auth)

POST  /api/payments/confirm                (auth)
POST  /api/payments/payfast/itn            (PayFast server callback)
POST  /api/payments/webhook

GET   /api/admin/orders                       (admin)
GET   /api/admin/orders/:orderReference        (admin)
PATCH /api/admin/orders/:orderReference/collect (admin)

GET   /api/users/me           (auth)
PATCH /api/users/me           (auth)
PATCH /api/users/me/password  (auth)
```

### Authorization

JWT-based. The token payload carries `id`, `role`, `institution_id`, and `status`.

- `protect` — requires an `Authorization: Bearer <token>` header.
- `allowRoles(...roles)` — restricts a route by `req.user.role` (e.g. `admin`).

### Folder layout

```
backend/
├── server.js              App config, middleware, route mounting
├── config/                db.js (pg Pool), cloudinary.js
├── controllers/           Request handlers + DB logic (with *.test.js unit tests)
├── middleware/            authMiddleware.js (JWT/roles), multer.js (uploads)
├── routes/                One Express router per resource
├── services/              payfastService.js (signature build/verify, payment fields)
└── db/migrations/         SQL migrations (run manually, in order)
```

### Database (PostgreSQL)

Core tables referenced by the code: `users`, `institutions`, `products`,
`product_images`. The migrations in `db/migrations/` add the collection/commerce model:

- **`carts` / `cart_items`** — one active cart per user; items are single-quantity reservations.
- **`collection_orders` / `collection_order_items`** — confirmed collection records with
  human-readable references (`ORD-YYYY-NNNNNN`, item refs `ITEM-YYYY-NNNNNN`), subtotal,
  service fee, total, and collection status.
- **`payments`** — payment records per order (provider, status, amount, `ZAR` currency,
  raw webhook payload) updated by gateway callbacks.
- Enum types for cart status, order/item status, product status (`Reserved`, `Claimed`,
  `Cancelled`), and payment status, plus `updated_at` triggers.

> Apply migrations against the existing base schema, in filename order:
> `001_collection_cart_and_reference_numbers.sql`, then
> `002_payments_and_collection_statuses.sql`.

### Domain flow

1. An admin lists thrift / lost-and-found items (photos → Cloudinary; descriptions can be
   AI-generated from the images via OpenAI).
2. A user browses, adds items to their collection cart, and checks out.
3. Checkout creates a `collection_order` and a PayFast payment; the user pays in ZAR.
4. PayFast notifies the backend (ITN), which verifies the signature and marks the order paid.
5. The user receives an order/item reference; the admin verifies it and marks the order
   **collected** at the institution.

---

## Frontend (`/frontend`) — Customer app

A feature-sliced Vite + React SPA. Routes are guarded by a `ProtectedRoute` wrapper.

**Routes:** `/` and `/auth` (auth) · `/products` · `/products/:id` · `/cart` ·
`/checkout` · `/thrift-store` · `/lost-found` · `/wishlist` · `/sell` · `/settings`.

**Feature folders:** `auth`, `products`, `home`, `thriftStore`, `lostItems`, `cart`,
`checkout`, `wishlist`, `sell`, `institutions`, `settings`.

State is split between **TanStack Query** (server data) and **Zustand** (local UI/stores).

---

## Admin (`/admin`) — Administrator app

A separate Vite + React SPA for institution staff.

**Routes:** `/` (auth) · `/admin` (dashboard) ·
`/admin/lost-and-found-management` (+ `/add-items`) ·
`/admin/register-users` with `staff` / `school` / `parent` / `university` / `student`
sub-pages · `/admin/orders` (orders & collections) · `*` (not-found).

**Feature folders:** `auth`, `registerUsers`, `ItemManagement`, `orders`, `product`,
`institutions`, plus shared `components`.

---

## Getting started

### Prerequisites

- Node.js (with npm)
- A PostgreSQL database
- Cloudinary, OpenAI, and PayFast (sandbox) credentials

### 1. Install dependencies (each app separately)

```bash
cd backend  && npm install
cd ../frontend && npm install
cd ../admin && npm install
```

### 2. Configure the backend environment

Create `backend/.env`:

```dotenv
PORT=5000
DATABASE_URL=postgres://user:password@localhost:5432/thriftstore
JWT_SECRET=replace-with-a-long-random-string

# Cloudinary (image hosting)
CLOUDINARY_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_SECRET_KEY=your-api-secret

# OpenAI (product image analysis)
OPENAI_API_KEY=sk-...

# PayFast (payments)
PAYFAST_MODE=sandbox            # or "live"
PAYFAST_MERCHANT_ID=...
PAYFAST_MERCHANT_KEY=...
PAYFAST_PASSPHRASE=...           # optional
PAYFAST_NOTIFY_URL=             # optional override for the ITN callback
API_PUBLIC_URL=                 # optional, public base URL for callbacks
FRONTEND_URL=http://localhost:5173
```

> Exact variable names come from the code (`config/`, `services/payfastService.js`).
> There is no committed `.env.example`; `.env` is git-ignored.

### 3. Apply database migrations

Run the SQL files in `backend/db/migrations/` (in order) against your database using `psql`
or your preferred client, after creating the base `users`/`institutions`/`products`/
`product_images` schema.

### 4. Run the apps

```bash
# Backend API  → http://localhost:5000
cd backend && npm run dev      # nodemon (or: npm start)

# Customer app → http://localhost:5173
cd frontend && npm run dev

# Admin app    → http://localhost:5174
cd admin && npm run dev
```

### Useful scripts

| App      | `dev` | `build` | `lint` | `test` |
|----------|-------|---------|--------|--------|
| backend  | `nodemon server.js` | — | — | `node --test` |
| frontend | `vite` | `vite build` | `eslint .` | — |
| admin    | `vite` | `vite build` | `eslint .` | — |

Run backend tests with `cd backend && npm test` (covers cart, checkout, user, and PayFast
service logic).

---

## Notes & considerations

- **No root orchestration** — install/run each app on its own; there is no workspace or
  combined script.
- **Hard-coded API URL** — both clients point at `http://localhost:5000/api`; move this to
  an environment variable before deploying.
- **Migrations are manual** — there is no migration runner; apply the SQL files in order.
- `.gitignore` covers `.idea/`, `.vscode`, `.env`, and `AGENTS.md` but **not**
  `node_modules/`, so take care not to commit dependencies.

---

*This README was generated from an analysis of the codebase. A more detailed scan is
available in [`PROJECT_ANALYSIS.txt`](PROJECT_ANALYSIS.txt) (note: some of its findings
predate the cart/checkout/payments features documented above).*
