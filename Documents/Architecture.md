# System Architecture

**Product:** Subscription Management System  
**Version:** 1.0  

---

## 1. Architectural Style

Layered monolithic web application with clear separation between presentation, application logic, and data layers. Designed for internal users (Admin, Staff) and a customer portal, with a scheduled billing engine as a background worker.

**Justification:** Brightloop is a single business with one admin-controlled platform. A layered monolith reduces operational complexity, guarantees transactional consistency across subscriptions/invoices/payments, and satisfies the sub-2-second page requirement at thousands-of-subscriptions scale with proper indexing and caching.

---

## 2. High-Level Component Diagram (Text)

```
┌─────────────────┐      ┌─────────────────────────────────────┐
│  Client Browser │◄────►│  Load Balancer / Reverse Proxy      │
│  (Admin/Staff   │      │  (SSL termination, rate limiting)   │
│   /Customer)    │      └─────────────────────────────────────┘
└─────────────────┘                    │
                                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Application Layer                           │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────┐   │
│  │  Admin Web   │  │ Staff Web    │  │ Customer Portal Web │   │
│  │  (Next.js/   │  │ (Next.js/    │  │ (Next.js/React)     │   │
│  │   React)     │  │   React)     │  │                     │   │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬──────────┘   │
│         │                 │                     │              │
│         └─────────────────┼─────────────────────┘              │
│                           ▼                                     │
│                    ┌────────────────┐                           │
│                    │  API Gateway   │                           │
│                    │  (REST + Auth) │                           │
│                    └──────┬─────────┘                           │
│                           │                                     │
│         ┌─────────────────┼─────────────────┐                   │
│         ▼                 ▼                 ▼                   │
│  ┌────────────┐  ┌────────────┐  ┌─────────────┐              │
│  │ Auth Svc   │  │ Billing Svc│  │ Core Svc    │              │
│  │ (login,    │  │ (invoices, │  │ (products,  │              │
│  │  reset,    │  │  payments, │  │  plans,     │              │
│  │  roles)    │  │  discounts)│  │  subs,      │              │
│  └─────┬──────┘  └─────┬──────┘  │  reports)   │              │
│        │               │         └──────┬──────┘              │
│        └───────────────┼────────────────┘                     │
│                        ▼                                      │
│                 ┌─────────────┐                               │
│                 │  Message    │                               │
│                 │  Queue      │                               │
│                 │  (Redis/    │                               │
│                 │  RabbitMQ)  │                               │
│                 └──────┬──────┘                               │
│                        │                                       │
│                        ▼                                       │
│                 ┌─────────────┐                               │
│                 │ Billing     │                               │
│                 │ Worker      │                               │
│                 │ (cron)      │                               │
│                 └──────┬──────┘                               │
│                        ▼                                       │
└──────────────────────┼─────────────────────────────────────────┘
                       ▼
              ┌─────────────────┐
              │ Relational DB   │
              │ (PostgreSQL)    │
              │ + Redis Cache   │
              └─────────────────┘
                       │
              ┌────────▼─────────┐
              │ Email Service    │
              │ (reset links)    │
              └──────────────────┘
```

---

## 3. Layer Descriptions

### 3.1 Presentation Layer
- **Admin Web:** Internal admin UI for products, plans, taxes, discounts, staff, reports.
- **Staff Web:** Internal staff UI for quotes, subscriptions, invoices, payments.
- **Customer Portal:** Customer-facing UI for own subscriptions, invoices, account settings.
- All three are React/Next.js applications consuming the same REST API.

### 3.2 API Gateway / Authentication Layer
- REST endpoints with JWT-based authentication.
- Role-based access control enforced per route (Admin / Staff / Customer).
- Rate limiting, request validation, error standardization.

### 3.3 Service Layer (Business Logic)
- **Auth Service:** Registration, login, password reset via email, session management.
- **Catalog Service:** Products, variants, plans, availability windows.
- **Subscription Service:** Subscription lifecycle, state transitions, lines.
- **Quotation Service:** Templates, validity, quote-to-subscription conversion.
- **Billing Service:** Invoice generation, tax calculation, idempotency, invoice lifecycle.
- **Discount Service:** Discount rules, auto-application, expiry/limit enforcement.
- **Payment Service:** Payment recording, paid/outstanding status.
- **Reporting Service:** Aggregated queries for active subs, revenue, overdue invoices.

### 3.4 Background Worker Layer
- **Billing Worker:** Cron-triggered on billing day. Queries due subscriptions, generates invoices idempotently, enqueues email/send tasks.
- Runs independently of request/response cycle to avoid blocking UI.

### 3.5 Data Layer
- **Primary:** PostgreSQL (relational, ACID-compliant for billing consistency).
- **Cache:** Redis (session cache, frequently accessed plans/products, report aggregates).
- **Email:** Third-party SMTP or transactional email provider for password reset links.

---

## 4. Data Flow Scenarios

### 4.1 Billing Day Flow
1. Scheduler fires Billing Worker.
2. Worker reads subscriptions where `next_billing_date = today` and `status = Active`.
3. For each, creates `Invoice` in Draft state with lines, taxes, totals.
4. Idempotency key: `(subscription_id, billing_period)` — skip if invoice exists.
5. Worker commits transaction per subscription (or batch with savepoints).
6. Staff confirms invoices via API.

### 4.2 Discount Application Flow
1. Invoice generated in Draft state.
2. Billing Service checks active Discounts matching invoice's subscription/products.
3. Valid discount (within dates, usage limit remaining) applied to invoice total.
4. Discount usage counter incremented atomically.
5. Invoice saved; discount no longer applicable after limit/expiry.

### 4.3 Customer Portal Access Flow
1. Customer logs in → JWT issued with `role=customer` and `customer_id`.
2. Every API request includes JWT.
3. Middleware resolves `customer_id`, scopes all queries to that customer's subscriptions/invoices.
4. Cross-customer data access returns 403.

---

## 5. Infrastructure & Deployment

| Component | Technology | Notes |
|-----------|------------|-------|
| Frontend | Next.js / React | SSR for reports, static for portal pages |
| API | Node.js / NestJS or Python / FastAPI | REST, JWT auth |
| Database | PostgreSQL | Primary, ACID |
| Cache | Redis | Sessions, report caching |
| Worker | BullMQ / Celery / Cron | Billing job, idempotent |
| Email | SMTP / SendGrid / AWS SES | Password reset links |
| Hosting | Docker + Kubernetes or single VM | Depends on scale |
| CI/CD | GitHub Actions | Test, build, deploy |

---

## 6. Non-Functional Design Decisions

| Requirement | Design Decision |
|-------------|-----------------|
| Sub-2s page load | Indexed queries, Redis cache for reports, pagination, SSR for heavy dashboards |
| No duplicate invoices | Idempotency key `(subscription_id, billing_period)` + DB unique constraint |
| Role enforcement | Middleware + service-layer authorization on every mutation |
| Password security | bcrypt/argon2 hashing, reset links time-limited & single-use |
| Auditability | `audit_logs` table records user, action, entity, timestamp, before/after values |

---

## 7. Future Considerations (Out of v1)

- Microservice extraction if team/org grows.
- Multi-tenant support for multiple Brightloop-like companies.
- Payment gateway webhooks (Stripe/Razorpay) replacing manual payment entry.
- Real-time notifications (WebSockets) for invoice status.
