# PayLedger

Backend payment gateway and ledger system. See [`PayLedger — Technical Design Document.md`](./PayLedger%20%E2%80%94%20Technical%20Design%20Document.md) for the full design.

## Structure

```
PayLedger/
├── frontend/   React + TypeScript (Vite)
├── gateway/    Node.js + Express — owns auth + user data, load balancing later
└── backend/    Node.js + Express — accounts + ledger today, payments/webhooks/reconciliation next
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

`ledger` is the one exception — it's infra other modules read/write through (backend's `account` module today, `payment`/`reconciliation` later), so it has no `routes.ts`/`controller.ts` of its own.

Current modules: `gateway/src/modules/{user,auth}`, `backend/src/modules/{account,ledger}`. Adding a new one: copy the shape from `gateway/src/modules/user` (or `backend/src/modules/account`), then register its router in that service's `src/modules/index.ts` **and** import its model in that service's `src/models/index.ts` (so `npm run migration` picks it up — see below).

Shared, cross-module code lives in `src/common/` (error handling, middlewares, utils) and `src/config/` (env, DB, Redis).

## Frontend: feature layout

```
src/
├── api/            Shared axios client (talks to the gateway only)
├── app/            Route table (app/routes.tsx)
├── components/     Shared components (Layout, ProtectedRoute, AuthLayout, OtpInput, Toast)
└── features/
    └── <name>/
        ├── pages/       Route-level components
        ├── services/    Calls to the gateway for this feature
        ├── context/ or hooks/
        └── types/
```

`features/auth` is the template — copy it for new features (e.g. `features/payments`), then add its routes in `src/app/routes.tsx`.

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

`ledger_entries.transaction_id` groups every entry belonging to one transfer (a payment writes payer-debit + payee-credit + platform-fee-credit as three entries sharing one `transaction_id` — querying by it is how you find every account involved). It has no FK yet since the `transactions` table doesn't exist until the `payment` module does.
