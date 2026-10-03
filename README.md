# Banking Management System

A full-stack, production-practice banking application: **FastAPI + PostgreSQL** backend and
**React + Vite + TypeScript** frontend. Educational/prototype grade — it follows real banking
engineering practices (atomic money movement, RBAC, audit logging) but is **not** a licensed
core-banking system and must not handle real regulated funds without compliance, audits, and
approved infrastructure.

## Features

- JWT auth: register, login, refresh rotation, logout (single + all sessions), change/forgot/reset password, lockout + rate limiting, OTP/MFA-ready hooks
- RBAC: customer, employee, branch manager, admin
- Customer dashboard: balances, recent transactions, income/expense charts (Recharts), quick actions, beneficiaries, notifications
- Accounts: multi-account per customer, masked numbers, status, branch, statements (PDF/CSV)
- Transfers: internal / beneficiary / self-transfer, confirmation screen, idempotency key, `TXN-YYYYMMDD-XXXXXX` reference
- Transactions: paginated/filtered/sorted list, `PENDING → PROCESSING → COMPLETED / FAILED / REVERSED / CANCELLED`, double-entry `transaction_entries`
- Beneficiaries, cards (tokenized, block/unblock, limits), loans (+ EMI calculator), fixed/recurring deposits, notifications, support tickets, KYC (mock), admin analytics, audit logs, branch/customer management

## Stack

| Layer    | Tech |
|----------|------|
| Frontend | React 18, Vite, TypeScript, Tailwind, shadcn/ui + Radix, TanStack Query, React Hook Form + Zod, Router, Recharts, Sonner |
| Backend  | Python 3.12, FastAPI, Pydantic v2, SQLAlchemy 2.x, Alembic, PostgreSQL 16, Uvicorn, JWT (access+refresh), bcrypt/argon2 |
| Ops      | Docker + Compose, GitHub Actions, Vercel (frontend), Render (backend), Neon (Postgres) |

## Prerequisites

- Python 3.12+, Node 20+, Docker + Compose, Git
- A PostgreSQL 16 instance (local Docker or Neon)

## Environment

```bash
cp .env.example .env
# then edit secrets; backend also reads backend/.env, frontend reads frontend/.env
```

| Variable | Used by | Example |
|---|---|---|
| `DATABASE_URL` | backend | `postgresql+psycopg2://banking:pw@localhost:5432/banking` |
| `JWT_SECRET` / `JWT_REFRESH_SECRET` | backend | long random strings (different values) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | backend | `30` |
| `REFRESH_TOKEN_EXPIRE_DAYS` | backend | `7` |
| `CORS_ORIGINS` | backend | `http://localhost:5173,http://localhost:3000` |
| `ENVIRONMENT` | backend | `development` / `production` / `test` |
| `VITE_API_URL` | frontend (build-time) | `http://localhost:8000` (prod: Render URL) |

Never commit `.env`. See [SECURITY.md](SECURITY.md).

## Local dev

**Option A — Docker (Postgres only, recommended for iteration):**

```bash
docker compose up -d postgres
cd backend
python -m venv .venv && .venv\Scripts\activate   # Windows
# source .venv/bin/activate                       # macOS/Linux
pip install -r requirements.txt
alembic upgrade head
python seed.py            # demo users (fictional data only)
uvicorn app.main:app --reload   # http://localhost:8000/docs

cd ../frontend
npm install
npm run dev             # http://localhost:5173
```

**Option B — everything in Docker:**

```bash
docker compose up --build
# postgres :5432, backend :8000, frontend :3000
```

Demo logins (dev/seed only): `admin@example.com`, `manager@example.com`,
`employee@example.com`, `customer@example.com` (see backend seed script for passwords).

## Migrations

```bash
cd backend
alembic upgrade head            # apply
alembic revision --autogenerate -m "describe change"   # new migration
```

Never edit production tables by hand; always go through Alembic. See [DATABASE.md](DATABASE.md).

## Testing

```bash
cd backend && pytest -q
cd ../frontend && npm run typecheck && npm run lint && npm run build
```

Backend tests cover auth, RBAC, deposits/withdrawals/transfers, insufficient-funds,
idempotency, beneficiary ownership, loan/FD math, validation. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Production build

```bash
cd backend && pip install -r requirements.txt && pytest -q
cd ../frontend && npm ci && npm run build   # outputs dist/
```

## Deployment

| Service | Host | Notes |
|---|---|---|
| Database | Neon | managed Postgres, SSL, pooled `DATABASE_URL` |
| Backend | Render | build `pip install -r requirements.txt`, start `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| Frontend | Vercel | build `npm run build`, output `dist`, env `VITE_API_URL=<render-url>` |

Full step-by-step: [DEPLOYMENT.md](DEPLOYMENT.md). Set production CORS to the exact Vercel origin (no `*`).

## Docs

- [ARCHITECTURE.md](ARCHITECTURE.md) · [API.md](API.md) · [DATABASE.md](DATABASE.md)
- [SECURITY.md](SECURITY.md) · [DEPLOYMENT.md](DEPLOYMENT.md) · [CONTRIBUTING.md](CONTRIBUTING.md)
- Live OpenAPI: `GET /docs` (Swagger UI), `/redoc`, `/openapi.json`
