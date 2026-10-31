# Technical Requirements Document (TRD)

**Product:** Subscription Management System  
**Version:** 1.0  

This TRD consolidates the technical contract: API surface, infrastructure, deployment, and operational requirements for building and running the system in production.

---

## 1. API Contract Overview

All backend services expose REST APIs over HTTPS. JSON request/response. Authentication via JWT Bearer token. Role-based authorization enforced server-side.

### Base URL
```
https://api.brightloop.internal/v1
```

### Auth Endpoints
| Method | Path | Access | Description |
|--------|------|--------|-------------|
| POST | /auth/register | Public | Register customer account |
| POST | /auth/login | Public | Login; returns JWT |
| POST | /auth/forgot-password | Public | Send reset link to email |
| POST | /auth/reset-password | Public | Set new password via token |
| GET | /auth/me | Auth (any) | Current user profile |

### Product Endpoints
| Method | Path | Access | Description |
|--------|------|--------|-------------|
| GET | /products | Auth (any) | List products |
| POST | /products | Admin | Create product |
| GET | /products/:id | Auth (any) | Get product |
| PATCH | /products/:id | Admin | Update product |
| DELETE | /products/:id | Admin | Soft-delete product |

### Plan Endpoints
| Method | Path | Access | Description |
|--------|------|--------|-------------|
| GET | /plans | Auth (any) | List plans |
| POST | /plans | Admin | Create plan |
| PATCH | /plans/:id | Admin | Update plan |

### Subscription Endpoints
| Method | Path | Access | Description |
|--------|------|--------|-------------|
| GET | /subscriptions | Auth (staff/admin) | List subscriptions (staff: all; customer: own) |
| POST | /subscriptions | Staff/Admin | Create subscription |
| GET | /subscriptions/:id | Auth (scoped) | Get subscription |
| PATCH | /subscriptions/:id/status | Staff/Admin | Advance lifecycle state |

### Invoice Endpoints
| Method | Path | Access | Description |
|--------|------|--------|-------------|
| GET | /invoices | Auth (staff/admin/customer-own) | List invoices |
| POST | /invoices | Staff/Admin | Create invoice (manual) |
| PATCH | /invoices/:id/confirm | Staff/Admin | Confirm draft invoice |
| PATCH | /invoices/:id/cancel | Staff/Admin | Cancel invoice |
| POST | /invoices/:id/send | Staff/Admin | Send invoice to customer |
| GET | /invoices/:id/print | Auth | Printable invoice view |

### Payment Endpoints
| Method | Path | Access | Description |
|--------|------|--------|-------------|
| POST | /payments | Staff/Admin | Record payment against invoice |
| GET | /payments | Staff/Admin | List payments |

### Discount Endpoints
| Method | Path | Access | Description |
|--------|------|--------|-------------|
| POST | /discounts | Admin | Create discount rule |
| PATCH | /discounts/:id | Admin | Update discount |

### Reporting Endpoints
| Method | Path | Access | Description |
|--------|------|--------|-------------|
| GET | /reports/dashboard | Staff/Admin | Active subs, revenue, payments, overdue |
| GET | /reports/overdue | Staff/Admin | Overdue invoices list |

---

## 2. Response Standards

All responses follow:
```json
{
  "success": boolean,
  "data": any,
  "error": { "code": string, "message": string } | null,
  "meta": { "page", "limit", "total" } | null
}
```

HTTP status codes: 200 OK, 201 Created, 204 No Content, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 409 Conflict (idempotency), 422 Validation Error, 429 Too Many Requests, 500 Internal Server Error.

---

## 3. Infrastructure Requirements

| Component | Spec | Notes |
|-----------|------|-------|
| Application | Node.js/Python runtime | Containerized via Docker |
| Database | PostgreSQL 15+ | Managed, daily backups, PITR |
| Cache | Redis 7 | Sessions, rate-limit counters, report cache |
| Object Storage | S3-compatible | Invoice PDFs, report exports |
| Load Balancer | TLS termination | HTTPS, HSTS, rate limiting |
| Background Worker | Cron + queue | Billing job runs daily |
| Monitoring | Prometheus + Grafana | Uptime, billing job status, page latency |
| Logging | Structured JSON | Centralized, correlated by request ID |

---

## 4. Environment Strategy

| Environment | Purpose | Data |
|-------------|---------|------|
| Local | Developer workstation | Docker Compose, seeded fixtures |
| Preview | PR review | Ephemeral, seeded fixtures |
| Staging | Pre-production QA | Anonymized production-like data |
| Production | Live users | Real data, encrypted at rest/in transit |

---

## 5. Deployment

- CI: lint → unit tests → build Docker image → push registry
- CD: deploy to staging → run E2E → promote to production (blue/green or rolling)
- Migrations: run as part of deployment (Flyway / Prisma migrations / Alembic)
- Feature flags: optional, for risky billing-behavior toggles

---

## 6. Backup & Disaster Recovery

- PostgreSQL: daily snapshot + continuous WAL archiving (PITR)
- Redis: RDB/AOF persistence
- Object storage: versioning enabled
- RTO target: 4 hours; RPO target: 1 hour
- Restore drills: quarterly

---

## 7. Security Requirements

| Control | Implementation |
|---------|----------------|
| TLS | 1.2+ everywhere; HSTS enabled |
| Password hashing | bcrypt / argon2id |
| Secrets | Environment variables; vault in prod (AWS Secrets Manager / Doppler) |
| Session | JWT access (short-lived) + refresh token rotation |
| CSRF | SameSite=Strict/Lax cookies + CSRF tokens |
| Rate limiting | Redis sliding window on /auth endpoints |
| Dependency scan | CI block on high/critical vulnerabilities |
| Audit logging | All state changes logged immutably |

---

## 8. Observability

| Metric | Alert Threshold |
|--------|-----------------|
| Billing job failure | Any failure → immediate alert |
| Invoice duplication | > 0 duplicates in 24h → alert |
| Page load p95 | > 2 seconds → warning |
| 5xx error rate | > 1% → alert |
| Auth failures | Spike → alert |

---

## 9. Production Readiness Checklist

- [ ] Database migrations tested on staging
- [ ] Billing job idempotency verified
- [ ] HTTPS enforced
- [ ] Backups automated and tested
- [ ] Alerting configured for billing failures
- [ ] Load test passed at 5,000 subscriptions, <2s pages
- [ ] Penetration test / security review completed
- [ ] Runbook for billing job recovery documented
