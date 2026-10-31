# Application Flow (Appflow)

**Product:** Subscription Management System  
**Version:** 1.0  

This document maps the end-to-end user journeys across the three user roles: Admin, Internal Staff, and Customer.

---

## 1. Role Summary

| Role | Entry Point | Primary Flows |
|------|-------------|---------------|
| Admin | Admin Dashboard | Product setup, plan setup, tax rules, discounts, staff management, reporting |
| Staff | Staff Dashboard | Quotes, subscriptions, invoices, payments, collections |
| Customer | Customer Portal | Account, subscriptions, invoices, payments |

---

## 2. Authentication Flow

```
User opens app
   │
   ▼
[Login Page] ── invalid creds ──> [Error: try again]
   │
   │ valid creds + role = Admin
   ▼
[Admin Dashboard]
   │
   │ valid creds + role = Staff
   ▼
[Staff Dashboard]
   │
   │ valid creds + role = Customer
   ▼
[Customer Portal]
   │
   ├─ [Forgot Password] ──> [Reset Link Sent to Email] ──> [New Password Set]
   └─ [Register] ──> [Email + Password (>8, upper/lower/special)] ──> [Account Created (1 per email)]
```

---

## 3. Flow A: New Customer Signs Up

1. Customer navigates to registration page.
2. Enters email and password.
3. System validates: email not already registered; password > 8 chars with uppercase, lowercase, special character.
4. Account created with Customer role.
5. Customer logs in → redirected to Customer Portal.
6. (Later) If password forgotten: reset link emailed to registered email; customer sets new password.

---

## 4. Flow B: Admin Launches a New Plan

1. Admin opens Product Catalog → creates Product: name, type, sales price, cost price, notes.
2. Admin adds Variant (e.g., brand: Odoo adds 560 to price).
3. Admin opens Plan Catalog → creates Plan: price, billing frequency (daily/weekly/monthly/yearly), minimum quantity, availability dates.
4. Admin selects end-of-term behavior: auto-close, close early, pause, renew.
5. Plan becomes available within date window for quoting.

---

## 5. Flow C: Turning a Quote into a Subscription

1. Staff opens Quotation Templates → selects or creates a template with plan + product lines.
2. Template validity set (number of days).
3. Staff creates Subscription from template:
   - Customer selected
   - Plan selected
   - Start date, expiry date, payment terms entered
   - Lines populated: product, quantity, unit price, taxes, amount
4. Subscription created in **Draft** state.
5. Staff advances: Draft → Quotation → Confirmed → Active.
6. Any team member views subscription status on dashboard.

---

## 6. Flow D: Billing Day

1. Scheduler triggers billing job for all subscriptions due today.
2. For each due subscription:
   - System creates Invoice pre-filled with customer details, product lines, taxes, totals.
   - Tax computed from Admin-defined tax rules.
   - Idempotency check: no duplicate invoice for same subscription/billing period.
3. Invoice created in **Draft** state.
4. Staff reviews → confirms → Invoice moves to **Confirmed**.
5. Staff sends or prints invoice to customer.
6. On payment: Invoice moves **Confirmed → Paid**.

---

## 7. Flow E: Customer Requests a Discount

1. Admin creates Discount Rule: type (fixed/percentage), conditions (min purchase/qty, start/end dates, usage limit), scope (specific products or whole subscription).
2. Discount stored as active.
3. On next invoice generation for matching subscription/product:
   - Discount applied automatically.
   - No staff action required.
4. Discount stops when: end date passed, or usage limit reached.

---

## 8. Flow F: Payment Collection

1. Payment received by any method (bank, card, check, etc.).
2. Staff opens Invoice → records Payment: method, amount, date, note.
3. Payment linked to the specific invoice.
4. Invoice status updated toward Paid (full amount) or remains partially paid.
5. Staff views Paid vs Outstanding invoices; identifies overdue for chasing.

---

## 9. Flow G: Finance Lead — End of Month Reporting

1. Finance lead opens Reports Dashboard.
2. Views summary cards: active subscriptions, revenue collected, payments received, overdue invoices.
3. Applies filters (date range, plan, customer segment).
4. Exports or reviews summary view.
5. Page loads in under 2 seconds despite thousands of subscriptions.

---

## 10. State Machine Summary

### Subscription Lifecycle
```
Draft → Quotation → Confirmed → Active → Closed
   ↑         │         │         │
   │         │         │         └─ auto-close / close early / pause / renew
   │         │         │
   │         └─ template expiry invalidates quotation
   │
   └─ draft can be cancelled back to closed
```

### Invoice Lifecycle
```
Draft → Confirmed → Paid
   ↑     │         ↑
   │     │         │ payment recorded in full
   │     └─ cancelled (returns to draft / void)
   │
   └─ auto-created from subscription on billing day
```

### Discount Lifecycle
```
Active → Applied to next invoice → Expired / Limit Reached → Inactive
```

---

## 11. Screen Inventory by Role

### Admin
- Admin Dashboard (overview + quick actions)
- Product Catalog (create/edit products, variants)
- Plan Catalog (create/edit plans, billing frequency, availability)
- Tax Rules (create/edit tax rules)
- Discount Management (create/edit discount rules)
- Staff Management (add staff, assign roles)
- Reports (finance summary, filters)

### Staff
- Staff Dashboard (subscriptions, invoices, payments overview)
- Quotation Templates (create/edit templates)
- Subscriptions (create, view status, advance lifecycle)
- Invoices (confirm, cancel, send, print)
- Payments (record payment, view paid/outstanding)

### Customer
- Customer Portal Home (own subscriptions, own invoices)
- Subscription Detail (status, lines, dates)
- Invoice Detail (amount, paid/outstanding, download/print)
- Account Settings (email, password, reset)
