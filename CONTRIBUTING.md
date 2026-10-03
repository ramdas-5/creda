# Contributing

## Setup

```bash
cp .env.example .env
docker compose up -d postgres
# backend: venv → pip install -r requirements.txt → alembic upgrade head → uvicorn app.main:app --reload
# frontend: npm install → npm run dev
```

Use fictional demo data only (`admin/manager/employee/customer@example.com`).

## Standards

- Backend: service-layer (routes → services → repositories), Pydantic validation, `Decimal` for money, transactions for financial writes, ownership + RBAC checks, audit security events, no secrets in logs.
- Frontend: feature folders, small typed components, Hook Form + Zod, TanStack Query, masked sensitive data, loading/empty/error states with skeletons, `en-IN` INR formatting util.
- No fake functionality: wire every button to a real operation or mark it unavailable.

## Checks (must pass)

```bash
cd backend && ruff check . && pytest -q
cd ../frontend && npm run typecheck && npm run lint && npm run build
```

New money logic needs tests: happy path, insufficient funds, idempotency replay,
concurrency, and RBAC denial. Migrations via `alembic revision --autogenerate`.

## Commits / PRs

Conventional commits (`feat:`, `fix:`, `chore:`), small scoped PRs against `main`,
describe test evidence. CI blocks broken builds. Report security issues privately.
