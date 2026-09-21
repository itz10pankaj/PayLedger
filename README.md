# PayLedger

Backend payment gateway and ledger system. See [`PayLedger — Technical Design Document.md`](./PayLedger%20%E2%80%94%20Technical%20Design%20Document.md) for the full design.

## Structure

```
PayLedger/
├── frontend/   React + TypeScript (Vite)
├── gateway/    Node.js + Express — owns auth + user data, load balancing later
└── backend/    Node.js + Express — accounts, ledger, payments today; webhooks/reconciliation next
```

Request path: **frontend → gateway → backend**. The frontend never calls the backend directly. **The gateway owns everything user-related** (the `users` table, create/update/verify) as well as auth — backend has nothing user-related in it; it only ever receives an already-identified request.

**Auth flow (gateway):** `POST /auth/login` (phone + password) → gateway checks the password itself against its own `users` table → on success, generates a 6-digit OTP and stores it in Redis (10 min TTL) → `POST /auth/verify-otp` (phone + otp) → on match, gateway issues an opaque session token and stores it in Redis (1h TTL). Every later request carries that token as `Authorization: Bearer <token>`; the `authenticate` middleware looks it up in Redis and attaches the user to `req.user`, which the proxy forwards to the backend as `X-User-Id` / `X-User-Phone` / `X-User-Email` / `X-User-Role` headers — the backend trusts the gateway's check instead of re-verifying (via `common/middlewares/identifyUser.ts`).

Signup is the same OTP pattern, but the account isn't created in Postgres until the phone OTP is verified — see `gateway/src/modules/user`.

Round-robin load balancing across multiple backend instances plugs into `gateway/src/common/proxy/backendTargetPicker.ts` later — add more comma-separated `BACKEND_TARGETS` and it starts fanning out with no code change.

## Backend & gateway: module layout

Both services are organized **module-wise** under `src/modules/`. Each module is self-contained and follows the same five pieces:

```
modules/<name>/
├── <name>.routes.ts       Express Router — wires paths to controller methods
├── <name>.controller.ts   HTTP layer only — parses request, calls a service, shapes response
├── services/               Business logic, one file per operation (create, get, ...) + index.ts barrel
├── models/                  A Sequelize Model — this IS the table schema, no separate SQL
└── repository/              The only layer allowed to query the model directly (or, for auth, to Redis)
```

`ledger` is an exception — it's infra other modules read/write through (`account` for reads, `payment` for writes), so it has no `routes.ts`/`controller.ts` of its own.

Current modules: `gateway/src/modules/{user,auth}`, `backend/src/modules/{account,ledger,payment,dashboard}`. Adding a new one: copy the shape from `gateway/src/modules/user` (or `backend/src/modules/account`), then register its router in that service's `src/modules/index.ts` **and** import its model in that service's `src/models/index.ts` (so `npm run migration` picks it up — see below). Order matters in `models/index.ts`: a model referenced by another's FK needs to be imported first.

### Dashboard module (backend)

Exists because the dashboard needs two things nothing else provides: aggregation **across all of a user's accounts** (every other module is scoped to one account at a time) and **categorizing** a transaction.

Categorization can't live on `ledger_entries` — that table is append-only by design (the financial fact), but tagging something "Groceries" is a personal annotation someone might change their mind about, which needs to be mutable. So it's a separate table, `ledger_entry_tags`, one row per ledger entry, upserted on re-tag. Untagged entries show as "Uncategorized" rather than being dropped from aggregates.

`GET /dashboard/overview` · `GET /dashboard/transactions` (filters: `accountId`, `category`, `month`) · `GET /dashboard/expenses?month=YYYY-MM` (debits only, grouped by category) · `GET /dashboard/categories` (the fixed preset list) · `PATCH /dashboard/transactions/:entryId/category`.

### Payment flow (backend)

`POST /payments` — `{ payerAccountId, toPhone, amountMinor }`, requires an `Idempotency-Key` header.

1. Same `Idempotency-Key` + same user seen before → replay the cached response (Redis, 24h TTL), no reprocessing.
2. Resolve `toPhone` → a user via `gateway`'s `GET /users/by-phone/:phone` (backend doesn't own user data, so it asks) → that user's oldest active account.
3. Acquire a Redis lock on the payer's account (`SET NX PX`, retried 3x) — serializes concurrent requests on the same account so two simultaneous payments can't both pass the balance check.
4. Check balance (`SUM(ledger_entries)`) ≥ amount.
5. Compute the MDR fee (`payment/services/calculateMdr.ts` — 0 for payer/payee accounts, 0.4% capped at ₹300 above a ₹2,000 threshold for merchant accounts, mirroring the design doc's UPI framework; the P2PM_MICRO monthly-volume exemption isn't implemented yet).
6. One Postgres transaction: create the `transactions` row, then write two or three `ledger_entries` (payer debit, payee credit, and a platform-fee credit if the fee is non-zero) all sharing that transaction's id. The platform fee account is a singleton, auto-created on first use (`accountRepository.findOrCreatePlatformAccount`).
7. Release the lock, cache the response, return `201`.

`POST /payments/deposit` — `{ accountId, amountMinor }`, same `Idempotency-Key` requirement and lock. Stands in for "the user put cash into their account" until there's a real bank/UPI integration: since there's no counterparty in the system for that cash, the account is recorded as both payer and payee of its own funding transaction, and one ledger entry credits it. Deliberately not a fictional "external" account — same transactions/ledger shape as every other payment, just self-referential.

Shared, cross-module code lives in `src/common/` (error handling, middlewares, utils) and `src/config/` (env, DB, Redis).

## Frontend: feature layout

```
src/
├── api/            Shared axios client (talks to the gateway only)
├── app/            Route table (app/routes.tsx)
├── components/     Shared components (Layout, ProtectedRoute, AuthLayout, OtpInput, Toast, TransactionList)
└── features/
    └── <name>/
        ├── pages/       Route-level components
        ├── services/    Calls to the gateway for this feature
        ├── context/ or hooks/
        └── types/
```

`features/auth` is the template — copy it for new features, then add its routes in `src/app/routes.tsx`. Current features: `auth`, `user` (signup), `account` (list/create/detail), `payment` (send money), `dashboard` (overview, all-transactions, expenses — the dashboard backend module's three read endpoints, one page each). `components/TransactionList` is shared by all three of those dashboard pages plus the account detail page, since "a list of entries, optionally taggable" is the same UI everywhere it appears.

The expenses chart follows the `dataviz` skill: a direct-labeled horizontal bar chart (no legend needed — each bar is labeled with its own category name), using the skill's validated 8-hue categorical palette (light mode only, since this app doesn't support dark mode) with colors assigned by each category's **fixed position** in the category list — never reassigned when a filter changes. The category list has 11 entries but the palette only validates 8 hues; the remaining 3 (`Transfer`, `Income`, `Other`) deliberately render in muted gray rather than inventing an unvalidated 9th hue.

## Getting started

Each service is an independent npm project.

```bash
# backend
cd backend && cp .env.example .env && npm install && npm run dev

# gateway
cd gateway && cp .env.example .env && npm install && npm run dev

# frontend
cd frontend && cp .env.example .env && npm install && npm run dev
```

Both gateway and backend need a Postgres `DATABASE_URL` and a Redis `REDIS_URL` — a free hosted Postgres (Neon, Supabase) and Redis (Upstash) both work fine. They currently point at the same Postgres database (different tables, no conflict) — that's fine for dev; production should give them separate databases.

### Schema (`npm run migration`)

There's no hand-written SQL. **Sequelize models are the schema** — each `models/*.model.ts` file is a `Model.init({...})` call describing every column, and `npm run migration` (in either service, or from the repo root to do both) connects to `DATABASE_URL` and runs `sequelize.sync({ alter: true })`, which creates or updates every table to match whatever the models currently say. One command, works on any machine, and the schema can never drift from the code because there's only one place it's defined.

```bash
npm run migration          # from the repo root — syncs both gateway and backend
# or, per service:
cd gateway && npm run migration
cd backend && npm run migration
```

Two model conventions worth knowing:
- Every table has `created_by` / `updated_by` (nullable `UUID`) for audit purposes — except `ledger_entries`, which only has `created_by`, since entries are append-only and never updated.
- Enum-like columns (`role`, `type`, `status`) are `STRING` + `validate.isIn(...)`, not native Postgres `ENUM` types — Postgres can't auto-cast an existing column's default when `sync({ alter: true })` tries to convert it to a new `ENUM`, which breaks the "just run it anywhere" guarantee. `STRING` sidesteps that entirely.
- **Gotcha**: `sync()` only manages column shape (type/nullability/default) — it does **not** manage Postgres `CHECK` constraints. The very first hand-written migration (before this became Sequelize) put `CHECK` constraints on `users.role` and `accounts.type`/`status`; those are now stale and duplicate what `validate.isIn` already enforces at the app level, and they will NOT update when you add a new value to an `isIn` list — the old constraint silently rejects it at the DB level with no warning from `sync()`. They've been dropped for the columns that exist today. If a fresh `sync()`-created table ever gets a similar constraint added by hand again, expect the same trap — `validate.isIn` in the model is the only enum enforcement this schema actually relies on now.

`ledger_entries.transaction_id` groups every entry belonging to one transfer (a payment writes payer-debit + payee-credit + platform-fee-credit as three entries sharing one `transaction_id` — querying by it is how you find every account involved). It has no FK yet since the `transactions` table doesn't exist until the `payment` module does.
