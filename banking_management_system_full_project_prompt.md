# Production-Ready Banking Management System — Full Development Prompt

You are a senior full-stack software architect, backend engineer, frontend engineer, database designer, UI/UX designer, security engineer, and DevOps engineer.

I have an existing Python banking management project. Transform/rebuild it into a modern, professional, full-stack Banking Management System using the architecture and requirements below.

The final result must look and behave like a serious real-world banking application, not a basic college CRUD project.

Do not create a fake-looking demo UI. Build a complete, functional application with proper authentication, authorization, database relationships, transaction handling, validation, error handling, audit logging, security practices, responsive UI, testing, documentation, and deployment configuration.

---

## 1. Core Technology Stack

### Frontend

Use:

- React
- Vite
- TypeScript
- Tailwind CSS
- shadcn/ui
- Radix UI
- Lucide React icons
- TanStack Query for server state
- React Hook Form
- Zod for validation
- React Router
- Recharts for financial analytics
- date-fns for date/time handling
- Sonner or an equivalent modern toast system
- Framer Motion only where animations improve UX

Use reusable components and a consistent design system.

Do NOT build everything as one huge component.

### Backend

Use:

- Python
- FastAPI
- Pydantic
- SQLAlchemy 2.x
- Alembic
- PostgreSQL
- Uvicorn
- JWT authentication
- Argon2id or bcrypt password hashing
- Python logging
- structured error handling
- environment-based configuration

The backend must be REST API based.

Use service-layer architecture instead of putting business logic directly inside route handlers.

Recommended structure:

```text
backend/
├── app/
│   ├── main.py
│   ├── core/
│   ├── api/
│   ├── models/
│   ├── schemas/
│   ├── services/
│   ├── repositories/
│   ├── middleware/
│   ├── dependencies/
│   └── utils/
├── tests/
├── alembic/
├── requirements.txt
├── .env.example
└── Dockerfile
```

---

## 2. Database

Use PostgreSQL.

Design a normalized relational database suitable for a banking application.

Important entities should include:

- users
- roles
- permissions
- customers
- branches
- accounts
- account_types
- account_holders
- beneficiaries
- transactions
- transaction_entries
- transfers
- deposits
- withdrawals
- cards
- loans
- loan_payments
- fixed_deposits
- recurring_deposits
- notifications
- messages
- statements
- audit_logs
- login_sessions
- password_reset_tokens
- otp_verifications
- support_tickets

Use:

- primary keys
- foreign keys
- unique constraints
- indexes
- check constraints
- timestamps
- soft deletion where appropriate
- database transactions
- appropriate decimal/numeric types for money

NEVER use floating-point numbers for monetary values.

Use PostgreSQL NUMERIC/DECIMAL for financial amounts.

---

## 3. Important Banking Principle

Money operations must be atomic and consistent.

For example, transferring money from Account A to Account B:

1. Authenticate the user.
2. Verify Account A belongs to/has access for the user.
3. Verify Account B exists.
4. Verify the account is active.
5. Verify sufficient available balance.
6. Start a database transaction.
7. Lock required account records where appropriate.
8. Debit Account A.
9. Credit Account B.
10. Create transaction records.
11. Create audit record.
12. Commit everything.

If any operation fails:

```text
ROLLBACK
```

Never allow partial transactions.

Prevent:

- negative balance bugs
- duplicate transfers
- double spending caused by concurrent requests
- race conditions
- unauthorized account access
- transaction duplication

Use idempotency mechanisms for sensitive transaction endpoints.

---

## 4. User Roles

Implement proper role-based access control.

### Customer

Can:

- view dashboard
- view accounts
- view balances
- view transaction history
- transfer money
- add beneficiaries
- manage beneficiaries
- deposit simulation where applicable
- request withdrawal where applicable
- download statements
- manage profile
- change password
- enable/disable available security options
- view notifications
- contact support
- view loans
- view deposits
- manage cards where applicable

### Bank Employee

Can:

- search customers
- create/manage customer profiles
- open accounts
- verify customer information
- process permitted banking operations
- view transactions
- handle support requests
- manage certain account operations

### Branch Manager

Can:

- manage branch-level operations
- approve permitted requests
- view branch reports
- monitor employees
- review suspicious transactions
- access branch analytics

### Admin

Can:

- manage users
- manage roles
- manage permissions
- manage branches
- configure account types
- manage system configuration
- view system-wide analytics
- view audit logs
- manage employee accounts
- suspend/activate accounts
- monitor security events

Never expose admin functionality to ordinary customers.

---

## 5. Authentication

Implement professional authentication.

Features:

- registration
- login
- logout
- JWT access token
- refresh token
- secure password hashing
- password strength validation
- change password
- forgot password
- password reset
- account lockout/rate limiting after repeated failed login attempts
- session management
- logout from current session
- logout from all sessions
- optional OTP/MFA architecture

Never store plaintext passwords.

Never store secrets in frontend code.

Use environment variables.

---

## 6. Customer Dashboard

Create a premium banking dashboard.

Include:

- total balance
- available balance
- account summary
- recent transactions
- income
- expenses
- monthly spending chart
- transaction category chart
- quick actions
- recent beneficiaries
- pending requests
- notifications
- security alerts

Example quick actions:

```text
Transfer Money
Send to Beneficiary
Deposit
Withdraw
View Statement
Manage Cards
```

Use skeleton loaders while loading data.

Do not display fake hardcoded financial information once the backend is connected.

---

## 7. Account Management

Customers can have multiple accounts.

Examples:

- Savings Account
- Current Account
- Salary Account
- Student Account
- Fixed Deposit Account

Account page should show:

- account number
- masked account number
- account type
- current balance
- available balance
- status
- branch
- opening date
- recent transactions
- account statement
- downloadable statement

Mask sensitive information where appropriate.

---

## 8. Money Transfer

Implement a professional transfer flow.

Support:

### Internal Transfer

Account → Account

### Beneficiary Transfer

Customer → Saved Beneficiary

### Self Transfer

Customer's own account → another own account

Transfer page must include:

- source account
- destination account
- beneficiary
- amount
- remarks
- confirmation screen
- transaction PIN/OTP architecture if enabled
- success/failure result
- transaction reference number

Before executing, show a confirmation summary.

Example:

```text
From:
Savings Account ****1234

To:
John Doe ****5678

Amount:
₹10,000.00

Transfer Fee:
₹0.00

Total:
₹10,000.00
```

After success, generate a unique transaction reference.

Example:

```text
TXN-20261003-8F3A92
```

Do not use predictable sequential transaction IDs as the only transaction identifier.

---

## 9. Transaction System

Every financial operation must produce a transaction record.

Transaction list should support:

- pagination
- search
- date filtering
- amount filtering
- transaction type filtering
- account filtering
- status filtering
- sorting

Transaction states:

```text
PENDING
PROCESSING
COMPLETED
FAILED
REVERSED
CANCELLED
```

Transaction details should show:

- transaction ID
- reference number
- date/time
- amount
- debit/credit
- sender
- receiver
- status
- description
- fees
- balance after transaction

---

## 10. Bank Statement

Create a professional statement system.

Allow users to:

- select account
- select date range
- filter transactions
- view statement
- download PDF
- export CSV

Statement should contain:

```text
Bank Name
Customer Name
Account Number
Account Type
Statement Period

Opening Balance

Date
Transaction ID
Description
Debit
Credit
Balance

Closing Balance
```

Make the PDF professional and printable.

---

## 11. Beneficiary Management

Implement:

- add beneficiary
- edit beneficiary
- delete beneficiary
- verify beneficiary
- beneficiary activation
- beneficiary nickname
- bank/account information

Add confirmation before deleting.

For sensitive changes, provide an OTP/MFA-ready architecture.

---

## 12. Cards

Create a card-management module.

Cards can include:

- debit card
- virtual card

Display masked card information.

Features:

- card status
- activate card
- temporarily block card
- unblock card
- request replacement
- set spending limit
- view card transactions

Do NOT store real CVV or sensitive card data.

For this project, use safe mock/tokenized card representations rather than storing real payment-card credentials.

---

## 13. Loans

Create a loan management module.

Features:

- loan products
- loan application
- loan amount
- tenure
- interest rate
- EMI calculation
- application status
- repayment schedule
- payment history
- outstanding balance

Loan statuses:

```text
APPLIED
UNDER_REVIEW
APPROVED
REJECTED
ACTIVE
CLOSED
```

Create a professional EMI calculator.

---

## 14. Fixed Deposits

Implement Fixed Deposit functionality.

Features:

- create FD
- principal amount
- tenure
- interest rate
- maturity date
- maturity amount
- status
- premature withdrawal request

Provide FD maturity calculations.

---

## 15. Recurring Deposits

Implement RD functionality.

Features:

- monthly installment
- tenure
- interest rate
- maturity amount
- next installment date
- payment history
- status

---

## 16. Notifications

Create a notification center.

Notifications for:

- successful transfer
- failed transfer
- login
- password change
- beneficiary change
- account status change
- loan status
- FD maturity
- security alerts

Support:

- read/unread
- mark as read
- notification count
- notification history

---

## 17. Audit Logging

Implement a serious audit system.

Record important actions:

```text
LOGIN
LOGOUT
FAILED_LOGIN
PASSWORD_CHANGED
PROFILE_UPDATED
BENEFICIARY_CREATED
BENEFICIARY_DELETED
TRANSFER_CREATED
TRANSFER_COMPLETED
TRANSFER_FAILED
ACCOUNT_CREATED
ACCOUNT_SUSPENDED
ADMIN_ACTION
```

Audit logs should include:

- user
- action
- timestamp
- IP address where appropriate
- user agent where appropriate
- entity
- entity ID
- metadata

Do not expose sensitive secrets in logs.

---

## 18. Admin Dashboard

Create a separate professional admin interface.

Include:

- total customers
- total accounts
- total deposits
- total withdrawals
- transaction volume
- active users
- pending approvals
- suspicious activity alerts
- branch statistics
- system health

Charts:

- transaction volume
- deposits vs withdrawals
- customer growth
- account distribution
- loan portfolio
- monthly activity

Admin tables must support:

- search
- filters
- pagination
- sorting
- bulk actions where safe
- confirmation dialogs

---

## 19. Branch Management

Implement branch management.

Branch fields:

- branch code
- branch name
- address
- phone
- email
- manager
- status

Admins/managers can view branch-level statistics.

---

## 20. Customer Management

Employee/admin interface should allow:

- customer search
- customer profile
- account list
- transaction history
- KYC status
- account status
- support requests
- audit history where authorized

Do not expose unnecessary sensitive information.

---

## 21. KYC Architecture

Create a KYC module suitable for a project environment.

Include:

- KYC status
- verification state
- submitted information
- review state
- rejection reason
- verification timestamp

Statuses:

```text
NOT_SUBMITTED
PENDING
VERIFIED
REJECTED
```

Do not implement real government identity verification unless an actual compliant provider is integrated.

Use mock/project-safe KYC data.

---

## 22. Support System

Create a support ticket system.

Customers can:

- create ticket
- select category
- enter message
- attach supported files if implemented
- view ticket status
- reply

Employees can:

- view tickets
- assign tickets
- reply
- update status

Statuses:

```text
OPEN
IN_PROGRESS
WAITING_FOR_CUSTOMER
RESOLVED
CLOSED
```

---

## 23. Search

Implement global search where appropriate.

Search:

- customers
- accounts
- transactions
- beneficiaries
- support tickets

Apply authorization to every search endpoint.

---

## 24. UI/UX Requirements

The UI must look like a modern premium banking application.

Do NOT make it look like a generic Bootstrap dashboard.

Use:

- shadcn/ui
- Radix UI
- Tailwind CSS
- Lucide icons
- subtle animations
- clean typography
- excellent spacing
- cards
- tables
- tabs
- dialogs
- dropdowns
- command palette
- tooltips
- badges
- progress indicators
- skeleton loaders
- empty states
- error states
- confirmation dialogs

Design principles:

- minimal
- premium
- trustworthy
- professional
- accessible
- responsive
- clean

---

## 25. Responsive Design

The application must work properly on:

- desktop
- laptop
- tablet
- mobile

Do not simply shrink the desktop UI.

Create mobile-specific layouts where necessary.

Tables should become usable mobile cards or horizontally scrollable containers.

Navigation should become a mobile navigation system.

---

## 26. Theme

Support:

- light mode
- dark mode
- system preference

Create a consistent design token system.

Do not use excessive gradients.

Avoid excessive animations.

Use animations only when they improve usability.

---

## 27. Accessibility

Follow accessibility best practices.

Implement:

- keyboard navigation
- focus states
- accessible dialogs
- semantic HTML
- ARIA labels where needed
- sufficient contrast
- screen-reader-friendly controls

---

## 28. Frontend Architecture

Use a clean structure such as:

```text
frontend/
├── src/
│   ├── components/
│   ├── pages/
│   ├── layouts/
│   ├── features/
│   ├── hooks/
│   ├── services/
│   ├── api/
│   ├── schemas/
│   ├── types/
│   ├── utils/
│   ├── stores/
│   ├── routes/
│   └── main.tsx
├── public/
└── package.json
```

Use feature-based organization where practical.

Do not create one giant `App.tsx`.

---

## 29. API Design

Create REST APIs such as:

```text
/api/v1/auth
/api/v1/users
/api/v1/customers
/api/v1/accounts
/api/v1/transactions
/api/v1/transfers
/api/v1/beneficiaries
/api/v1/cards
/api/v1/loans
/api/v1/fixed-deposits
/api/v1/recurring-deposits
/api/v1/notifications
/api/v1/statements
/api/v1/support
/api/v1/admin
/api/v1/audit
```

Use:

- proper HTTP methods
- status codes
- request validation
- response schemas
- pagination
- filtering
- sorting
- consistent error format

---

## 30. API Documentation

FastAPI should automatically provide:

- Swagger UI
- OpenAPI specification
- ReDoc

Document all important endpoints.

---

## 31. Security

Apply security best practices throughout the application.

Implement where appropriate:

- password hashing
- JWT security
- refresh-token rotation/revocation strategy
- RBAC
- CORS configuration
- rate limiting
- input validation
- SQL injection protection
- XSS protection
- CSRF considerations
- secure headers
- authentication checks
- authorization checks
- account ownership checks
- secure error messages
- secret management
- audit logging

Never:

- hardcode secrets
- commit `.env`
- store plaintext passwords
- trust frontend authorization
- expose database credentials
- expose private keys
- return sensitive information unnecessarily

---

## 32. Financial Safety

The backend must be the source of truth.

Never calculate authoritative account balances solely in React.

Never trust frontend-provided values such as:

```text
balance
role
user_id
account_id
permissions
```

without server-side verification.

Every financial operation must be authorized on the backend.

Use database transactions for financial operations.

---

## 33. Error Handling

Create consistent API errors.

Example:

```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_FUNDS",
    "message": "The account does not have sufficient available balance."
  }
}
```

Frontend should show friendly messages.

Do not expose stack traces to users.

---

## 34. Loading / Empty / Error States

Every important page must handle:

```text
Loading
Success
Empty
Error
Unauthorized
Forbidden
```

Do not leave blank screens.

Use skeleton components.

---

## 35. Testing

Create backend tests using:

- pytest
- FastAPI TestClient
- database test setup

Test:

- authentication
- authorization
- account creation
- deposits
- withdrawals
- transfers
- insufficient balance
- concurrent transaction scenarios where practical
- duplicate transaction prevention
- beneficiary permissions
- role permissions
- loan calculations
- FD calculations
- API validation

Frontend tests should cover important user flows.

Also add end-to-end tests for critical workflows where practical.

---

## 36. Seed Data

Create a development seed script.

Include demo accounts for:

```text
Admin
Branch Manager
Bank Employee
Customer
```

Do NOT use real people's information.

Use clearly fictional demo data.

Example:

```text
admin@example.com
manager@example.com
employee@example.com
customer@example.com
```

Document demo credentials securely in development documentation only.

---

## 37. Environment Configuration

Create:

```text
.env.example
```

Example variables:

```env
DATABASE_URL=
JWT_SECRET=
JWT_REFRESH_SECRET=
ACCESS_TOKEN_EXPIRE_MINUTES=
REFRESH_TOKEN_EXPIRE_DAYS=
CORS_ORIGINS=
ENVIRONMENT=
```

Never commit real secrets.

---

## 38. Docker

Create Docker configuration for deployment.

Include:

```text
Dockerfile
docker-compose.yml
.dockerignore
```

Development environment should be easy to start.

Example:

```bash
docker compose up --build
```

Use PostgreSQL in Docker for local development.

Production should support an external managed PostgreSQL database.

---

## 39. Deployment Architecture

The project must be deployment-ready for:

### Frontend

Vercel

### Backend

Render

### Database

Neon PostgreSQL or Supabase PostgreSQL

### Source Control

GitHub

Do NOT require XAMPP.

Final production architecture:

```text
                    Internet
                       │
                       ▼
                ┌─────────────┐
                │   Vercel    │
                │ React/Vite  │
                └──────┬──────┘
                       │ HTTPS
                       ▼
                ┌─────────────┐
                │   Render    │
                │   FastAPI   │
                └──────┬──────┘
                       │
                       │ SSL
                       ▼
                ┌─────────────┐
                │    Neon     │
                │ PostgreSQL  │
                └─────────────┘
```

Configure production CORS correctly.

Do not use `*` for production CORS if authenticated requests require restricted origins.

---

## 40. CI/CD

Create GitHub Actions for:

- backend tests
- frontend build
- linting
- type checking
- basic security checks

Do not automatically deploy broken builds.

---

## 41. Code Quality

The code must be:

- clean
- modular
- readable
- maintainable
- typed
- documented where necessary
- DRY
- production-oriented

Avoid:

- duplicated code
- magic numbers
- giant files
- unnecessary dependencies
- unused imports
- dead code
- placeholder implementations

Do not create fake functionality just to make a button appear functional.

If a feature cannot safely be implemented, clearly document it instead of pretending it works.

---

## 42. Logging

Implement useful application logging.

Log:

- server startup
- authentication events
- errors
- important system events
- transaction processing events

Never log:

- passwords
- JWT secrets
- OTP values
- CVV
- full sensitive financial credentials

---

## 43. Performance

Optimize:

- database queries
- indexes
- pagination
- API response sizes
- frontend bundle
- unnecessary requests

Use TanStack Query caching appropriately.

Avoid fetching thousands of transactions at once.

Use server-side pagination.

---

## 44. Professional Pages

Create polished pages for at least:

```text
/login
/register
/forgot-password
/reset-password

/dashboard

/accounts
/accounts/:id

/transactions
/transactions/:id

/transfers
/transfers/new

/beneficiaries

/cards

/loans
/loans/:id
/loans/calculator

/fixed-deposits
/recurring-deposits

/statements

/notifications

/profile
/security

/support
/support/:id

/admin
/admin/users
/admin/customers
/admin/accounts
/admin/transactions
/admin/branches
/admin/reports
/admin/audit-logs
/admin/settings
```

---

## 45. Landing/Login Experience

Create a polished login experience.

It should include:

- banking branding
- clean form
- email/username
- password
- show/hide password
- remember/session option where appropriate
- forgot password
- login loading state
- validation
- error handling
- security messaging

Do not make it visually cluttered.

---

## 46. Dashboard Navigation

Create a professional sidebar.

Example:

```text
Overview

Banking
  Accounts
  Transfers
  Transactions
  Beneficiaries

Financial Products
  Loans
  Fixed Deposits
  Recurring Deposits
  Cards

Services
  Statements
  Support

Account
  Profile
  Security
  Notifications

Administration
  Users
  Customers
  Accounts
  Transactions
  Reports
  Audit Logs
  Settings
```

Only display navigation items the current role is authorized to use.

---

## 47. Charts

Use Recharts.

Create useful charts rather than decorative charts.

Examples:

- monthly income/expense
- transaction volume
- account balance trend
- deposits vs withdrawals
- loan repayment
- branch statistics

Charts must work with real API data.

---

## 48. Tables

Use professional data tables.

Features:

- pagination
- sorting
- filtering
- search
- column visibility where appropriate
- responsive behavior
- row actions
- loading state
- empty state

---

## 49. Confirmation & Sensitive Actions

For sensitive actions:

- transfer
- delete beneficiary
- block card
- suspend account
- reset password
- admin operations

Always require appropriate confirmation.

Use clear language.

---

## 50. Notifications UX

Use:

- toast notifications for immediate actions
- notification center for persistent events
- badges for unread notifications

Do not rely only on toast messages for important financial events.

---

## 51. Internationalization Preparation

Structure currency and formatting so the system can later support multiple currencies.

For the initial version:

```text
Currency: INR
Symbol: ₹
```

Use proper locale formatting.

Do not hardcode currency formatting everywhere.

---

## 52. Documentation

Create:

```text
README.md
ARCHITECTURE.md
API.md
DATABASE.md
SECURITY.md
DEPLOYMENT.md
CONTRIBUTING.md
```

README must explain:

- project
- features
- technology stack
- requirements
- installation
- environment variables
- local development
- database setup
- migrations
- seed data
- testing
- production build
- deployment

---

## 53. Deployment Documentation

`DEPLOYMENT.md` must explain step-by-step:

### GitHub

How to push the project.

### Neon

How to create PostgreSQL database.

### Render

How to deploy FastAPI.

Include:

- build command
- start command
- environment variables

### Vercel

How to deploy React.

Include:

- build command
- output directory
- environment variables

Explain how to configure:

```text
VITE_API_URL
```

and production CORS.

---

## 54. Local Development

The project should be easy to run.

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Backend:

```bash
cd backend
python -m venv .venv
```

Windows:

```bash
.venv\Scripts\activate
```

Then:

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Database can be started through Docker:

```bash
docker compose up -d postgres
```

---

## 55. Migration System

Use Alembic.

Provide commands/documentation for:

```bash
alembic upgrade head
```

and creating migrations.

Never require manually editing production database tables.

---

## 56. Existing Project Migration

IMPORTANT:

I already have an existing Python banking management project.

First inspect the existing project.

Do NOT immediately delete or overwrite it.

Identify:

- existing functionality
- existing database
- existing models
- existing business logic
- reusable code
- missing functionality
- architectural problems

Then migrate useful functionality into the new architecture.

If existing functionality conflicts with the new architecture, prioritize correctness, security, maintainability, and the requirements in this specification.

Preserve useful business logic where practical.

---

## 57. Development Process

Follow this order:

### Phase 1

Inspect the existing project.

Create an architecture assessment.

### Phase 2

Design:

- folder structure
- database schema
- API structure
- authentication architecture
- RBAC

### Phase 3

Build backend foundation.

### Phase 4

Build database models and migrations.

### Phase 5

Build authentication and authorization.

### Phase 6

Build banking operations.

### Phase 7

Build React design system.

### Phase 8

Build customer dashboard.

### Phase 9

Build admin dashboard.

### Phase 10

Implement advanced banking modules.

### Phase 11

Testing.

### Phase 12

Docker and deployment configuration.

### Phase 13

Documentation.

---

## 58. Important Rule: Do Not Fake Features

The application must be genuinely functional.

For every UI button:

- connect it to an actual operation, OR
- clearly mark the feature as unavailable/not implemented.

Do not create fake success messages.

Do not hardcode transaction results.

Do not hardcode balances in production code.

Do not use mock data after the real API is implemented.

Seed data is acceptable for development/demo purposes.

---

## 59. Visual Quality Standard

The final UI should feel like a premium financial SaaS/banking product.

Think:

```text
Modern
Minimal
Professional
Trustworthy
Fast
Clean
Responsive
Accessible
```

Use consistent:

- spacing
- typography
- icons
- borders
- radius
- shadows
- colors
- component states

Avoid:

- excessive gradients
- excessive glassmorphism
- giant hero sections
- unnecessary animations
- childish colors
- clutter
- generic template appearance

---

## 60. Final Acceptance Criteria

The project is considered complete only when:

- frontend builds successfully
- backend starts successfully
- database migrations work
- authentication works
- authorization works
- customer dashboard works
- admin dashboard works
- accounts work
- transactions work
- transfers work
- beneficiary management works
- statements work
- notifications work
- audit logging works
- financial calculations work
- critical financial operations are transactional
- validation works
- error handling works
- responsive UI works
- tests pass
- Docker setup works
- production environment variables are documented
- Vercel deployment is documented
- Render deployment is documented
- PostgreSQL deployment is documented
- no secrets are committed
- no obvious placeholder functionality remains

---

## 61. Final Deliverable

At the end, provide:

1. Complete source code.
2. Working frontend.
3. Working backend.
4. PostgreSQL schema/migrations.
5. Seed data.
6. API documentation.
7. Tests.
8. Docker configuration.
9. GitHub Actions configuration.
10. `.env.example` files.
11. README.
12. Deployment guide.
13. Security documentation.
14. Architecture documentation.

Before declaring the project complete, run:

- frontend build
- backend tests
- frontend tests
- lint
- type checking
- database migration
- production build

Fix errors instead of merely reporting them.

---

# FINAL INSTRUCTION

Do not stop after generating a plan.

Inspect the existing project, implement the architecture, build the features, test them, fix problems, and leave the repository in a clean, runnable, deployment-ready state.

Prioritize:

1. Security
2. Financial correctness
3. Data integrity
4. Authorization
5. Reliability
6. Maintainability
7. UX/UI quality
8. Performance
9. Deployment readiness

The final application should be a fully functional educational/prototype banking platform with production-quality engineering practices, while clearly avoiding claims that it is suitable for handling real regulated banking operations without the required compliance, infrastructure, security audits, and financial integrations.
