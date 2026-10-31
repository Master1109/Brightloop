# Implementation Plan

**Product:** Subscription Management System  
**Version:** 1.0  

Phased rollout roadmap to deliver the unified subscription platform in production. Each phase has defined scope, exit criteria, and dependencies.

---

## 2. Phase 0 — Foundation (Weeks 1–2)

**Goal:** Repository, CI/CD, auth, and core data model.

### Scope
- Monorepo setup (frontend + backend + shared types)
- Docker Compose local environment (app, PostgreSQL, Redis)
- CI pipeline: lint, unit test, build
- Database schema: accounts, roles, products, plans, tax rules
- Authentication: register, login, JWT, password validation (>8, upper/lower/special), password reset via email
- Role-based middleware: admin / staff / customer

### Exit Criteria
- Local environment spins up with one command
- Auth flows work end-to-end (register → login → reset)
- Password policy enforced; one account per email
- CI passes on push

---

## 3. Phase 1 — Catalog & Quotations (Weeks 3–5)

**Goal:** Products, plans, variants, quotation templates, and subscriptions.

### Scope
- Product CRUD (name, type, sales price, cost price, notes)
- Product variants (price adjustment, e.g., Odoo +560)
- Plan CRUD (price, frequency daily/weekly/monthly/yearly, min quantity, availability dates, end-of-term behavior)
- Quotation templates (pre-loaded plan + lines, validity days)
- Subscription creation from template (Draft → Quotation → Confirmed → Active → Closed)
- Subscription lines (product, qty, unit price, taxes, amount)
- Staff views subscription status

### Exit Criteria
- Admin can launch a product + plan with variant
- Staff can create a subscription from a valid template
- Subscription state machine enforced; invalid transitions rejected

---

## 4. Phase 2 — Automated Billing & Invoices (Weeks 6–8)

**Goal:** Billing worker, invoice generation, tax, invoice lifecycle.

### Scope
- Billing worker (cron-triggered, daily)
- Idempotent invoice generation for due subscriptions
- Invoice pre-filled with customer details, lines, taxes, totals
- Tax calculation from admin-defined rules
- Invoice lifecycle: Draft → Confirmed → Paid
- Staff actions: confirm, cancel, send, print
- Duplicate/skip prevention with idempotency key + DB constraint

### Exit Criteria
- Billing day generates correct invoices for all due subs
- Re-running billing job creates no duplicates
- No due subscription skipped (verified by report)
- Invoice state transitions correct

---

## 5. Phase 3 — Discounts & Payments (Weeks 9–11)

**Goal:** Discount rules, auto-application, payment recording, collections view.

### Scope
- Admin discount CRUD (fixed/percentage, min purchase/qty, start/end dates, usage limit, scope: products or subscription)
- Auto-apply discount to next invoice
- Discount stops on expiry or usage limit
- Payment recording (method, amount, date, note against invoice)
- Paid vs outstanding invoice visibility
- Overdue invoice identification

### Exit Criteria
- Discount appears on next invoice automatically
- Discount inactive after end_date or limit reached
- Payment updates invoice balance toward Paid
- Overdue invoices list accurate

---

## 6. Phase 4 — Customer Portal & Reporting (Weeks 12–14)

**Goal:** Customer self-service and finance dashboard.

### Scope
- Customer portal: login, view own subscriptions, view own invoices, account settings
- Customer cannot view other customers' data
- Finance dashboard: active subscriptions, revenue, payments, overdue invoices
- Filters + summary view
- Sub-2-second page load with thousands of subscriptions

### Exit Criteria
- Customer portal scoped correctly (403 on cross-customer access)
- Dashboard loads < 2s on seeded 5,000+ subscription dataset
- Reports match billing records

---

## 7. Phase 5 — Hardening & Production Launch (Weeks 15–16)

**Goal:** Performance, security, observability, production deploy.

### Scope
- Load testing (5,000 subscriptions, concurrent users)
- Security review (auth, role enforcement, SQL injection, CSRF)
- Backup & restore drill
- Monitoring + alerting (billing job failure, 5xx rate, page latency)
- Production deploy (blue/green or rolling)
- Runbooks: billing job recovery, incident response

### Exit Criteria
- All pages < 2s under load
- Zero critical/high bugs
- Backups automated and tested
- Alerts configured
- Production live with real data

---

## 8. Milestone Summary

| Milestone | Target Week | Deliverable |
|-----------|-------------|-------------|
| M1 Foundation | Week 2 | Auth + CI + local env |
| M2 Catalog | Week 5 | Products, plans, quotes, subscriptions |
| M3 Billing | Week 8 | Invoices, taxes, idempotent billing job |
| M4 Discounts & Payments | Week 11 | Discounts, payments, overdue view |
| M5 Portal & Reports | Week 14 | Customer portal, finance dashboard |
| M6 Launch | Week 16 | Production release, monitoring, runbooks |

---

## 9. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Billing job creates duplicate invoices | High | Idempotency key + DB unique constraint; test re-runs |
| Tax/discount miscalculation | High | Unit tests on calc logic; finance sign-off |
| Page load > 2s at scale | Medium | Indexed queries, Redis caching, load test early |
| Role escalation (staff sees customer data) | High | Middleware + service-layer auth; E2E isolation tests |
| Password reset email not delivered | Medium | Use reliable SMTP provider; test with real inbox |

---

## 10. Post-Launch (v1.1+)

- Payment gateway webhooks (auto-collection)
- Multi-currency
- Accounting export (QuickBooks/Xero)
- Dunning email automation
- Mobile-responsive refinements
