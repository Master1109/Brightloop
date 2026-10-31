# Technology Stack

**Product:** Subscription Management System  
**Version:** 1.0  

This document defines a **100% free, open-source, self-hostable** technology stack for the Subscription Management System. No proprietary licenses, no paid SaaS tiers, and no vendor lock-in. Every component can be self-hosted on a single VPS or bare-metal server at zero cost.

Choices prioritize reliability, transactional consistency, developer velocity, and the sub-2-second page-load requirement at thousands-of-subscriptions scale — using only free tools.

---

## 1. Recommended Stack

| Layer | Technology | License / Cost | Rationale |
|-------|------------|----------------|-----------|
| **Frontend (Admin, Staff, Customer)** | Next.js (App Router), React 18, TypeScript | MIT — free | SSR for report pages (fast first paint), static generation for portal, shared component library across the three UIs |
| **Styling** | Tailwind CSS + shadcn/ui | MIT — free | Rapid, consistent, accessible UI components; professional admin/customer portal look; no subscription required |
| **API / Backend** | NestJS (Node.js) | MIT — free | Mature REST ecosystem; modular service structure matching bounded contexts (auth, catalog, billing, discounts, payments, reports) |
| **Authentication** | NextAuth.js + JWT (or NestJS Passport) | MIT — free | Role-based sessions, JWT access tokens, refresh-token rotation, password reset flow via self-hosted email |
| **Database** | PostgreSQL 15+ | PostgreSQL License — free | ACID compliance critical for billing consistency; JSONB for flexible plan/variant attributes |
| **Cache / Session Store** | Redis 7 | BSD — free | Session caching, report aggregate caching, billing job locking |
| **Background Jobs** | BullMQ (Redis-based) | MIT — free | Idempotent billing worker, cron-triggered billing day job, retry semantics |
| **Email** | Nodemailer + self-hosted SMTP (e.g., Mailpit for dev, Haraka/Postfix in prod) | MIT / free | Transactional emails: password reset links, invoice sends; no SendGrid/AWS SES needed |
| **Containerization** | Docker + Docker Compose | Apache 2.0 — free | Reproducible environments; single-server deploy |
| **CI/CD** | GitHub Actions (free tier) or self-hosted runner | Free | Lint, test, build, deploy on push to main |
| **Observability** | Prometheus + Grafana + structured logging (Pino) | Apache 2.0 / AGPL — free | Track billing job success, page-load times, error rates; self-hosted |
| **Testing** | Vitest/Jest + Playwright (E2E), Supertest (API) | MIT — free | Unit, integration, end-to-end coverage |
| **API Docs** | Swagger UI / OpenAPI (Swagger Core) | Apache 2.0 — free | Contract between frontend and backend; self-hosted UI |
| **Object Storage** | MinIO (self-hosted, S3-compatible) | GNU AGPL — free | Invoice PDFs, report exports stored locally; no AWS S3 needed |
| **SSL / TLS** | Let's Encrypt (Certbot) | Free | Free automated TLS certificates with auto-renewal |

---

## 2. Alternative Options

| Layer | Alternative | When to Choose |
|-------|-------------|----------------|
| Backend | Laravel (PHP) | If team is PHP-heavy; strong built-in auth, queues, mail — all free |
| Jobs | Cron + Node script | If avoiding Redis dependency; simpler single-server setup |
| Email | Mailpit (dev) / self-hosted Postfix (prod) | Zero-cost email without external SMTP providers |
| Hosting | Single VPS (Hetzner, DigitalOcean, etc.) or bare metal | Self-hosted; you pay only for the server, not per-service licenses |
| Database hosting | Self-managed PostgreSQL on the VPS | Avoids managed-DB markups |

---

## 3. Removed / Not Used (Paid or Proprietary)

The following were deliberately excluded to keep the stack completely free:

- **SendGrid / AWS SES / Resend / Postmark** → replaced by Nodemailer + self-hosted SMTP
- **AWS Secrets Manager / Doppler** → replaced by environment variables + `.env` files (or self-hosted Vaultwarden)
- **AWS S3** → replaced by self-hosted MinIO
- **Kubernetes (managed)** → replaced by Docker Compose on a single VPS
- **Paid observability SaaS (Datadog, New Relic)** → replaced by self-hosted Prometheus + Grafana

---

## 4. Infrastructure Requirements

### Minimum (Development)
- 2 vCPU, 4 GB RAM
- PostgreSQL, Redis, app container
- Docker Compose

### Production (Initial — Single Self-Hosted VPS)
- 4 vCPU, 8 GB RAM (or equivalent)
- Self-managed PostgreSQL (with daily `pg_dump` backups to local disk or object storage)
- Self-managed Redis (with persistence)
- Self-hosted MinIO for invoice PDFs/exports
- Docker Compose orchestration
- Let's Encrypt (Certbot) for free SSL/TLS with auto-renewal
- Self-hosted Prometheus + Grafana for monitoring & alerting (downtime, failed billing jobs)
- Reverse proxy: Nginx or Caddy (free, handles SSL termination)

### Backup Strategy (Free)
- PostgreSQL: daily `pg_dump` + cron, stored locally or on MinIO
- Redis: RDB/AOF persistence to disk
- MinIO: versioning enabled, local disk
- Restore drills: quarterly

---

## 5. Security Stack Additions

| Control | Tool / Approach |
|---------|-----------------|
| Password hashing | bcrypt / argon2id |
| Transport security | TLS 1.2+ everywhere (HSTS) |
| Secrets management | Environment variables (`.env`) — never committed; optional self-hosted Vaultwarden |
| CSRF protection | SameSite cookies + CSRF tokens |
| Rate limiting | Redis-based sliding window on auth endpoints |
| Dependency scanning | `npm audit` / `safety` in CI |
