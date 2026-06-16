# PROJECT_STATE.md — Restart Checkpoint

_Last updated: 2026-06-16. This is a handoff/restart document. For day-to-day
conventions see `CLAUDE.md`._

---

## 1. Project goal

A **school thrift-store & lost-and-found collection platform**. Parents/students
buy second-hand or lost-and-found items from the school/university they are
registered to, pay online (**ZAR via PayFast**), receive a **reference number**,
and present it at the school to collect the physical item.

Four independently-run apps (no root `package.json`):

| Folder         | App                              | Stack                       | Dev URL                |
|----------------|----------------------------------|-----------------------------|------------------------|
| `backend/`     | REST API                         | Node, Express 5 (ESM), pg   | http://localhost:5000  |
| `frontend/`    | Customer app (parents/students)  | React 19 + Vite             | http://localhost:5173  |
| `admin/`       | Platform admin app               | React 19 + Vite             | http://localhost:5174  |
| `school-admin/`| School staff app (collections)   | React 19 + Vite             | http://localhost:5175  |

---

## 2. Current state (what is done)

**Customer (`frontend/`):** browse products (filter by listing type/condition,
sort, client-side pagination), add to cart (server cart), checkout → PayFast →
reference number, "My Orders" (status filter + pagination + product images +
"Continue to payment" for pending orders), inline auth messaging.

**Admin (`admin/`) — broad and functional:**
- Dashboard: KPI cards (users by role, logins, public registrations, revenue),
  **recharts** graphs (activity line, revenue bar, users donut, orders bar),
  live **activity-log feed**.
- Registration approval (approve/reject + email).
- Registered Users: hub + per-role lists with **suspend/reactivate, edit
  (modal + reset password), delete** (server-side pagination + debounced search).
- Inventory: list/edit/delete (server-side pagination + search).
- Item Management hub, Add Items (AI auto-fill), View Store preview.
- Orders & Collections: verify reference, mark collected, **cancel, refund**
  (server-side pagination + search).
- Reports: CSV export (orders / users / inventory).
- Account: profile edit, change password, platform info.

**School Admin (`school-admin/`):** staff log in scoped to their own institution,
see ready-for-collection orders, verify an order (`ORD-…`) or item (`ITEM-…`)
reference, mark collected.

**Backend:** auth (JWT), institution-scoped data, registration approval,
products CRUD, cart/checkout, PayFast ITN (real, signature-verified), payment
lifecycle (expiry/cancel/release), activity log, admin stats/logs/users +
user/order lifecycle endpoints, school collection endpoints, buyer email on
payment. Hardening: `helmet`, CORS allowlist, login rate-limiting.

**Security/hardening done:** `express-rate-limit` on login (10 failed/15min/IP),
axios **401 interceptor** (auto-logout) in all 3 React apps, `helmet`, CORS
allowlist (`CORS_ORIGINS`).

**Deploy-readiness:** all 3 React apps read `import.meta.env.VITE_API_URL`
(localhost fallback) — each has a `.env.example`.

---

## 3. Last thing worked on (exact stop point)

Finished a **"make the admin proper" series** in three tiers, then buyer emails +
toasts. The very last actions:
- Added `emailService.sendCollectionReadyEmail`, called from `markOrderPaid` —
  buyer gets a "ready to collect" email on payment (verified by console log;
  graceful when SMTP unset).
- Replaced all 15 `alert()` calls in admin with **react-toastify** toasts
  (`ToastContainer` wired in `admin/src/main.jsx`).
- Fixed a `set-state-in-effect` lint error in the user's new dropdown Sidebar
  and an unused `Link` import in `admin/src/features/components/LoginForm.jsx`.

**Pending action when work stopped:** the user asked to **commit + push this
batch** (tiers 1–3 + buyer email + toasts — all uncommitted since the last push
`2e43bb4`), then asked for this checkpoint document.

---

## 4. Files involved (most important)

**Backend**
- `backend/server.js` — app entry; mounts routers; `helmet` + CORS allowlist.
- `backend/controllers/paymentController.js` — PayFast ITN, `markOrderPaid`
  (+ buyer email), release/expiry, idempotency guard.
- `backend/controllers/checkoutController.js` — checkout create/cancel/resume,
  PayFast form build, payment methods.
- `backend/controllers/adminController.js` — `/admin/stats`, `/logs`, `/users`,
  user lifecycle (update/suspend/reset-password/delete), pagination.
- `backend/controllers/adminOrderController.js` — admin orders list (paginated),
  mark collected, **cancel/refund**.
- `backend/controllers/productController.js` — products CRUD, admin list
  (paginated), customer list (Available-only).
- `backend/controllers/registrationController.js` — approve/reject.
- `backend/controllers/schoolController.js` — institution-scoped collections.
- `backend/services/activityLog.js` — `logActivity` (guarded, fire-and-forget).
- `backend/services/emailService.js` — nodemailer, graceful; approval/rejection/
  collection-ready emails.
- `backend/services/payfastService.js` — signature build/verify (blank-field rule).
- `backend/middleware/rateLimit.js` — login limiter.
- `backend/db/migrations/` — `001`–`005`, applied manually in order.

**Admin (`admin/src/`)**
- `pages/AdminHome.jsx` — dashboard (KPIs + recharts + activity feed).
- `features/dashboard/`, `features/registeredUsers/`, `features/reports/`,
  `features/account/`, `features/inventory/`, `features/orders/`,
  `features/registrations/` — each `{api,hooks,pages}`.
- `lib/axios.js` — base URL (env) + 401 interceptor.
- `lib/useDebouncedValue.js`, `components/shared/Pagination.jsx` — shared.
- `components/shared/Sidebar.jsx` — grouped dropdown nav (user-authored).

**Customer/School:** mirror structure; `*/src/lib/axios.js` each have the env
base URL + 401 interceptor.

---

## 5. Decisions already made

- **Stack:** React 19 + Vite, **TanStack Query** (server state), **Zustand**
  (client/auth state, token mirrored to localStorage), **Tailwind v4**, axios,
  **recharts** (admin charts), **react-toastify** (admin notifications).
  Backend: Express 5 ESM, `pg`, JWT, bcrypt, nodemailer, cloudinary, OpenAI,
  helmet, express-rate-limit.
- **Feature-folder layout:** `src/features/<feature>/{api,hooks,pages,components,store}`.
- **Auth:** JWT `{ id, role, institution_id, status }`; roles `admin`, `student`,
  `parent`, `school`, `university`. Data scoped by `institution_id` (admins have
  `null`). Non-`approved` status blocks login (403).
- **Pagination:** admin list endpoints take `limit/offset/q`, return
  `{ items, total }`; **no `limit` = return all** (so Reports/View-Store still
  get everything). Frontend uses a shared `Pagination` + debounced search.
- **Payments:** stay on PayFast. Refund is **record-only** (marks refunded +
  releases items); actual money refund is done manually in the PayFast dashboard.
- **Emails:** graceful — send via SMTP when configured, otherwise log to console.
- **Errors:** inline messages or toasts, **never `alert()`** (admin now complies).
- **Git:** branch `payments-collection-flow` on `github.com/delon500/Thrift-store`
  (this user is a collaborator). Commits end with the Co-Authored-By line.

---

## 6. Known bugs / blockers / unfinished

- **~17 pre-existing lint errors** in admin in files NOT touched this session
  (unused `React` imports in old `features/registerUsers/pages/*` and a few
  components). Build still passes. Candidate for a separate lint-clean pass.
- **Buyer/approval emails only log** until SMTP is configured in `backend/.env`
  (`SMTP_HOST/PORT/USER/PASS`, `EMAIL_FROM`).
- **PayFast refund** does not move money (record-only — see Decisions).
- **Not built:** institution management (edit/deactivate), per-school
  fees/pricing (service fee hardcoded **R1.50** in cart), super-admin vs
  institution-admin roles, automated tests for the new backend surface.
- **Backend dev server** was started by Claude in the background (the user's
  `npm run dev` had been closed). If you start your own, stop that one first to
  avoid a port-5000 clash.

---

## 7. Next tasks (in order)

1. **Commit + push the current batch** (tiers 1–3 + buyer email + toasts) — the
   pending action. Suggested logical commits: hardening / lifecycle /
   pagination+env / emails+toasts.
2. Optional lint-clean pass for the ~17 pre-existing admin errors.
3. Configure SMTP in `backend/.env` to turn on real emails.
4. Remaining "proper" gaps (pick as desired): institution management,
   fees/pricing, automated tests, role granularity, mobile sidebar polish.

---

## 8. Constraints (do NOT change)

- **PayFast ITN signature must include blank fields when verifying** (PayFast
  signs every posted field); outgoing requests omit them. See `payfastService.js`.
- **DB migrations are manual**, applied in filename order. Do not add a runner
  without asking. Migrations `001`–`005` are already applied to the dev DB.
- **Do NOT re-add** the unique index on
  `collection_order_items.product_reference_number` (migration `003` dropped it
  on purpose — it blocked re-ordering a product after a cancelled order).
- **Enum values must match exactly** (`product_status`, `listing_type`,
  `collection_order_status`, `approval_status` incl. `suspended`,
  `product_gender` = Male/Female/Unisex).
- **Never commit** `.env`, `node_modules/`, or `dist/` (`node_modules` is now in
  `.gitignore`). Push to the `payments-collection-flow` branch, **not `main`**.
- `backend/.env` changes need a full backend restart (nodemon watches `.js`).
- Keep the API base URL env-driven (`VITE_API_URL`) — do not hardcode localhost.
