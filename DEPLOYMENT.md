# Deployment (GitHub → Neon → Render → Vercel)

```text
GitHub (source) → Neon (Postgres) → Render (FastAPI) → Vercel (React)
```

## 1. GitHub

```bash
git init && git add . && git commit -m "feat: banking system"
gh repo create banking-system --public --source=. --push
# or: git remote add origin <url> && git push -u origin main
```

CI (`.github/workflows/ci.yml`) runs backend pytest, frontend typecheck/lint/build,
and a secret scan on every push/PR. Keep main green.

## 2. Neon (PostgreSQL)

1. app.neon.tech → New Project → Postgres 16 → copy the pooled connection string.
2. Convert to SQLAlchemy form: `postgresql+psycopg2://user:pw@host/db?sslmode=require`.
3. Apply schema from CI or locally:
   `DATABASE_URL=<neon-url> alembic upgrade head` (from `backend/`).

## 3. Render (backend, `backend/` root)

- New → Web Service → select repo → Root Directory `backend`, Runtime Python 3.12.
- Build: `pip install -r requirements.txt`
- Start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Env: `DATABASE_URL` (Neon pooled URL), `JWT_SECRET`, `JWT_REFRESH_SECRET`,
  `ACCESS_TOKEN_EXPIRE_MINUTES=30`, `REFRESH_TOKEN_EXPIRE_DAYS=7`,
  `CORS_ORIGINS=https://<your-app>.vercel.app`, `ENVIRONMENT=production`.
- Deploy → verify `https://<api>.onrender.com/docs` and `/api/v1/admin/overview` (admin token).

## 4. Vercel (frontend, `frontend/` root)

- Import repo → Framework Vite → Root `frontend`.
- Build: `npm run build`; Output: `dist`; Node 20.
- Env: `VITE_API_URL=https://<api>.onrender.com` (no trailing slash). Redeploy after changing it (build-time).
- Verify login → dashboard → transfer with backend reference `TXN-…`.

## Post-deploy checklist

CORS exact origin (no `*`), distinct JWT secrets, `ENVIRONMENT=production`,
migrations applied, seed **not** run in prod, Render + Vercel logs clean, CI green.
Rollback: Render previous deploy / Vercel previous deployment; DB via Neon point-in-time restore.
