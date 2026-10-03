# API Reference (`/api/v1/*`)

Base URL: `VITE_API_URL` (local `http://localhost:8000`). Interactive docs: `/docs`, `/redoc`, `/openapi.json`.
Auth: `Authorization: Bearer <access_token>` unless noted. Money POSTs accept `Idempotency-Key` header.
Errors: `{ "success": false, "error": { "code": "…", "message": "…" } }` with proper HTTP status.
List endpoints: `?page=&page_size=&sort=&order=&q=&from=&to=&status=&type=&account_id=&min_amount=&max_amount=`.

| Method | Endpoint | Auth / Role | Description |
|---|---|---|---|
| POST | `/api/v1/auth/register` | public | Register customer |
| POST | `/api/v1/auth/login` | public (rate-limited) | Login → access + refresh |
| POST | `/api/v1/auth/refresh` | refresh token | Rotate refresh, new access |
| POST | `/api/v1/auth/logout` | user | Revoke current session |
| POST | `/api/v1/auth/logout-all` | user | Revoke all sessions |
| POST | `/api/v1/auth/change-password` | user | Change password |
| POST | `/api/v1/auth/forgot-password` | public | Request reset token |
| POST | `/api/v1/auth/reset-password` | public (token) | Reset with token |
| GET/PUT | `/api/v1/users/me` | user | Own profile |
| GET | `/api/v1/users` | admin/manager | List users |
| PATCH | `/api/v1/users/{id}` | admin | Update role/status |
| GET/POST | `/api/v1/customers` | employee+ | Search/list, create profile |
| GET/PUT | `/api/v1/customers/{id}` | employee+ | Profile, KYC state |
| GET/POST | `/api/v1/accounts` | user (scoped) / employee+ create | Own accounts; open account |
| GET | `/api/v1/accounts/{id}` | owner / staff | Detail + recent txns |
| PATCH | `/api/v1/accounts/{id}` | employee+ | Freeze/activate (confirm) |
| GET | `/api/v1/transactions` | owner-scoped | Paginated + filters |
| GET | `/api/v1/transactions/{id}` | owner / staff | Detail incl. entries, balances |
| POST | `/api/v1/transfers` | customer | Internal/beneficiary/self transfer (idempotent) |
| GET | `/api/v1/transfers/{ref}` | owner | Lookup by `TXN-…` reference |
| POST | `/api/v1/accounts/{id}/deposit` | owner / staff | Simulated deposit |
| POST | `/api/v1/accounts/{id}/withdraw` | owner / staff | Withdrawal (balance check) |
| GET/POST | `/api/v1/beneficiaries` | customer | List / add |
| PUT/DELETE | `/api/v1/beneficiaries/{id}` | customer (owner) | Edit / delete (confirm) |
| GET/POST | `/api/v1/cards` | customer | List / request (tokenized) |
| PATCH | `/api/v1/cards/{id}` | customer (owner) | Activate/block/limit |
| GET/POST | `/api/v1/loans` | customer | Products, apply |
| GET | `/api/v1/loans/{id}` | owner / staff | Schedule, payments, balance |
| GET | `/api/v1/loans/calculator` | public | EMI quote |
| GET/POST | `/api/v1/fixed-deposits` | customer | List / create (+maturity calc) |
| POST | `/api/v1/fixed-deposits/{id}/premature-withdraw` | customer (owner) | Early closure request |
| GET/POST | `/api/v1/recurring-deposits` | customer | List / create |
| GET | `/api/v1/recurring-deposits/{id}` | owner | Installments, next due |
| GET/PATCH | `/api/v1/notifications` | user | List, mark read |
| GET | `/api/v1/statements?account_id=&from=&to=` | owner | View; `&format=pdf\|csv` to download |
| GET/POST | `/api/v1/support` | user | Tickets list / create |
| GET/POST | `/api/v1/support/{id}/replies` | user (scoped) / staff | Thread |
| PATCH | `/api/v1/support/{id}` | staff | Assign/status |
| GET | `/api/v1/admin/overview` | admin/manager | KPIs + chart series |
| GET/POST | `/api/v1/admin/branches` | admin | Branch CRUD |
| GET | `/api/v1/audit/logs` | admin/manager (scoped) | Audit trail |
| GET | `/api/v1/admin/reports/*` | admin/manager | Volume, deposits-vs-withdrawals, growth |

Status enums: transaction `PENDING/PROCESSING/COMPLETED/FAILED/REVERSED/CANCELLED`;
loan `APPLIED/UNDER_REVIEW/APPROVED/REJECTED/ACTIVE/CLOSED`; support
`OPEN/IN_PROGRESS/WAITING_FOR_CUSTOMER/RESOLVED/CLOSED`; KYC
`NOT_SUBMITTED/PENDING/VERIFIED/REJECTED`.
