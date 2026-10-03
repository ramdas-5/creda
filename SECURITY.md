# Security

Prototype with production habits — not a licensed bank. No real customer PII, no real card
data (tokenized mocks only), no real KYC vendor.

## Implemented

- Argon2id/bcrypt hashing; JWT access (30 min) + rotating revocable refresh (7 days, `login_sessions`); lockout + rate limiting on auth; RBAC on every endpoint; ownership checks (never trust `user_id`/`account_id`/`role` from client); CORS allowlist (no `*` in prod); Pydantic validation; SQLAlchemy parameterization (no raw string SQL); masked account/card numbers; idempotency keys on money POSTs; atomic transfers with row locks; audit logs without secrets; secure headers; consistent error envelope (no stack traces to clients); `.env` never committed (`.gitignore` + CI secret scan).

## Do / never

- Do: strong unique `JWT_SECRET` / `JWT_REFRESH_SECRET` per environment, HTTPS everywhere, Neon SSL, Render secret env, Vercel `VITE_API_URL` pointing at Render, least-privilege DB users, rotate on suspicion.
- Never: hardcode secrets, commit `.env`, log passwords/tokens/OTPs/CVV, store CVV/PIN, trust frontend roles/balances, expose DB creds, return excess PII.

## Reporting

Report suspected vulnerabilities privately to maintainers; do not open public issues
with exploit details. See CONTRIBUTING.md.
