-- Brightloop PostgreSQL Database Schema (Normalized - Matches Neon)
-- Generated from existing Neon database structure

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

CREATE TYPE account_role AS ENUM ('admin', 'staff', 'customer');
CREATE TYPE billing_freq AS ENUM ('daily', 'weekly', 'monthly', 'yearly');
CREATE TYPE disc_scope AS ENUM ('specific_products', 'whole_subscription');
CREATE TYPE disc_type AS ENUM ('fixed', 'percentage');
CREATE TYPE inv_status AS ENUM ('draft', 'confirmed', 'paid');
CREATE TYPE sub_status AS ENUM ('draft', 'quotation', 'confirmed', 'active', 'closed');
CREATE TYPE tax_scope AS ENUM ('all', 'specific_products');
CREATE TYPE term_behavior AS ENUM ('auto_close', 'close_early', 'pause', 'renew');

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Users/Accounts table (authentication)
CREATE TABLE IF NOT EXISTS accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role account_role NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Staff profiles (extends accounts)
CREATE TABLE IF NOT EXISTS staff_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
    full_name VARCHAR(255),
    permissions JSONB DEFAULT '[]'::jsonb,
    created_by UUID REFERENCES accounts(id)
);

-- Customer profiles (extends accounts)
CREATE TABLE IF NOT EXISTS customer_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
    company_name VARCHAR(255),
    billing_address TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Products
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100),
    sales_price_cents INTEGER NOT NULL,
    cost_price_cents INTEGER,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Product variants
CREATE TABLE IF NOT EXISTS product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    price_adjustment_cents INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true
);

-- Plans
CREATE TABLE IF NOT EXISTS plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    price_cents INTEGER NOT NULL,
    billing_frequency billing_freq NOT NULL,
    min_quantity INTEGER NOT NULL DEFAULT 1,
    available_from DATE,
    available_until DATE,
    end_of_term_behavior term_behavior NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Quotation templates
CREATE TABLE IF NOT EXISTS quotation_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    plan_id UUID REFERENCES plans(id),
    validity_days INTEGER NOT NULL,
    created_by UUID REFERENCES accounts(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ
);

-- Quotation template lines
CREATE TABLE IF NOT EXISTS quotation_template_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID REFERENCES quotation_templates(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    variant_id UUID REFERENCES product_variants(id),
    quantity INTEGER NOT NULL,
    unit_price_cents INTEGER NOT NULL,
    tax_rate NUMERIC
);

-- Subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_number VARCHAR(100) UNIQUE NOT NULL,
    customer_id UUID REFERENCES customer_profiles(id),
    plan_id UUID REFERENCES plans(id),
    start_date DATE NOT NULL,
    expiry_date DATE,
    payment_terms VARCHAR(50),
    status sub_status NOT NULL DEFAULT 'draft'::sub_status,
    created_by UUID REFERENCES accounts(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Subscription lines (products in a subscription)
CREATE TABLE IF NOT EXISTS subscription_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    variant_id UUID REFERENCES product_variants(id),
    quantity INTEGER NOT NULL,
    unit_price_cents INTEGER NOT NULL,
    tax_rate NUMERIC,
    tax_amount_cents INTEGER,
    amount_cents INTEGER NOT NULL
);

-- Tax rules
CREATE TABLE IF NOT EXISTS tax_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    rate NUMERIC NOT NULL,
    applicable_to tax_scope NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Invoices
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number VARCHAR(100) UNIQUE NOT NULL,
    subscription_id UUID REFERENCES subscriptions(id),
    customer_id UUID REFERENCES customer_profiles(id),
    billing_period_start DATE,
    billing_period_end DATE,
    status inv_status NOT NULL DEFAULT 'draft'::inv_status,
    subtotal_cents INTEGER NOT NULL,
    tax_total_cents INTEGER NOT NULL,
    discount_total_cents INTEGER DEFAULT 0,
    grand_total_cents INTEGER NOT NULL,
    idempotency_key VARCHAR(255),
    sent_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Invoice lines
CREATE TABLE IF NOT EXISTS invoice_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    description VARCHAR(255),
    quantity INTEGER NOT NULL,
    unit_price_cents INTEGER NOT NULL,
    tax_rate NUMERIC,
    tax_amount_cents INTEGER,
    discount_applied_cents INTEGER DEFAULT 0,
    amount_cents INTEGER NOT NULL
);

-- Discounts
CREATE TABLE IF NOT EXISTS discounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type disc_type NOT NULL,
    value_cents INTEGER,
    percentage NUMERIC,
    min_purchase_cents INTEGER,
    min_quantity INTEGER,
    start_date DATE NOT NULL,
    end_date DATE,
    usage_limit INTEGER,
    usage_count INTEGER DEFAULT 0,
    scope disc_scope NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES accounts(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Discount products (many-to-many)
CREATE TABLE IF NOT EXISTS discount_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    discount_id UUID REFERENCES discounts(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE
);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID REFERENCES invoices(id),
    method VARCHAR(100) NOT NULL,
    amount_cents INTEGER NOT NULL,
    payment_date DATE NOT NULL,
    note TEXT,
    recorded_by UUID REFERENCES accounts(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES accounts(id),
    action VARCHAR(255) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID NOT NULL,
    before JSONB,
    after JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Migrations tracking
CREATE TABLE IF NOT EXISTS migrations (
    id SERIAL PRIMARY KEY,
    timestamp BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_accounts_email ON accounts(email);
CREATE INDEX IF NOT EXISTS idx_staff_profiles_account ON staff_profiles(account_id);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_account ON customer_profiles(account_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_customer ON subscriptions(customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan ON subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscription_lines_subscription ON subscription_lines(subscription_id);
CREATE INDEX IF NOT EXISTS idx_invoices_subscription ON invoices(subscription_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoice_lines_invoice ON invoice_lines(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_discounts_active ON discounts(is_active, start_date, end_date);

-- ============================================================================
-- TRIGGERS FOR updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_accounts_updated_at ON accounts;
CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();