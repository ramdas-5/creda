# Database

PostgreSQL 16. Managed via Alembic (`alembic upgrade head`). ER summary below;
the backend `models/` + migration scripts are authoritative.

## Core ER (→ = many-to-one)

- `roles` (1) ←→ `permissions` via `role_permissions`; `users.role_id → roles`
- `users` (1) ←→ `customers` (profile/KYC per login); `customers.branch_id → branches`
- `account_types` (Savings/Current/Salary/…) ← `accounts.account_type_id`
- `accounts`: `customer_id → customers`, `branch_id → branches`; `account_holders` (joint), `account_types`
- Money spine: `transactions` (one row per event: `reference TXN-… UNIQUE`, `type, amount, fee, status, balance_after, idempotency_key UNIQUE`) + `transaction_entries` (double-entry debit/credit legs → accounts) + `transfers` (from/to/beneficiary/remarks) + `deposits` / `withdrawals`
- Products: `cards` (tokenized PAN only) → accounts; `loans` + `loan_payments`; `fixed_deposits`; `recurring_deposits` (+ installment history)
- Aux: `beneficiaries` (owner → accounts), `notifications`, `messages`, `statements`, `support_tickets`
- Security: `audit_logs` (user, action, entity, ip, user-agent, metadata JSONB), `login_sessions` (refresh rotation), `password_reset_tokens`, `otp_verifications`

## Money rule — NUMERIC, never float

```sql
amount NUMERIC(19,4) NOT NULL CHECK (amount > 0),
balance NUMERIC(19,4) NOT NULL DEFAULT 0 CHECK (balance >= 0),
interest_rate NUMERIC(7,4)
```

Python maps these to `Decimal` / Pydantic `condecimal`; JSON serializes as strings;
formatting is `en-IN` INR in one frontend util. Floats appear nowhere in balances.

## Integrity

- PKs (UUID or identity), FKs with explicit `ON DELETE` behavior, unique `(account_number)`, `(reference)`, `(idempotency_key)`, partial unique active card numbers, `CHECK` on amounts/status enums (native PG enums or check constraints), `GIN`/`B-tree` indexes on `(customer_id)`, `(status)`, `(created_at)`, `((metadata))` where needed, `created_at/updated_at` timestamps, soft-delete (`deleted_at`) on customers/accounts/beneficiaries/cards.
- Transfers run in one DB transaction with `SELECT … FOR UPDATE` on both accounts, balance re-check inside the lock, insert transaction + entries + audit, then commit; any error rolls back. See ARCHITECTURE.md.
