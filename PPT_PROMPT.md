# PPT Generation Prompt — Banking Management System (6 Pages)

> Copy-paste the prompt inside the box into any AI PPT maker (Gamma / Tome / Canva AI / Copilot / Beautiful.ai).

---

## COPY THIS PROMPT:

```
Create a modern, professional 6-slide presentation for my project:

"BANKING MANAGEMENT SYSTEM — FastAPI + PostgreSQL + React"

Audience: college students + teacher. Tone: simple, confident, easy to explain.
Style: clean banking theme (navy blue + white), large headings, 4-5 bullet points max per slide,
one diagram on EVERY slide (use Mermaid.js), plus speaker notes (30 seconds per slide).

---

SLIDE 1 — FRONT / TITLE PAGE
Title: Banking Management System
Subtitle: Realistic Branch Banking — Customers Transfer, Staff Handles Cash
Show: Nexus Bank, FastAPI + PostgreSQL + React + Vite + TypeScript, Docker, Team/College name placeholder.
Diagram (Mermaid flowchart):
```mermaid
flowchart LR
  U[Customer App] --> API[FastAPI Backend]
  S[Staff Counter] --> API
  API --> DB[(PostgreSQL 16)]
```

SLIDE 2 — WHAT IS IT & WHY IT IS REALISTIC
Explain in easy words: full-stack banking prototype, not real-money licensed system.
Key features: JWT auth, 4 roles, dashboard, transfers with TXN reference, loans + EMI, FD/RD, cards, statements, notifications, support.
Realistic rule highlight: USER has NO deposit/withdraw button — only Transfer. Only ADMIN / MANAGER / EMPLOYEE can do cash deposit/withdraw at Branch Counter. Freezing, KYC verify, reverse txn are staff-only.
Diagram (Mermaid mindmap or quadrant):
```mermaid
flowchart TB
  subgraph Customer CAN
    T[Transfer] --> B[Beneficiary]
    B --> L[Apply Loan]
  end
  subgraph Staff ONLY
    D[Cash Deposit] --> W[Cash Withdraw]
    W --> F[Freeze / Close Account]
    F --> R[Reverse Transaction]
    R --> K[Verify KYC]
  end
```

SLIDE 3 — SYSTEM ARCHITECTURE
Explain 3-tier: Vercel frontend -> Render backend -> Neon Postgres. Local: Docker Postgres + Uvicorn reload + Vite dev. Backend layers: routes validate, services own transactions, DB is source of truth.
Diagram (Mermaid architecture):
```mermaid
flowchart TB
  Internet --> V[Vercel - React Dist]
  V -->|HTTPS VITE_API_URL| R[Render - FastAPI + Uvicorn]
  R -->|SSL pooled DATABASE_URL| N[Neon - PostgreSQL 16]
  subgraph Local Dev
    D[Docker Postgres :5432] --- U[Uvicorn :8000 /docs] --- F[Vite :5173]
  end
```

SLIDE 4 — ROLES, ADMIN POWER & MONEY SAFETY
Explain RBAC: customer < employee < manager < admin, enforced server-side every API. Admin Control Tower: suspend users, KYC verify/reject, freeze/close accounts, reverse txn, approve loans, manage branches, audit logs. Money safety: atomic transfer with SELECT FOR UPDATE, CHECK balance>=0, idempotency-key, double-entry Transaction DEBIT+CREDIT, audit row. Any failure = rollback.
Diagram (Mermaid sequence):
```mermaid
sequenceDiagram
  participant C as Customer
  participant API as FastAPI
  participant DB as Postgres
  C->>API: POST /transfers + Idempotency-Key
  API->>DB: LOCK accounts FOR UPDATE
  API->>DB: Debit A / Credit B + 2 Transactions
  API->>DB: Audit + Notify
  DB-->>C: TXN-YYYYMMDD-XXXXXX COMPLETED
  Note over API,DB: Staff Teller: POST /admin/teller/deposit is same but role=staff only
```

SLIDE 5 — DEMO FLOW + TECH STACK
Explain demo: Login as customer@example.com -> dashboard -> add beneficiary -> transfer -> statement. Login as admin@example.com -> Control Tower -> Branch Counter deposit -> freeze account -> reverse txn -> approve KYC/loan. Tech table: Frontend React18/Vite/TS/Tailwind/Query/Recharts, Backend Python3.12/FastAPI/Pydantic/SQLAlchemy/Alembic/JWT, Ops Docker/Compose/GitHub Actions/Vercel/Render/Neon.
Diagram (Mermaid user journey):
```mermaid
flowchart LR
  Login --> Dash[Dashboard] --> Ben[Add Beneficiary] --> Tr[Transfer New] --> St[Statement]
  LoginA[Admin Login] --> Tower[Control Tower] --> Counter[Branch Counter] --> Freeze[Freeze / Reverse]
```

SLIDE 6 — CONCLUSION & THANK YOU
Conclusion in 3 lines: learned real banking rules, secure atomic money movement, clean role separation. Future scope: UPI hook, OTP/MFA, PDF passbook, interest cron, mobile app. Big THANK YOU + Q&A + demo links: /docs, /dashboard, /admin/teller. Placeholder for names.
Diagram (Mermaid simple closing):
```mermaid
flowchart LR
  Learn[What we learned] --> Secure[Secure Money Movement]
  Secure --> Roles[Correct Roles]
  Roles --> Thanks[Thank You - Q&A]
  style Thanks fill:#1d4ed8,stroke:#fff,color:#fff
```
---

Rules for generator: 6 slides only, title + bullets + one Mermaid diagram per slide, editable, add icons, keep text large and minimal.
```

---

### How to use
1. Copy the grey box above.
2. Paste into Gamma / Canva AI / Copilot PPT.
3. Select 16:9, banking theme, 6 slides.
4. Replace placeholders: college name, team members, demo URLs (`http://localhost:8000/docs`, `http://localhost:5173`, `/admin/teller`).
