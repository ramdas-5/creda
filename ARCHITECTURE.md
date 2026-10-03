# Architecture

## Runtime topology

```text
                Internet
                   │
                   ▼
            ┌─────────────┐
            │   Vercel    │  React 18 + Vite + TS (static dist/ via CDN)
            └──────┬──────┘
                   │ HTTPS (VITE_API_URL)
                   ▼
            ┌─────────────┐
            │   Render    │  FastAPI + Uvicorn (stateless web service)
            └──────┬──────┘
                   │ SSL (pooled DATABASE_URL)
                   ▼
            ┌─────────────┐
            │    Neon     │  PostgreSQL 16 (managed)
            └─────────────┘
```

Local dev mirrors this: `docker compose up -d postgres` + `uvicorn --reload` + `vite dev`.

## Backend (`backend/`) — FastAPI, service-layer

```text
backend/app/
  main.py              # app factory, router mounting (/api/v1/*), CORS, middleware, logging
  core/                # config (env), security (hash/JWT), errors, logging
  api/v1/              # thin route handlers per resource (auth, accounts, transfers, …)
  models/              # SQLAlchemy 2.x ORM (one file per table group)
  schemas/             # Pydantic v2 request/response DTOs
  services/            # business logic + DB transactions (transfer atomicity, EMI/FD math)
  repositories/        # query helpers (keeps services DB-idiomatic, testable)
  middleware/          # rate limit, request-id, secure headers
  dependencies/        # get_current_user, require_roles, DB session, idempotency
  utils/               # reference-number gen, pagination, CSV/PDF helpers
```

Rules: routes validate input (Pydantic) and enforce authZ, then delegate to services;
services own transactions (`BEGIN … COMMIT/ROLLBACK`, `SELECT … FOR UPDATE` on accounts);
the DB is the source of truth — balances are never trusted from the client.
Consistent error envelope: `{ "success": false, "error": { "code": "…", "message": "…" } }`.

## Frontend (`frontend/`) — React, feature-based

```text
frontend/src/
  api/ client.ts (axios/fetch with refresh-token rotation) + per-resource modules
  features/{auth,accounts,transfers,cards,loans,deposits,admin,…}/
  components/ui/ (shadcn/Radix primitives) + tables, charts, skeletons, empty/error states
  pages/ (one route per URL in §44 of spec) + layouts/ (sidebar, role-filtered nav)
  hooks/ stores/ routes/ schemas/ (Zod) types/ utils/ (currency `Intl.NumberFormat('en-IN', {…INR})`)
```

Server state via TanStack Query (cache + pagination), forms via React Hook Form + Zod,
toasts via Sonner plus a persistent notification center for money events.

## AuthN/AuthZ

Access JWT (short-lived) + rotating refresh token (revocable `login_sessions` row);
bcrypt/argon2 hashing; lockout after repeated failures; RBAC matrix
customer < employee < branch-manager < admin enforced server-side on every endpoint.

## Money-movement transaction

Debit A → credit B → insert `transactions` + double-entry `transaction_entries` →
audit row, all in one DB transaction with row locks, `CHECK (balance >= 0)`,
and an `Idempotency-Key` header guard. Any failure rolls back. See DATABASE.md.

## Cross-cutting

Logging (no secrets), request IDs, secure headers, rate limits on auth/money routes,
server pagination everywhere, seeded demo data (`admin/manager/employee/customer@example.com`)
for development only.
