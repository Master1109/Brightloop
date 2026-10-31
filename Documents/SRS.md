# Software Requirements Specification (SRS)

**Product:** Subscription Management System  
**Version:** 1.0  
**Status:** Approved for Development  
**Derived from:** PRD.md, Subscription_Management_System.pdf problem statement  

---

## 1. Introduction

This SRS specifies the functional and non-functional requirements for the Subscription Management System, a unified platform for Brightloop Software to manage products, plans, subscriptions, invoices, payments, and revenue reporting.

---

## 2. Functional Requirements

### 2.1 Authentication & Account Management

| ID | Requirement | Priority |
|----|-------------|----------|
| AUTH-01 | User registers with email and password. | Must |
| AUTH-02 | Password must be > 8 characters and contain at least one uppercase, one lowercase, and one special character. | Must |
| AUTH-03 | Each email maps to exactly one account; duplicate registration rejected. | Must |
| AUTH-04 | Password reset: reset link delivered to the registered email address. | Must |
| AUTH-05 | Three roles enforced: Admin, Staff, Customer. | Must |
| AUTH-06 | Only Admin can create new staff accounts. | Must |
| AUTH-07 | Customers access only their own subscriptions and invoices via customer portal. | Must |
| AUTH-08 | Staff access limited to permissions assigned by Admin. | Must |

### 2.2 Product Catalog

| ID | Requirement | Priority |
|----|-------------|----------|
| PROD-01 | Admin creates a product with: name, type, sales price, cost price, notes. | Must |
| PROD-02 | Product supports variants (e.g., by brand) that adjust the sales price. | Must |
| PROD-03 | Variant example: selecting "Odoo" brand adds 560 to the product price. | Must |
| PROD-04 | Admin can view, edit, and deactivate products. | Should |

### 2.3 Plan Management

| ID | Requirement | Priority |
|----|-------------|----------|
| PLAN-01 | Admin creates a plan with: price, billing frequency (daily, weekly, monthly, yearly), minimum quantity, availability start and end dates. | Must |
| PLAN-02 | Admin sets per-plan end-of-term behavior: auto-close, close early, pause, or renew. | Must |
| PLAN-03 | Plan availability bounded by start/end dates; not purchasable outside window. | Must |

### 2.4 Quotation Templates

| ID | Requirement | Priority |
|----|-------------|----------|
| QUOTE-01 | Sales rep creates a quotation template pre-loaded with plan and product lines. | Must |
| QUOTE-02 | Template has a validity period (number of days). | Must |
| QUOTE-03 | Subscription created from a template inherits its lines and pricing. | Must |

### 2.5 Subscriptions

| ID | Requirement | Priority |
|----|-------------|----------|
| SUB-01 | Subscription fields: number (auto-generated), customer, plan, start date, expiry date, payment terms. | Must |
| SUB-02 | Subscription lines: product, quantity, unit price, taxes, amount. | Must |
| SUB-03 | Subscription lifecycle: Draft → Quotation → Confirmed → Active → Closed. | Must |
| SUB-04 | Any team member can view the current status of any subscription. | Must |
| SUB-05 | Only Admin-configured transitions permitted between states. | Must |

### 2.6 Automated Billing & Invoices

| ID | Requirement | Priority |
|----|-------------|----------|
| INV-01 | On billing day, invoices auto-generated for all due subscriptions. | Must |
| INV-02 | Invoice pre-filled with: customer details, product lines, taxes, totals. | Must |
| INV-03 | Idempotency: no subscription billed twice; no due subscription skipped. | Must |
| INV-04 | Tax calculated automatically from Admin-defined tax rules. | Must |
| INV-05 | Invoice lifecycle: Draft → Confirmed → Paid. | Must |
| INV-06 | Staff can confirm, cancel, send, or print any invoice. | Must |

### 2.7 Discounts

| ID | Requirement | Priority |
|----|-------------|----------|
| DISC-01 | Only Admin can create discount rules. | Must |
| DISC-02 | Discount type: fixed amount or percentage. | Must |
| DISC-03 | Conditions: minimum purchase amount, minimum quantity, start date, end date, usage limit. | Must |
| DISC-04 | Scope: specific products or entire subscription. | Must |
| DISC-05 | Discount applies automatically to the next invoice. | Must |
| DISC-06 | Discount stops when expired or usage limit reached. | Must |

### 2.8 Payments

| ID | Requirement | Priority |
|----|-------------|----------|
| PAY-01 | Record payment with: method, amount, date, note, linked to a specific invoice. | Must |
| PAY-02 | Team can view paid vs outstanding invoices at any time. | Must |
| PAY-03 | Overdue invoices identifiable for follow-up. | Must |

### 2.9 Reporting

| ID | Requirement | Priority |
|----|-------------|----------|
| REP-01 | Single view of: active subscriptions, revenue, payments, overdue invoices. | Must |
| REP-02 | Filters and summary view supported. | Must |
| REP-03 | Page response under 2 seconds with thousands of subscriptions. | Must |

---

## 3. Non-Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| PERF-01 | All UI pages respond in under 2 seconds. | Must |
| PERF-02 | Billing job completes for thousands of subscriptions within scheduled window. | Must |
| SEC-01 | Passwords stored hashed (bcrypt/argon2); never plaintext. | Must |
| SEC-02 | Role-based authorization enforced on every endpoint. | Must |
| SEC-03 | Reset links time-limited and single-use. | Must |
| AUD-01 | All state transitions (subscription, invoice, discount) logged with user and timestamp. | Must |
| REL-01 | Billing job idempotent and retry-safe. | Must |
| AVAIL-01 | Platform available during business hours; scheduled jobs run on time. | Should |

---

## 4. Data Requirements (Summary)

Core entities: Account, Role, Product, ProductVariant, Plan, Subscription, SubscriptionLine, QuotationTemplate, Invoice, InvoiceLine, TaxRule, Discount, Payment, AuditLog.

Full schema: see `Backend_Schema.md`.

---

## 5. Acceptance Criteria

- Customer can register, log in, reset password via email.
- Admin can create product, plan, tax rule, discount, staff member.
- Sales rep can create quote from template, convert to subscription.
- Billing job generates invoices for all due subscriptions with correct taxes and totals.
- Invoice moves Draft → Confirmed → Paid; no duplicates on re-run.
- Discount auto-applies to next invoice and stops on expiry/limit.
- Payment recorded against invoice; paid/outstanding status reflected.
- Finance dashboard loads in <2s with thousands of subscriptions.
- Customer portal shows only the logged-in customer's data.
