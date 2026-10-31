# Business Rules Engine Specification

**Product:** Subscription Management System  
**Version:** 1.0  

This document encodes the business rules that govern the Subscription Management System. Every rule is derived from the problem statement and must be enforced by application logic (and, where possible, database constraints).

---

## 1. Authentication & Account Rules

| ID | Rule | Enforcement |
|----|------|-------------|
| R-AUTH-01 | Each email belongs to exactly one account. | Unique constraint on `accounts.email`; registration rejected if email exists. |
| R-AUTH-02 | Password must be > 8 characters. | Frontend + backend validation on registration and password change. |
| R-AUTH-03 | Password must contain at least one uppercase, one lowercase, and one special character. | Regex validation backend; registration rejected if invalid. |
| R-AUTH-04 | Password reset link sent only to the registered email. | Reset flow looks up account by email; token emailed to that address only. |
| R-AUTH-05 | Reset tokens are time-limited and single-use. | Token expiry (e.g., 1 hour); token invalidated after use. |
| R-AUTH-06 | Three roles exist: admin, staff, customer. | Role column on account; enforced via middleware on every request. |
| R-AUTH-07 | Only the admin can add a new staff member. | Staff creation endpoint requires `role=admin`. |
| R-AUTH-08 | Customers see only their own subscriptions and invoices. | All customer-portal queries scoped by `customer_id` from JWT. |

---

## 2. Product & Plan Rules

| ID | Rule | Enforcement |
|----|------|-------------|
| R-PROD-01 | Product has: name, type, sales price, cost price, notes. | Required fields on product creation. |
| R-PROD-02 | Product variants adjust the sales price. | Variant `price_adjustment_cents` added to base price at quote/invoice time. |
| R-PROD-03 | Example: Odoo brand variant adds 560 to the price. | Configurable variant; not hardcoded (admin sets adjustment). |
| R-PLAN-01 | Plan has: price, billing frequency (daily/weekly/monthly/yearly), min quantity, availability dates. | Required fields; `available_from`/`available_until` bound purchasing. |
| R-PLAN-02 | Plan not purchasable outside availability window. | Backend checks `today` between `available_from` and `available_until`. |
| R-PLAN-03 | Admin sets end-of-term behavior per plan: auto-close, close early, pause, renew. | Enum field on plan; honored by billing worker at expiry. |

---

## 3. Quotation & Subscription Rules

| ID | Rule | Enforcement |
|----|------|-------------|
| R-QUOTE-01 | Quotation template pre-loaded with plan and product lines. | Template lines table; subscription created from template copies them. |
| R-QUOTE-02 | Template valid for a set number of days. | `expires_at` = `created_at + validity_days`; expired templates not usable. |
| R-SUB-01 | Subscription fields: number, customer, plan, start date, expiry date, payment terms. | Required on creation; number auto-generated unique. |
| R-SUB-02 | Subscription lines: product, quantity, unit price, taxes, amount. | Line items stored; amount = qty × unit price + tax. |
| R-SUB-03 | Subscription lifecycle: Draft → Quotation → Confirmed → Active → Closed. | State machine; only forward transitions allowed per plan behavior. |
| R-SUB-04 | Any team member can view subscription status. | Read access for staff/admin roles; customers see own only. |
| R-SUB-05 | Plan end-of-term behavior honored: auto-close / close early / pause / renew. | Billing worker evaluates at `expiry_date`; transitions accordingly. |

---

## 4. Billing & Invoice Rules

| ID | Rule | Enforcement |
|----|------|-------------|
| R-INV-01 | On billing day, invoices auto-created for all due subscriptions. | Billing worker runs daily; selects subscriptions with `next_billing_date = today`. |
| R-INV-02 | Invoice pre-filled with customer details, product lines, taxes, totals. | Snapshot from subscription at generation time. |
| R-INV-03 | Nothing billed twice. | Idempotency key `(subscription_id, billing_period)` + DB unique constraint. |
| R-INV-04 | Nothing skipped. | Worker logs every due subscription; alert if any due sub lacks invoice. |
| R-INV-05 | Taxes calculated automatically from admin-defined tax rules. | `tax_rules` table; rate applied per line based on product scope. |
| R-INV-06 | Invoice lifecycle: Draft → Confirmed → Paid. | State machine; confirmed by staff; paid on full payment. |
| R-INV-07 | Staff can confirm, cancel, send, or print any invoice. | Endpoints for each action; audit log entry per action. |
| R-INV-08 | Invoice amount = subtotal + tax − discount. | Computed at generation; stored as `grand_total_cents`. |

---

## 5. Discount Rules

| ID | Rule | Enforcement |
|----|------|-------------|
| R-DISC-01 | Only admin can create discount rules. | Endpoint requires `role=admin`. |
| R-DISC-02 | Discount type: fixed amount or percentage. | Enum; mutually exclusive value fields. |
| R-DISC-03 | Conditions: min purchase amount, min quantity, start date, end date, usage limit. | All optional except dates; validated on creation. |
| R-DISC-04 | Scope: specific products or whole subscription. | Enum; `discount_products` join table for specific-products scope. |
| R-DISC-05 | Discount applies automatically to the next invoice. | Applied at invoice generation if conditions met; no staff action. |
| R-DISC-06 | Discount stops when expired or usage limit reached. | `end_date` passed OR `usage_count >= usage_limit` → inactive. |
| R-DISC-07 | Discount usage counted per application. | Atomic increment on invoice generation to prevent double-counting. |

---

## 6. Payment Rules

| ID | Rule | Enforcement |
|----|------|-------------|
| R-PAY-01 | Payment recorded with: method, amount, date, note, against the right invoice. | Required fields; `invoice_id` foreign key. |
| R-PAY-02 | Invoice moves toward Paid as payments recorded. | `grand_total_cents` minus sum of payments; paid when balance = 0. |
| R-PAY-03 | Team can see paid vs outstanding invoices at any time. | Query by invoice status and payment balance. |
| R-PAY-04 | Overdue invoices identifiable. | `expiry_date` or due date passed + status ≠ paid → overdue flag. |

---

## 7. Reporting Rules

| ID | Rule | Enforcement |
|----|------|-------------|
| R-REP-01 | Single view of active subscriptions, revenue, payments, overdue invoices. | Aggregated dashboard queries. |
| R-REP-02 | Filters and summary view supported. | Filter params: date range, plan, customer, status. |
| R-REP-03 | Every page responds in under 2 seconds with thousands of subscriptions. | Indexed queries, Redis cache for aggregates, pagination; load-tested. |

---

## 8. State Transition Rules

### Subscription
```
Draft → Quotation → Confirmed → Active → Closed
```
- Draft → Quotation: staff submits quote.
- Quotation → Confirmed: customer/staff confirms.
- Confirmed → Active: start date reached or activation triggered.
- Active → Closed: expiry date reached + end-of-term behavior, or manual close.
- Reverse transitions not permitted (cancel creates a closed/audit record instead).

### Invoice
```
Draft → Confirmed → Paid
```
- Draft → Confirmed: staff confirms.
- Confirmed → Paid: full payment recorded.
- Cancel: invoice voided/audit logged; not deleted.

### Discount
```
Active → Inactive
```
- Active → Inactive: `end_date` passed or `usage_count >= usage_limit`.

---

## 9. Validation Rules (Input Sanitization)

| Field | Rule |
|-------|------|
| Email | Valid format; unique across accounts |
| Password | ≥ 8 chars, 1 upper, 1 lower, 1 special |
| Plan price | ≥ 0 |
| Min quantity | ≥ 1 |
| Validity days | ≥ 1 |
| Discount percentage | 0–100 |
| Discount fixed amount | ≥ 0 |
| Usage limit | ≥ 1 (if set) |
| Dates | end ≥ start |

---

## 10. Audit Requirements

Every state-changing action writes to `audit_logs`:
- actor (account id)
- action (e.g., `invoice_confirmed`, `discount_applied`, `subscription_created`)
- entity type & id
- before/after JSON snapshots
- timestamp

Immutable: audit rows never updated or deleted.
