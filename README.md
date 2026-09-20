# PayLedger

Backend payment gateway and ledger system. See [`PayLedger — Technical Design Document.md`](./PayLedger%20%E2%80%94%20Technical%20Design%20Document.md) for the full design.

## Structure

```
PayLedger/
├── frontend/   React + TypeScript (Vite)
├── gateway/    Node.js + Express — owns auth + user data, load balancing later
└── backend/    Node.js + Express — payments, ledger, webhooks, reconciliation
```

Request path: **frontend → gateway → backend**. The frontend never calls the backend directly. **The gateway owns everything user-related** (the `users` table, create/update/verify) as well as auth — backend has nothing user-related in it; it only ever receives an already-identified request.

**Auth flow (gateway):** `POST /auth/login` (email + password) → gateway checks the password itself against its own `users` table → on success, generates a 6-digit OTP and stores it in Redis (10 min TTL) → `POST /auth/verify-otp` (email + otp) → on match, gateway issues an opaque session token and stores it in Redis (1h TTL). Every later request carries that token as `Authorization: Bearer <token>`; the `authenticate` middleware looks it up in Redis and attaches the user to `req.user`, which the proxy forwards to the backend as `X-User-Id` / `X-User-Email` / `X-User-Role` headers — the backend trusts the gateway's check instead of re-verifying.

Round-robin load balancing across multiple backend instances plugs into `gateway/src/common/proxy/backendTargetPicker.ts` later — add more comma-separated `BACKEND_TARGETS` and it starts fanning out with no code change.

## Backend & gateway: module layout

Both services are organized **module-wise** under `src/modules/`. Each module is self-contained and follows the same five pieces, using the `user` and `auth` modules (both in gateway) as the template for every module added after them — backend's `modules/` is currently empty, waiting for its first real module (`payment`, `account`, `ledger`, ...):

```
modules/<name>/
├── <name>.routes.ts       Express Router — wires paths to controller methods
├── <name>.controller.ts   HTTP layer only — parses request, calls a service, shapes response
├── services/               Business logic, one file per operation (create, get, ...) + index.ts barrel
├── models/                  The table's schema only (plain TS interface matching its columns)
└── repository/              The only layer allowed to talk to the DB (or, for auth, to Redis)
```

Adding a new module:
1. Copy the five-piece structure from `gateway/src/modules/user`.
2. Register its router in that service's `src/modules/index.ts`.

Shared, cross-module code lives in `src/common/` (error handling, middlewares, utils) and `src/config/` (env, DB, Redis).

## Frontend: feature layout

```
src/
├── api/            Shared axios client (talks to the gateway only)
├── app/            Route table (app/routes.tsx)
├── components/     Shared components (Layout, ProtectedRoute)
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

The gateway needs a Postgres `DATABASE_URL` (it owns the `users` table) and a Redis `REDIS_URL` (OTP + session storage) — a free hosted Postgres (Neon, Supabase) and Redis (Upstash) both work fine. Backend will need its own `DATABASE_URL` once it owns real tables (payments, ledger entries, ...) — it doesn't touch Postgres yet. Docker Compose for the full stack is not set up yet.

### Migrations

Migrations are plain SQL files under each service's own `migrations/` folder, run via [node-pg-migrate](https://github.com/salsita/node-pg-migrate) — it's a standalone CLI that connects directly to `DATABASE_URL`, independent of whether the app itself is running. It tracks which files have already run in its own `pgmigrations` table, so `up` only applies the ones that are pending.

```bash
cd gateway   # or backend, once it has its own tables
npm run migration:create -- add-something   # scaffolds a new migration file
npm run migration:up                        # applies every pending migration
npm run migration:down                      # rolls back only the most recently applied one
```
