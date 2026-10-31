# Brightloop — Subscription Management System

**One unified platform to run plans, subscriptions, and recurring billing in one place.**

Brightloop Software sells everything on subscription: business software billed monthly or yearly, add-ons customers toggle on and off, and products in variants (e.g., selecting the Odoo brand adds 560 to the price). Customers range from small shops on monthly plans to large companies on yearly contracts.

Today this is managed in spreadsheets — renewals are tracked by memory, invoices are typed by hand, payments are matched against bank statements manually, and revenue reports are assembled quarterly by hand. This project replaces all of that with a single digital backbone for the subscription business.

---

## What it does

| Capability | Description |
|------------|-------------|
| **Products & Plans** | Admin creates products (name, type, sales price, cost price, notes) with variants that adjust price. Plans have billing frequency (daily/weekly/monthly/yearly), minimum quantity, availability dates, and end-of-term behavior (auto-close, close early, pause, renew). |
| **Quotations → Subscriptions** | Sales reps start from quotation templates (valid for a set number of days) and turn them into subscriptions. Each subscription has a number, customer, plan, start/expiry date, payment terms, and line items. Lifecycle: Draft → Quotation → Confirmed → Active → Closed. |
| **Automated Billing** | On billing day, invoices are auto-created from due subscriptions — pre-filled with customer details, lines, taxes, totals. Nothing billed twice or skipped. Invoice lifecycle: Draft → Confirmed → Paid. |
| **Discounts** | Admin-only discount rules (fixed or percentage, min purchase/qty, start/end dates, usage limit). Applied automatically to the next invoice; stop on expiry or limit exhaustion. |
| **Payments** | Record payments (method, amount, date, note) against invoices. View paid vs outstanding; identify overdue. |
| **Reporting** | One place to see active subscriptions, revenue, payments, overdue invoices — with filters and a summary view. Every page responds in under 2 seconds at thousands-of-subscriptions scale. |

---

## Users & Access

- **Admin** — Full system control. Sets up products, plans, taxes, discounts. Only role that can add new staff members.
- **Staff** — Day-to-day customer operations with limited access.
- **Customer** — Portal showing only their own subscriptions and invoices. Self-service — no email needed.

**Auth:** One account per email. Password must be >8 characters with uppercase, lowercase, and special character. Password reset via link sent to registered email.

---

## Tech Stack (100% free / open source)

| Layer | Technology |
|-------|------------|
| Frontend | Next.js (App Router), React 18, TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Backend | NestJS (Node.js) |
| Database | PostgreSQL 15+ |
| Cache / Jobs | Redis + BullMQ |
| Email | Nodemailer + self-hosted SMTP |
| Auth | NextAuth.js + JWT |
| Container | Docker + Docker Compose |
| CI/CD | GitHub Actions |
| Observability | Prometheus + Grafana |
| Object Storage | MinIO (self-hosted) |
| SSL | Let's Encrypt (Certbot) |

Full details: [`Documents/Tech_Stack.md`](Documents/Tech_Stack.md)

---

## Project Structure

```
Brightloop/
├── .gitignore
├── README.md
├── Documents/              # Production documentation
│   ├── PRD.md
│   ├── SRS.md
│   ├── Appflow.md
│   ├── Architecture.md
│   ├── Tech_Stack.md
│   ├── Backend_Schema.md
│   ├── Rules.md
│   ├── Testing.md
│   ├── TRD.md
│   ├── Implementation_Plan.md
│   └── Sitemap.md
├── Problem Statement/
│   └── Subscription_Management_System.pdf
└── (src/ — application code, to be scaffolded)
```

---

## Documentation

All production-level specs live under `Documents/`:

1. **PRD.md** — Product goals, users, scope, success metrics
2. **SRS.md** — Functional & non-functional requirements, acceptance criteria
3. **Appflow.md** — User journeys and state machines
4. **Architecture.md** — System design, component diagram, data flows
5. **Tech_Stack.md** — Full free-stack specification
6. **Backend_Schema.md** — 17-table relational schema with indexes
7. **Rules.md** — Business rules engine (tax, discounts, lifecycle)
8. **Testing.md** — Test strategy (unit, integration, E2E, performance)
9. **TRD.md** — API contract, infrastructure, deployment
10. **Implementation_Plan.md** — 16-week phased roadmap
11. **Sitemap.md** — Route map for Admin, Staff, Customer portal

---

## Roadmap (16 weeks)

| Phase | Weeks | Focus |
|-------|-------|-------|
| M1 Foundation | 1–2 | Auth, CI/CD, local env, core data model |
| M2 Catalog & Quotes | 3–5 | Products, plans, variants, templates, subscriptions |
| M3 Billing & Invoices | 6–8 | Billing worker, tax, invoice lifecycle, idempotency |
| M4 Discounts & Payments | 9–11 | Discount rules, auto-apply, payments, overdue view |
| M5 Portal & Reports | 12–14 | Customer portal, finance dashboard, <2s pages |
| M6 Launch | 15–16 | Hardening, monitoring, production deploy |

See [`Documents/Implementation_Plan.md`](Documents/Implementation_Plan.md)

---

## Getting Started

1. Clone the repository.
2. Copy `.env.example` to `.env` and fill in database, Redis, and email settings.
3. Run `docker-compose up` to start PostgreSQL, Redis, and the app.
4. Run migrations and seed data.
5. Visit `http://localhost:3000` for the frontend and `http://localhost:4000/api` for the backend.

*(Application source is to be scaffolded from the specs in `Documents/`.)*

---

## License

Private project — Brightloop Software.
