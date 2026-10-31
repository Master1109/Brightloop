# Brightloop Backend API

A standalone NestJS + TypeScript REST API backend for the Brightloop subscription & billing platform.

## Features
- **Authentication**: JWT-based session tokens with role-based access (`ADMIN`, `STAFF`, `CUSTOMER`).
- **Subscription Management**: Full lifecycle (Draft → Quotation → Confirmed → Active → Closed), renewals, and audit logging.
- **Automated Billing**: Catch-up billing runs, integer/currency calculations, advisory locking, and BullMQ background workers.
- **Invoicing & PDF Generation**: PDF invoice streaming via `pdfkit`.
- **Payment Processing**: Partial and full payment tracking with overpayment protection.
- **Database Support**: Built-in in-memory PostgreSQL (`pg-mem`) for zero-setup local development, with full PostgreSQL production support.
- **CORS Enabled**: Ready to connect with any separated frontend (Next.js, Vite, React, etc.).

---

## Directory Structure
```
D:\Brightloop backend
├── database/
│   └── schema.sql        # PostgreSQL database schema (tables & indexes)
├── scripts/
│   └── integration.mjs   # End-to-end integration and API tests
├── server/
│   ├── db.ts             # Database connection (pg-mem / pg.Pool) & seed data
│   ├── domain.ts         # Financial arithmetic, billing dates & transitions
│   ├── domain.test.ts    # Unit tests for domain logic
│   └── main.ts           # NestJS API endpoints, BullMQ workers & auth
├── .env.example          # Environment variables template
├── .gitignore            # Git ignore file for backend
├── package.json          # Backend dependencies and scripts
├── tsconfig.json         # TypeScript configuration
└── README.md
```

---

## Quick Start

### 1. Requirements
- Node.js 22 or newer

### 2. Install Dependencies
```sh
npm install
```

### 3. Environment Configuration
Copy `.env.example` to `.env`:
```sh
cp .env.example .env
```
*(On Windows PowerShell: `Copy-Item .env.example .env`)*

- **In-Memory Development Mode (Default)**: If `DATABASE_URL` is omitted or empty, the backend automatically uses **`pg-mem`** (in-memory PostgreSQL) and pre-seeds sample customer and subscription data.
- **Real PostgreSQL**: Set `DATABASE_URL=postgres://user:password@localhost:5432/brightloop` and run `database/schema.sql` on your PostgreSQL database.

### 4. Run Development Server
```sh
npm run dev
```
The API server starts at: **http://localhost:4000**

---

## Default Development Accounts
*(Pre-seeded when running with pg-mem in development mode)*

| Role | Email | Password |
| --- | --- | --- |
| **Admin** | `admin@brightloop.local` | `Brightloop!2026` |
| **Staff** | `staff@brightloop.local` | `Brightloop!2026` |
| **Customer** | `customer@brightloop.local` | `Brightloop!2026` |

---

## Testing

```sh
# Run unit tests
npm test

# Run API integration test (requires API running at http://localhost:4000)
npm run test:integration
```

---

## API Summary

- `GET /health`: Health check and mode status
- `POST /auth/login`: User sign in (returns JWT token and user profile)
- `POST /auth/register`: Customer registration
- `POST /auth/forgot`: Password reset link request
- `POST /auth/reset`: Password reset confirmation
- `GET /api/bootstrap`: Full workspace data (records, team, current user)
- `GET /api/records/:kind`: Paginated catalog/financial records
- `POST /api/records/:kind`: Create record (products, plans, subscriptions, payments, etc.)
- `POST /api/records/:kind/:id/action`: Lifecycle actions (Confirm, Activate, Renew, etc.)
- `GET /api/invoices/:id/pdf`: Downloadable PDF invoice
- `POST /api/billing/run`: Manual trigger for billing pass (Admin only)
