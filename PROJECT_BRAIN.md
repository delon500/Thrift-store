# PROJECT_BRAIN.md

> Single-file source of truth. A fresh session should be able to reconstruct the
> whole project from this file alone. Auto-updated when a task completes (hook in
> `.claude/settings.local.json`). Conventions live in `CLAUDE.md`. Keep this
> current — edit in place, don't append history.
>
> _Last updated: 2026-06-17_

## 1. What & why
A **school thrift-store & lost-and-found collection platform**. Parents/students
buy second-hand or lost-and-found items from the school/university they're
registered to, pay online (**ZAR via PayFast**), get a **reference number**, and
present it at the school to collect the physical item. Goal: give institutions a
simple resale/lost-and-found channel with online payment + in-person collection.

## 2. Architecture & stack
Four independently-run apps (no root `package.json` — install/run each separately):

| Folder | App | Stack | Port |
|---|---|---|---|
| `backend/` | REST API | Node, Express 5 (ESM), `pg` | 5000 |
| `frontend/` | Customer app | React 19 + Vite | 5173 |
| `admin/` | Platform admin | React 19 + Vite | 5174 |
| `school-admin/` | School staff (collections) | React 19 + Vite | 5175 |

- **Frontend libs:** TanStack Query (server state), Zustand (auth/client state, token
  mirrored to localStorage), Tailwind v4, axios (`src/lib/axios.js`, base URL from
  `VITE_API_URL`, 401-interceptor auto-logout), recharts (admin charts),
  react-toastify (admin notifications). Feature-folder layout
  `src/features/<f>/{api,hooks,pages,components,store}`; central `src/app/router.jsx`.
- **Backend:** Express 5 ESM. `controllers/` (handlers + SQL, `*.test.js` beside them),
  `routes/` (one router per resource, mounted in `server.js`), `middleware/`
  (`authMiddleware` = `protect` + `allowRoles`, `multer`, `rateLimit`), `services/`
  (`payfastService`, `emailService`, `activityLog`), `lib/adminRules.js` (pure
  decision logic), `db/migrations/` (manual, in order) + `db/schema.sql` (full dump).
  Helmet + CORS allowlist (`CORS_ORIGINS`). Integrations: PostgreSQL, Cloudinary
  (images), OpenAI (Add-Items auto-fill), PayFast (payments), nodemailer (email).
- **Repo:** branch `payments-collection-flow` on `github.com/delon500/Thrift-store`
  (user is a collaborator). Local dev DB `thriftstore`; tests use `thriftstore_test`.

## 3. Domain model & key flows
- **Roles** (`user_role`): student, parent, school, university, admin, **super_admin**.
  JWT `{ id, role, institution_id, status }`. Most data scoped by `institution_id`
  (admins/super_admins have `null`). Non-`approved` status blocks login (403); a
  `suspended`/`rejected` **institution** also blocks its users.
- **Registration → approval:** public sign-ups are `pending` → admin approves/rejects
  in the admin app (email via emailService, graceful). `approval_status` =
  pending | approved | rejected | suspended.
- **Buy → collect:** products (per institution, permanent ref `ITEM-2026-000123`) →
  checkout creates `collection_orders` (`ORD-2026-000123`) + items + a PayFast
  payment. Verified PayFast **ITN** → order `ready_for_collection`, products
  `Reserved`, buyer emailed. School staff verify the reference and mark `collected`
  → products `Claimed`. Abandoned checkouts expire/release after 30 min.
- **Admin tiers:** `admin` = day-to-day (dashboard, approvals, inventory, collections,
  reports, view users/institutions). `super_admin` = everything, incl. user
  edit/suspend/delete, order **refund**, and all account creation (register staff/
  school/parent/student). Enforced by `allowRoles` on routes + `useMe().role` in UI.
- **Key enums (must match exactly):** `product_status` = Available/Sold/Pending/
  Reserved/Claimed/Cancelled · `listing_type` = "Thrift Store"/"Lost and Found" ·
  `collection_order_status` incl. payment_pending/ready_for_collection/collected/
  cancelled/expired/payment_failed · `payment_status` = pending/paid/failed/cancelled/
  refunded · `product_gender` = Male/Female/Unisex.

## 4. Key decisions (don't reverse unknowingly)
- Stay on **PayFast**; refunds are **record-only** (mark refunded + release items;
  actual money refund done manually in the PayFast dashboard).
- **Dropped** the unique index on `collection_order_items.product_reference_number`
  (migration 003) — it blocked re-ordering a product after a cancelled order.
- **PayFast ITN signature must include blank fields** when verifying (PayFast signs
  every posted field); outgoing requests omit them (`payfastService` skipEmpty).
- DB **migrations are manual**, applied in filename order (001–007). `db/schema.sql`
  is the canonical full schema (pg_dump via `C:\Program Files\PostgreSQL\18\bin\pg_dump.exe`)
  used by integration tests — re-dump it after any migration. Integration files run
  **serially** (`--test-concurrency=1`) since they share one test DB.
- Server-side pagination endpoints return `{ items, total }`; **no `limit` = all**
  (so reports/exports/View-Store still get everything).
- Admin business rules extracted to pure `lib/adminRules.js` and unit-tested.
- Emails are graceful (send if SMTP configured, else log).

## 5. Completed work
- **Payments lifecycle:** real PayFast ITN (+ signature fix), expiry/cancel/release,
  resume-payment, My-Orders (filter/pagination/images/continue-to-pay).
- **Customer storefront:** product filters + sort + pagination, card add-to-cart
  (server cart), Available-only listing, inline auth messaging.
- **Admin app (broad):** registration approval (+email), inventory CRUD, Item-Mgmt hub
  + Add Items (AI) + View Store, Orders & Collections (verify/collect/cancel/refund),
  analytics **Dashboard** (KPIs + recharts + activity-log feed), **Registered Users**
  (list + lifecycle: suspend/edit/reset-pw/delete), **Reports** (CSV), **Account**
  (profile/password/platform), **Institutions** (list/edit/suspend/delete + counts).
  Toasts replace all `alert()`s. Real logged-in admin in navbar.
- **School Admin app:** scoped login, ready-for-collection list, verify ORD-/ITEM-
  reference, mark collected.
- **Hardening:** login rate-limit, 401 interceptors (all 3 apps), helmet + CORS
  allowlist, env-based API URL (`VITE_API_URL` + `.env.example` each app).
- **Roles:** super_admin/admin tiers (migration 006) + route auth + UI gating.
- **Institution management** + login enforcement for suspended/rejected institutions.
- **Tests:** pure unit tests (`npm test`, 20 incl. adminRules) + **integration layer**
  (`npm run test:integration`, throwaway `thriftstore_test` DB, 4 order tests).
- **Docs/skills:** `CLAUDE.md`, `PROJECT_STATE.md`; a separate PPMS skill at
  `~/.claude/skills/persistent-project-memory-system/`.

## 6. Active work / status
**ACTIVE: Customer UI/UX redesign on branch `frontend-redesign`** (off
`payments-collection-flow`). Direction = **modern secondhand-marketplace** (warm canvas
`#faf8f3`, emerald primary `#0f7a52`, coral accent `#e8590c`; `--mk-*` vars in `index.css`
+ the core `@theme` color tokens remapped to this palette app-wide). Using **lucide-react**
for icons (installed) — moving off the PNG `assets/icon/icons.js` (user OK'd deleting them in
the final cleanup step). User reviews each step before the next. **Step plan:**
1 ✅ Foundations + app shell — palette app-wide, lucide, redesigned Navbar (full-width top
bar, logo, search, cart/wishlist/bell/account), Sidebar (clean rail), mobile drawer,
PublicLayout (canvas), real Footer (was a stub), `MarketProductCard` + catalog (`/products`).
2 ✅ Product detail page (gallery + thumbnails, sticky buy box, lucide spec rows,
formatted price, image fallback, wishlist, related via `MarketProductCard`). 3 ✅ Cart +
Checkout (rich empty states, sticky summary, `CartItems` row redesign, confirm-on-clear,
restyled PayFast method radios + return/confirm states; shared `lib/money.js` `formatPrice`).
4 ✅ My Orders (cards link to detail) + **NEW** order/collection detail page
`/orders/:orderReference` ([OrderDetail], route added) — vertical **status stepper**
(placed→paid→ready→collected, with failed/cancelled), **QR code** of the reference
(`qrcode.react`), items, totals, resume-payment. Added `useMyOrder` (polls while pending) +
shared `orders/lib/submitToPayfast.js`. 5 ✅ Auth pages — split-screen `AuthPage` (emerald brand panel + value props, login/register
tabs), restyled `LoginForm`/`RegisterForm`/`RoleCard`/`Input` (clean lucide inputs, sentence
case, fixed duplicate `name` props + removed a stray console.log). **DECISION:** staff/admin
stay **invite-only** (super_admin creates them via `registerAdmin`) — public self-registration
is only parent/student/school/university (privilege-escalation risk otherwise). 6 ⬜ New
pages ("How collection
works", restyle Wishlist). 7 ⬜ Cleanup (delete PNG assets + old `ProductCard`, finish token
migration, a11y/QA). NB other pages still use the old `--color-*`-named tokens (now holding
new values) + raw teal in spots — they look recolored but not yet re-laid-out until migrated.


**Just done: Customer frontend "professionalism" pass (committed).** Branded 404
([NotFoundPage] real page + CTA, doubles as router errorElement), working **mobile nav**
(filled the empty drawer in `Navbar` + shared `components/shared/navItems.js` now powering
both Sidebar and the drawer; hamburger `md:hidden`), tab `<title>`=School Thrift + meta +
`public/favicon.svg`, and **react-toastify** mounted in `main.jsx` (replaced all 11
`alert()` calls with toasts). Then **robustness pass (committed):** fixed the Product deep-link/refresh **blank screen**
([Product.jsx] now consumes `useGetProducts()` directly with loading skeleton / not-found /
error+retry states instead of reading the Zustand store and returning `null`); added
`components/shared/Skeleton.jsx` + skeleton grid + error/retry on HomePage. NB there is
**no backend `GET /products/:id`** — customer product views still rely on the full-list
query (cached, shared via React Query); a per-product endpoint is a future optimization.
Then **a11y + design-consistency pass (committed):** global `:focus-visible` ring in
`index.css` (uses `--color-primary`); alt/aria sweep (decorative icons → `alt=""`,
state-aware `aria-label`/`aria-pressed` on the wishlist toggle, `aria-label` on the sort
select + search Input + notification bell with unread count); unified the two notification
components I'd built with raw `teal/gray` to the **M3 theme tokens** (`primary`,
`on-surface`, `outline`, `surface-container-low`, `error`…) so they match the rest of the
customer app — kept the semantic status-dot colors. NB tokens confirmed against
`@theme` names; **not yet visually QA'd** in a browser (low-risk swaps, build passes).
Then **perf/SEO pass (committed) — all 4 frontend batches now done.** Route-level
code-splitting: `app/router.jsx` lazy-loads every routed page (`React.lazy`), with a
`Suspense` + `components/shared/PageLoader` fallback around `<Outlet/>` in PublicLayout;
**main JS bundle 473kB → 354kB** (gzip 121kB), per-page chunks load on demand, >500kB
warning gone. Per-page `<title>` via a tiny `lib/useDocumentTitle` hook applied to ~9 pages
(Product uses the item name). `loading="lazy"` on grid/related product images. NB
`router.jsx` has an `eslint-disable react-refresh/only-export-components` header (it's route
config, not a component module). Lint clean + build passes.

Then **bugs & nav-chrome pass (committed):** fixed the **dead "Forgot Password?" link**
(LoginForm linked to non-existent `/forgot-password`) → now an inline note "contact your
school admin" (fits the admin-managed model); made the non-functional profile icon a real
**account dropdown** (`components/shared/AccountMenu.jsx` — name/email + Settings + Logout,
outside-click close); added **cart + wishlist count badges** to the Navbar (new cart icon →
`/cart`, count from shared `["cart"]` query so it updates live; wishlist count from the
store). Lint clean + build passes. **Not visually QA'd in a browser.** Remaining recommended
frontend work (offered): collection UX (order stepper + QR of the reference), commerce polish
(one `formatCurrency` helper, broken-image fallback, rich empty states), robustness
(ErrorBoundary, confirm destructive actions, persist wishlist server-side), scale
(server-side product search/pagination + `GET /products/:id`), frontend tests (Vitest+RTL).

**Prior feature: Admin Settings — DONE (backend + admin frontend), committed.**
Makes 3 previously-hardcoded values configurable platform-wide from the admin app:
service fee (was R1.50 in cartController), checkout expiry minutes (was 30 in
checkoutController), and the enabled subset of the 9 PayFast payment methods. Backend:
migration `009` (`app_settings` key→jsonb table, seeded with current defaults);
`services/settingsService.js` — `PAYMENT_METHOD_CATALOG` (moved here as the single source),
`SETTINGS_DEFAULTS`, cached read-through `getSettings()` (60s TTL + `invalidateSettingsCache`
on write) + `getServiceFee/getCheckoutExpiryMinutes/getEnabledPaymentMethods`;
`lib/settingsRules.js` pure validation (+ unit tests); `controllers/adminSettingsController.js`
(GET settings+catalog, PUT super-admin only); routes mounted `/api/admin/settings` (GET
admin+super, PUT super). **Consumption:** `calculateCartSummary(items, serviceFee)` and
`serializeCart({…serviceFee})` now take the fee (default 1.5 keeps pure-fn unit tests green);
cart + checkout controllers pass `await getServiceFee()`; checkout uses
`await getCheckoutExpiryMinutes()` and rejects a disabled method. `getPaymentMethod`/
`normalizePaymentMethod` stay **sync** (catalog lookup — unit tests use `assert.throws`);
`getPaymentMethods` (GET) returns only enabled. **Customer app needs NO changes** — it
already pulls payment methods + the fee-bearing summary from the backend. Admin frontend:
`admin/src/features/settings/{api,hooks,pages}` `SettingsPage` (`/admin/settings`, super-admin
sidebar link; read-only for plain admin). Verified live end-to-end (fee 1.5→7.5 reflected in a
cart immediately; methods filtered; disabled/unknown method rejected at checkout) then
**restored to defaults**; **27 unit + 14 integration tests pass**; admin lint clean + builds.

**Prior feature: Notification Center — DONE for BOTH customer + admin, committed (`b53fd8e`).**
The `notifications` table is per-user and admins ARE users, so the **same
`/api/notifications` endpoints serve both apps** — no per-app routes. Admin side adds
`notificationService.notifyAdmins(...)` which fans an operational alert out to every
`admin`/`super_admin` (one row each via `INSERT … SELECT`, so per-admin read state).
Wired into 2 admin events: new pending sign-up (`registerStudentParent` +
`registerInstitution`)→`registration_pending` (link `/admin/registrations`), and
`markOrderPaymentFailed`→`payment_failed` (link `/admin/payments`). Admin frontend mirrors
the customer one in `admin/src/features/notifications/{api,hooks,components,pages,lib}`;
`NotificationBell` replaced the dead static `notification_icon` in the admin `Navbar`;
route `/admin/notifications`. Verified live (register pending user → both admins notified,
2 rows) + integration test for the fan-out (now **11 passing**). Admin lint clean + build.

**Customer side (also DONE):**
In-app notifications for parents/students — a bell + unread badge in the customer app, the
in-app counterpart to the transactional emails. Backend: migration `008` (`notifications`
table: user_id FK→users ON DELETE CASCADE, type, title, body, entity_type, entity_ref,
link, read_at, created_at; indexes on (user_id,created_at) and partial unread);
`services/notificationService.js` `createNotification(...)` (guarded fire-and-forget like
logActivity); `controllers/notificationController.js` (list `?unread=&limit=&offset=` →
`{notifications,total,unread}`, unread-count, mark `:id/read`, `read-all`);
`routes/notificationRoute.js` mounted `/api/notifications` (all `protect`, scoped to
`req.user.id`). Wired `createNotification` into 3 buyer events: `markOrderPaid`→order_ready,
`markOrderPaymentFailed`→payment_failed (added `user_id` to its SELECT),
`approveRegistration`→registration_approved. **Reject deliberately has NO notification**
(rejected users can't log in, so they'd never see it). Frontend (customer app):
`features/notifications/{api,hooks,components,pages,lib}` — `NotificationBell` (bell + badge
+ dropdown, outside-click close, click marks read + navigates), `NotificationsPage`
(`/notifications`), `useUnreadCount` polls every 30s. Bell added to `Navbar` (only when
logged in). Links point at real routes (`/orders`, `/products`). **No ToastContainer in the
customer app — don't add toast there.** Verified live end-to-end (recover→order_ready
notification, mark-read, user isolation) + **3 integration tests** (now **10 passing**);
admin/frontend lint clean + builds pass. Throwaway test data cleaned up.

**Prior feature: Payment Management (admin) — DONE, committed.** Backend `02488be`
(migration `007` payment failure/refund metadata; `/api/admin/payments` list+summary,
detail incl. raw payload, super-admin recover). Frontend `3176fbf`
(`admin/src/features/payments/{api,hooks,pages}`, `/admin/payments` route + sidebar link,
detail modal with raw payload + super-admin "Mark paid (recover)" gated by
`useMe().role === "super_admin"`, Payments CSV on Reports). Live smoke-tested + role gate
verified.

Earlier (also uncommitted): PayFast ITN tunnel fix + customer checkout status polling
(`useOrderStatus`); recovered the user's genuinely-paid `ORD-2026-000041` (ITN lost to
a dead tunnel).

## 7. Known issues / blockers / debt
- The service fee is now a **global** configurable setting (Admin Settings), default R1.50.
  **Per-school** fees/pricing is still not built (would need per-institution settings).
- ~17 **pre-existing lint errors** in untouched admin files (unused `React` imports).
- Mobile polish: fixed-width (`w-[15%]`) admin sidebar.
- **SMTP is LIVE** (Gmail). `.env`: SMTP_HOST=smtp.gmail.com, **PORT=465** (587 is
  **blocked on this network** — `Greeting never received`; 465/SSL works), USER/FROM=
  izyizy4good@gmail.com, SMTP_PASS=16-char App Password. Verified end-to-end
  (`npm run mail:test` + real approval/collection-ready templates sent to a `+alias`).
  `emailService` has `verifyEmailTransport()`; test script `scripts/send-test-email.js`.
  Note: nodemon doesn't watch `.env`, so **restart the backend after changing SMTP_*** (the
  transporter is cached per process).
- **Dev-data note:** a test parent user was accidentally hard-deleted during role
  testing (dev DB 2→1 parents); ORD-2026-000002 was wrongly cancelled then reverted.
- The backend dev server is currently run via a Claude-started background process
  (the user's `npm run dev` had closed) — stop it before starting your own (port 5000).
- **PayFast (local dev) — recurring:** the ITN needs a public URL; a **cloudflared
  tunnel** proxies PayFast→localhost:5000 and `PAYFAST_NOTIFY_URL` must point at the
  *current* tunnel + `/api/payments/payfast/itn`. `trycloudflare` quick-tunnels are
  EPHEMERAL and **keep dying on this machine** (DNS i/o timeouts). When payments stick
  on "awaiting payment": (1) `cloudflared tunnel --url http://localhost:5000`, grab the
  new `*.trycloudflare.com` URL, (2) `sed -i` it into `PAYFAST_NOTIFY_URL` in
  `backend/.env`, (3) restart the backend (touch a `.js` so nodemon respawns + re-reads
  `.env`). To recover a genuinely-paid order whose ITN was lost: call
  `markOrderPaid({ orderReference })` (idempotent). PayFast sandbox also **refuses to
  let the merchant pay themselves** — buyer email == merchant email (`izyizy4good@gmail.com`)
  → test with a NON-merchant email. (A super-admin "recover" button is part of the
  Payment Management plan to make this a one-click UI action.)
- **Uncommitted (local only, branch tip is `02488be`):** payment-ITN guard +
  checkout-status polling (`frontend` `Checkout.jsx`, `useOrderStatus`, `getMyOrder`),
  `PROJECT_BRAIN.md`, the `CLAUDE.md` project-memory note, and the `TaskCompleted` hook
  in `.claude/settings.local.json` (personal, gitignored).

## 8. Next actions — Admin Settings DONE; commit
Backend + admin frontend built and verified (live e2e fee/method change + restore;
27 unit + 14 integration tests; lint clean + builds). **Remaining: commit it** (branch
`payments-collection-flow`). Apply migrations `008` + `009` to any other env; schema.sql
re-dumped (12 tables).

Settings endpoints: `GET /api/admin/settings` → `{settings, payment_method_catalog}`
(admin+super); `PUT /api/admin/settings` (super only) — keys `service_fee`,
`checkout_expiry_minutes`, `enabled_payment_methods`. Reads go through cached
`settingsService.getSettings()` (defaults fallback). Notification types so far: customer
`order_ready`/`payment_failed`/`registration_approved`; admin `registration_pending`/
`payment_failed`.

**PR flow:** work ships from `payments-collection-flow` → `main` via PRs the **user merges**
(no `gh`/token in env; PRs are created via the GitHub API using the git-credential `gho_`
token — write `.git/PR_BODY.md`, POST to `/repos/delon500/Thrift-store/pulls`). Merged so
far: **#6** (payments/notifications/admin-settings), **#7** (SMTP). **#8 OPEN** = customer
frontend professionalism pass (4 commits). After a merge, local `main` is stale — diff PRs
against `origin/main`, not local `main`.

**Deferred / candidate next features:** per-**institution** settings (current Admin Settings
is global); a **school-staff** notifications surface (school-admin app — reuse the
notifications table + an institution-scoped fan-out); lint-clean ~17 pre-existing admin
errors.

## 9. Conventions & constraints (do NOT break)
- Don't re-add the dropped `collection_order_items` unique index (decision above).
- Keep ITN signature blank-field handling intact.
- Apply migrations 001–009 in order; never auto-commit `.env`, `node_modules/`,
  `dist/`. Push to `payments-collection-flow`, not `main`. Commits end with the
  Co-Authored-By trailer.
- Errors inline / via toast, never `alert()`. **All 3 apps now mount react-toastify**
  (customer `ToastContainer` is in `main.jsx`, bottom-right). Keep API base URL env-driven.
- `backend/.env` changes need a full backend restart (nodemon watches `.js`).

## 10. Run & test
```bash
cd backend && npm install && npm run dev          # API :5000 (nodemon)
cd frontend && npm install && npm run dev          # :5173
cd admin && npm install && npm run dev             # :5174
cd school-admin && npm install && npm run dev      # :5175
cd backend && npm test                             # unit (no DB)
cd backend && npm run test:integration             # integration (throwaway test DB)
```
Copy `backend/.env.example` → `backend/.env` and fill it in. Each React app has its
own `.env.example` (`VITE_API_URL`).
