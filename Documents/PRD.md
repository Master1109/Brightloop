# Product Requirements Document (PRD)

**Product:** Subscription Management System  
**Company:** Brightloop Software  
**Status:** Draft v1.0  
**Owner:** Product Engineering  
**Audience:** Engineering, Design, QA, Finance, Leadership  

---

## 1. Overview

Brightloop Software runs its entire business on subscriptions: monthly and yearly business software plans, optional add-ons customers can toggle on and off, and products sold in variants (for example, by brand, where selecting the Odoo brand adds 560 to the price). Today this is managed in spreadsheets, renewals are tracked by memory, invoices are typed by hand, payments are matched against bank statements manually, and revenue reports are assembled quarterly by hand.

This PRD defines **one unified platform** that owns the full life of a subscription business — from product and plan setup to invoicing, payment collection, and revenue reporting — replacing every manual process with an automated, auditable system.

---

## 2. Objectives

| # | Objective | Success Measure |
|---|-----------|-----------------|
| 1 | Eliminate manual invoice creation | 100% of invoices generated automatically from subscriptions on billing day |
| 2 | Eliminate missed renewals | Zero subscriptions billed late or skipped due to human oversight |
| 3 | Give customers self-service | Customers view and manage only their own subscriptions and invoices via portal without emailing staff |
| 4 | Enforce role-based access | Admin, internal staff, and customers see only what their role permits |
| 5 | Real-time finance visibility | Finance lead sees active subscriptions, revenue, payments, and overdue invoices in one filtered summary view |
| 6 | Performance at scale | Every page responds in under 2 seconds with thousands of subscriptions on the books |

---

## 3. Users & Roles

| Role | Responsibilities | Access Scope |
|------|------------------|--------------|
| **Admin** | Full system control. Sets up products, plans, taxes, discounts. Adds new staff members. | Entire system |
| **Internal Staff** | Day-to-day customer operations (quotes, subscriptions, invoices, payments) within limited permissions | Subset of system defined by staff role |
| **Customer** | Creates account, views and manages own subscriptions and invoices | Own account, own subscriptions, own invoices only |

### Access Rules
- Only the admin can add a new member of staff.
- Each email belongs to exactly one account.
- Customers see only their own subscriptions and invoices through a customer portal.

---

## 4. In-Scope Features

### 4.1 Authentication & Accounts
- Customer self-registration with email and password.
- Password policy: more than 8 characters, must include uppercase, lowercase, and a special character.
- Password reset via reset link sent to the registered email.
- One account per email (unique email constraint).
- Role-based access control: admin, staff, customer.

### 4.2 Product & Plan Catalog
- Admin creates products with: name, type, sales price, cost price, notes.
- Product variants (e.g., by brand) that adjust price — example: Odoo brand adds 560 to the price.
- Admin creates plans with: cost, billing frequency (daily, weekly, monthly, yearly), minimum quantity, availability dates.
- Per-plan lifecycle behavior decided by admin: auto-close at end of term, close early, pause, or renew.

### 4.3 Quotations & Subscriptions
- Sales reps create subscriptions from quotation templates pre-loaded with plan and product lines.
- Quotation templates valid for a configurable number of days.
- Each subscription has: number, customer, plan, start date, expiry date, payment terms.
- Subscription lines: product, quantity, unit price, taxes, amount.
- Subscription lifecycle: Draft → Quotation → Confirmed → Active → Closed.
- Any team member can view the current status of a subscription.

### 4.4 Automated Billing
- On billing day, invoices are created automatically from due subscriptions (no manual typing).
- Each invoice pre-filled with: customer details, product lines, taxes, totals.
- Taxes calculated automatically from admin-defined tax rules.
- Guarantee: nothing billed twice, nothing skipped.
- Invoice lifecycle: Draft → Confirmed → Paid.
- Team can confirm, cancel, send, or print any invoice.

### 4.5 Discounts
- Only the admin can create discount rules.
- Discount type: fixed amount or percentage.
- Conditions: minimum purchase amount or minimum quantity, start date, end date, usage limit.
- Scope: specific products or whole subscriptions.
- Discounts apply automatically to the next invoice; no manual reminder needed.
- Discounts stop when they expire or reach their usage limit.

### 4.6 Payments
- Record each payment with: method, amount, date, note, applied against the correct invoice.
- Team can view paid vs outstanding invoices at any time.
- Overdue invoices identifiable for collections chasing.

### 4.7 Reporting & Dashboards
- Single finance view: active subscriptions, revenue collected, payments received, overdue invoices.
- Filters and summary view supported.
- Must scale to thousands of subscriptions with sub-2-second page response.

---

## 5. Out of Scope

- Multi-currency support (v1).
- Automated payment gateway integration / webhooks (payments recorded manually in v1).
- Recurring dunning email automation (overdue identification provided; sending is manual).
- Public marketing website for Brightloop (internal platform + customer portal only).
- Mobile applications (web-responsive in v1).

---

## 6. Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| Performance | All pages load in under 2 seconds with thousands of subscriptions |
| Security | Password hashing, reset-link email flow, role-based authorization, CSRF/XSS protection |
| Reliability | Billing jobs must be idempotent; no duplicate invoices; no skipped subscriptions |
| Auditability | All state changes (subscription status, invoice status, discount application) logged |
| Availability | Platform available during business hours; billing jobs run on schedule |
| Scalability | Support thousands of subscriptions and invoices without degradation |

---

## 7. Success Metrics (Post-Launch)

- 100% of invoices auto-generated on billing day.
- Zero missed renewals due to system oversight.
- Finance reporting time reduced from days to seconds (sub-2s page load).
- Customer subscription/ invoice management via portal (zero email requests for self-service items).
- Discount rules applied automatically on next invoice with zero manual intervention.

---

## 8. Open Questions (To Be Resolved)

- Payment gateway provider and webhook handling (post-MVP).
- Exact retention period for draft quotations and expired templates.
- Whether paused subscriptions accrue prorated charges on resume.
- Timezone handling for billing day across customer regions.
