# Backend Database Schema

**Product:** Subscription Management System  
**Version:** 1.0  

This schema is relational (PostgreSQL). All monetary values stored as integer cents (or `NUMERIC`) to avoid floating-point errors. `created_at` / `updated_at` timestamps on every table. Soft deletes via `deleted_at` where appropriate.

---

## 1. Core Entities — ER Overview (Text)

```
Account 1───* Subscription
Account 1───* Payment (recorded by)
Account 1───* AuditLog
Plan 1───* Subscription
Product 1───* ProductVariant
Product 1───* SubscriptionLine (via product)
Subscription 1───* SubscriptionLine
Subscription 1───* Invoice
Invoice 1───* InvoiceLine
Invoice 1───* Payment
TaxRule 1───* Invoice (via calculation)
Discount 1───* Subscription / Product (scope)
QuotationTemplate 1───* Subscription (origin)
```

---

## 2. Table Definitions

### 2.1 accounts
Stores users across all three roles.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| email | VARCHAR(255) | UNIQUE, NOT NULL | One account per email |
| password_hash | VARCHAR(255) | NOT NULL | bcrypt/argon2 |
| role | ENUM(admin, staff, customer) | NOT NULL | |
| is_active | BOOLEAN | DEFAULT true | |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | |

### 2.2 staff_profiles
Extra info for staff members (optional, admin-managed).

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| account_id | UUID | FK → accounts.id, UNIQUE | |
| full_name | VARCHAR(255) | | |
| permissions | JSONB | DEFAULT '[]' | Staff-scoped permissions |
| created_by | UUID | FK → accounts.id | Admin who added this staff |

### 2.3 customer_profiles
Customer-specific details.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| account_id | UUID | FK → accounts.id, UNIQUE | |
| company_name | VARCHAR(255) | | |
| billing_address | TEXT | | |
| created_at | TIMESTAMPTZ | DEFAULT now() | |

### 2.4 products
Admin-created product catalog.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| name | VARCHAR(255) | NOT NULL | |
| type | VARCHAR(100) | | e.g., software, add-on |
| sales_price_cents | INTEGER | NOT NULL | Base price in cents |
| cost_price_cents | INTEGER | | |
| notes | TEXT | | |
| is_active | BOOLEAN | DEFAULT true | |
| created_at | TIMESTAMPTZ | DEFAULT now() | |

### 2.5 product_variants
Variants that adjust price (e.g., brand).

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| product_id | UUID | FK → products.id | |
| name | VARCHAR(255) | NOT NULL | e.g., "Odoo brand" |
| price_adjustment_cents | INTEGER | NOT NULL DEFAULT 0 | +56000 for Odoo (+560) |
| is_active | BOOLEAN | DEFAULT true | |

### 2.6 plans
Billing plans.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| name | VARCHAR(255) | NOT NULL | |
| price_cents | INTEGER | NOT NULL | |
| billing_frequency | ENUM(daily, weekly, monthly, yearly) | NOT NULL | |
| min_quantity | INTEGER | NOT NULL DEFAULT 1 | |
| available_from | DATE | | |
| available_until | DATE | | |
| end_of_term_behavior | ENUM(auto_close, close_early, pause, renew) | NOT NULL | |
| is_active | BOOLEAN | DEFAULT true | |
| created_at | TIMESTAMPTZ | DEFAULT now() | |

### 2.7 quotation_templates
Templates sales reps start from.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| name | VARCHAR(255) | NOT NULL | |
| plan_id | UUID | FK → plans.id | |
| validity_days | INTEGER | NOT NULL | Days template stays valid |
| created_by | UUID | FK → accounts.id | Staff member |
| created_at | TIMESTAMPTZ | DEFAULT now() | |
| expires_at | TIMESTAMPTZ | | created_at + validity_days |

### 2.8 quotation_template_lines
Line items inside a template.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| template_id | UUID | FK → quotation_templates.id | |
| product_id | UUID | FK → products.id | |
| variant_id | UUID | FK → product_variants.id | |
| quantity | INTEGER | NOT NULL | |
| unit_price_cents | INTEGER | NOT NULL | |
| tax_rate | NUMERIC(5,4) | | |

### 2.9 subscriptions
Main subscription record.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| subscription_number | VARCHAR(50) | UNIQUE, NOT NULL | Auto-generated (e.g., SUB-0001) |
| customer_id | UUID | FK → accounts.id (role=customer) | |
| plan_id | UUID | FK → plans.id | |
| start_date | DATE | NOT NULL | |
| expiry_date | DATE | | Null if ongoing/renew |
| payment_terms | VARCHAR(100) | | e.g., Net 30 |
| status | ENUM(draft, quotation, confirmed, active, closed) | NOT NULL DEFAULT draft | |
| created_by | UUID | FK → accounts.id | Staff who created |
| created_at | TIMESTAMPTZ | DEFAULT now() | |
| updated_at | TIMESTAMPTZ | DEFAULT now() | |

### 2.10 subscription_lines
Line items on a subscription.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| subscription_id | UUID | FK → subscriptions.id | |
| product_id | UUID | FK → products.id | |
| variant_id | UUID | FK → product_variants.id | |
| quantity | INTEGER | NOT NULL | |
| unit_price_cents | INTEGER | NOT NULL | |
| tax_rate | NUMERIC(5,4) | | |
| tax_amount_cents | INTEGER | | |
| amount_cents | INTEGER | NOT NULL | quantity * unit_price + tax |

### 2.11 tax_rules
Admin-defined tax rules.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| name | VARCHAR(255) | NOT NULL | |
| rate | NUMERIC(5,4) | NOT NULL | Percentage rate |
| applicable_to | ENUM(all, specific_products) | NOT NULL | |
| is_active | BOOLEAN | DEFAULT true | |
| created_at | TIMESTAMPTZ | DEFAULT now() | |

### 2.12 invoices
Auto-generated or staff-created invoices.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| invoice_number | VARCHAR(50) | UNIQUE, NOT NULL | Auto-generated |
| subscription_id | UUID | FK → subscriptions.id | |
| customer_id | UUID | FK → accounts.id | |
| billing_period_start | DATE | | |
| billing_period_end | DATE | | |
| status | ENUM(draft, confirmed, paid) | NOT NULL DEFAULT draft | |
| subtotal_cents | INTEGER | NOT NULL | |
| tax_total_cents | INTEGER | NOT NULL | |
| discount_total_cents | INTEGER | DEFAULT 0 | |
| grand_total_cents | INTEGER | NOT NULL | |
| idempotency_key | VARCHAR(100) | UNIQUE | (subscription_id, billing_period) |
| sent_at | TIMESTAMPTZ | | When sent to customer |
| paid_at | TIMESTAMPTZ | | When marked paid |
| created_at | TIMESTAMPTZ | DEFAULT now() | |

### 2.13 invoice_lines
Snapshot of subscription lines at invoicing time.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| invoice_id | UUID | FK → invoices.id | |
| product_id | UUID | FK → products.id | |
| description | VARCHAR(255) | | Snapshot of product name |
| quantity | INTEGER | NOT NULL | |
| unit_price_cents | INTEGER | NOT NULL | |
| tax_rate | NUMERIC(5,4) | | |
| tax_amount_cents | INTEGER | | |
| discount_applied_cents | INTEGER | DEFAULT 0 | |
| amount_cents | INTEGER | NOT NULL | |

### 2.14 discounts
Admin-created discount rules.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| name | VARCHAR(255) | NOT NULL | |
| type | ENUM(fixed, percentage) | NOT NULL | |
| value_cents | INTEGER | | For fixed discounts |
| percentage | NUMERIC(5,4) | | For percentage discounts |
| min_purchase_cents | INTEGER | | |
| min_quantity | INTEGER | | |
| start_date | DATE | NOT NULL | |
| end_date | DATE | | |
| usage_limit | INTEGER | | Max times usable |
| usage_count | INTEGER | DEFAULT 0 | |
| scope | ENUM(specific_products, whole_subscription) | NOT NULL | |
| is_active | BOOLEAN | DEFAULT true | |
| created_by | UUID | FK → accounts.id | Admin |
| created_at | TIMESTAMPTZ | DEFAULT now() | |

### 2.15 discount_products
Link discounts to specific products (when scope = specific_products).

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| discount_id | UUID | FK → discounts.id | |
| product_id | UUID | FK → products.id | |

### 2.16 payments
Recorded payments against invoices.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| invoice_id | UUID | FK → invoices.id | |
| method | VARCHAR(50) | NOT NULL | e.g., bank, card, check |
| amount_cents | INTEGER | NOT NULL | |
| payment_date | DATE | NOT NULL | |
| note | TEXT | | |
| recorded_by | UUID | FK → accounts.id | Staff member |
| created_at | TIMESTAMPTZ | DEFAULT now() | |

### 2.17 audit_logs
Immutable record of state changes.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| actor_id | UUID | FK → accounts.id | Who did it |
| action | VARCHAR(100) | NOT NULL | e.g., invoice_confirmed |
| entity_type | VARCHAR(50) | NOT NULL | e.g., subscription |
| entity_id | UUID | NOT NULL | |
| before | JSONB | | Snapshot before |
| after | JSONB | | Snapshot after |
| created_at | TIMESTAMPTZ | DEFAULT now() | |

---

## 3. Key Indexes

```sql
-- Auth
CREATE UNIQUE INDEX idx_accounts_email ON accounts(email);

-- Subscriptions
CREATE INDEX idx_subscriptions_customer ON subscriptions(customer_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_plan ON subscriptions(plan_id);
CREATE INDEX idx_subscriptions_expiry ON subscriptions(expiry_date);

-- Invoices
CREATE INDEX idx_invoices_subscription ON invoices(subscription_id);
CREATE INDEX idx_invoices_customer ON invoices(customer_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE UNIQUE INDEX idx_invoices_idempotency ON invoices(idempotency_key);

-- Payments
CREATE INDEX idx_payments_invoice ON payments(invoice_id);

-- Discounts
CREATE INDEX idx_discounts_active_dates ON discounts(start_date, end_date) WHERE is_active;

-- Audit
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at);
```

---

## 4. Constraints & Triggers (Summary)

- `accounts.email` unique → one account per email.
- `invoices.idempotency_key` unique → no duplicate invoice per subscription/billing period.
- `subscription_lines.amount_cents` = `quantity * unit_price_cents + tax_amount_cents` (application-enforced).
- `discounts.usage_count` ≤ `usage_limit` (atomic increment on application).
- Invoice `grand_total_cents` = `subtotal + tax_total - discount_total`.

---

## 5. Seed Data Examples

| Entity | Example |
|--------|---------|
| Product | "Brightloop CRM", sales_price 99000, cost_price 40000 |
| Variant | "Odoo brand", price_adjustment +56000 |
| Plan | "Monthly CRM", 99000, monthly, min_qty 1, auto_close |
| Discount | "Volume 10%", percentage 10, min_quantity 5, usage_limit 100 |
