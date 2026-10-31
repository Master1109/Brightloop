-- Brightloop PostgreSQL Database Schema

-- Users table (Authentication and roles)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL, -- 'ADMIN', 'STAFF', 'CUSTOMER'
    customer_id TEXT,
    reset_token TEXT,
    reset_expires BIGINT
);

-- Records table (Unified entity store: products, plans, customers, subscriptions, quotations, invoices, payments, taxes, discounts, templates)
CREATE TABLE IF NOT EXISTS records (
    id TEXT PRIMARY KEY,
    kind TEXT NOT NULL,
    name TEXT NOT NULL,
    status TEXT NOT NULL,
    amount NUMERIC(14,2) NOT NULL DEFAULT 0,
    customer_id TEXT REFERENCES records(id),
    plan_id TEXT REFERENCES records(id),
    data JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for fast lookup
CREATE INDEX IF NOT EXISTS records_kind ON records(kind, created_at);
CREATE INDEX IF NOT EXISTS records_customer ON records(customer_id, kind);

-- Billing periods table (Prevents duplicate invoice generation for any period)
CREATE TABLE IF NOT EXISTS billing_periods (
    subscription_id TEXT REFERENCES records(id),
    period TEXT,
    invoice_id TEXT REFERENCES records(id),
    PRIMARY KEY(subscription_id, period)
);

-- Events table (Audit log for actions taken on records)
CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    record_id TEXT REFERENCES records(id),
    actor TEXT,
    action TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
