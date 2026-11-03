import { config } from 'dotenv';
config({ path: '.env' });

import { Pool } from 'pg';
import { newDb } from 'pg-mem';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { hash } from 'bcryptjs';

const usePgMem = !process.env.DATABASE_URL || (!process.env.DATABASE_URL.includes('neon') && !process.env.DATABASE_URL.includes('postgres://') && !process.env.DATABASE_URL.includes('postgresql://'));

function createDatabase() {
  if (!usePgMem) {
    return new Pool({ connectionString: process.env.DATABASE_URL });
  }
  const mem = newDb();
  mem.public.registerFunction({
    name: 'gen_random_uuid',
    implementation: () => randomUUID()
  });
  try {
    let schema = readFileSync(join(__dirname, '../database/schema.sql'), 'utf8').replace(/^\uFEFF/, '');
    const triggerIdx = schema.indexOf('CREATE OR REPLACE FUNCTION');
    if (triggerIdx !== -1) schema = schema.slice(0, triggerIdx);
    mem.public.none(schema);
  } catch (err: any) {
    console.error('Error initializing in-memory schema:', err.message);
  }
  return new (mem.adapters.createPg().Pool)();
}

export const db: Pool = createDatabase();

// Legacy exports for compatibility
export const demo = usePgMem;
export const entities = ['products','plans','customers','templates','subscriptions','quotations','invoices','payments','taxes','discounts','team'] as const;
export type Entity = typeof entities[number];

// Insert helper for legacy compatibility
export async function insert(kind: string, name: string, status: string, amount: number, data: any = {}, customer_id: string | null = null, plan_id: string | null = null, id = randomUUID() as string) {
  const result = await db.query('INSERT INTO records(id,kind,name,status,amount,data,customer_id,plan_id) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',[id,kind,name,status,amount,JSON.stringify(data),customer_id,plan_id]);
  return result.rows[0];
}

// Convert cents to decimal
export const cents = (c: number) => c / 100;
// Convert decimal to cents (round)
export const toCents = (v: number) => Math.round(v * 100);

// Money calculation (matching domain.ts logic)
export function calculateTotals(unitCents: number, quantity: number, taxRate: number, discountCents = 0) {
  const subtotal = unitCents * quantity;
  const discounted = Math.max(0, subtotal - discountCents);
  const tax = Math.round(discounted * taxRate / 100);
  return {
    subtotalCents: subtotal,
    discountCents: Math.min(subtotal, discountCents),
    taxCents: tax,
    totalCents: discounted + tax,
    subtotal: cents(subtotal),
    discount: cents(Math.min(subtotal, discountCents)),
    tax: cents(tax),
    total: cents(discounted + tax),
  };
}

// Next billing period calculation
export function nextBillingDate(date: string, frequency: string, anchorDay?: number): string {
  const d = new Date(date);
  if (!Number.isFinite(d.getTime())) throw new Error('Invalid billing date');

  const day = anchorDay ?? d.getUTCDate();

  if (frequency === 'daily') d.setUTCDate(d.getUTCDate() + 1);
  else if (frequency === 'weekly') d.setUTCDate(d.getUTCDate() + 7);
  else {
    d.setUTCDate(1);
    d.setUTCMonth(d.getUTCMonth() + (frequency === 'yearly' ? 12 : 1));
    const maxDay = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
    d.setUTCDate(Math.min(day, maxDay));
  }
  return d.toISOString().slice(0, 10);
}

// ============================================================================
// INITIALIZATION & SEEDING
// ============================================================================

export async function init() {
  if (usePgMem) {
    console.log('Using pg-mem for local development');
  }

  // Seed only if accounts table is empty
  const existing = await db.query('SELECT id FROM accounts LIMIT 1');
  if (!existing.rowCount) {
    await seed();
  }
}

async function seed() {
  console.log('Seeding database...');

  // Create admin account
  const adminPassword = await hash('Brightloop!2026', 12);
  const adminId = randomUUID();
  await db.query(
    `INSERT INTO accounts (id, email, password_hash, role) VALUES ($1, $2, $3, 'admin')`,
    [adminId, 'admin@brightloop.local', adminPassword]
  );

  // Create staff account
  const staffPassword = await hash('Brightloop!2026', 12);
  const staffId = randomUUID();
  await db.query(
    `INSERT INTO accounts (id, email, password_hash, role) VALUES ($1, $2, $3, 'staff')`,
    [staffId, 'staff@brightloop.local', staffPassword]
  );
  await db.query(
    `INSERT INTO staff_profiles (id, account_id, full_name, created_by) VALUES ($1, $2, $3, $2)`,
    [randomUUID(), staffId, 'Meera Patel']
  );

  // Create customer account
  const customerPassword = await hash('Brightloop!2026', 12);
  const customerId = randomUUID();
  await db.query(
    `INSERT INTO accounts (id, email, password_hash, role) VALUES ($1, $2, $3, 'customer')`,
    [customerId, 'customer@brightloop.local', customerPassword]
  );
  const customerProfileId = randomUUID();
  await db.query(
    `INSERT INTO customer_profiles (id, account_id, company_name) VALUES ($1, $2, $3)`,
    [customerProfileId, customerId, 'Acme Studio']
  );

  // Create sample products
  const productIds = [];
  for (const [name, price, type] of [
    ['Workspace', 125000, 'Software'],
    ['Automations', 249000, 'Software'],
    ['Analytics', 499000, 'Software'],
  ] as const) {
    const id = randomUUID();
    await db.query(
      `INSERT INTO products (id, name, type, sales_price_cents, cost_price_cents, notes) VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, name, type, price, 20000, 'Team productivity suite']
    );
    productIds.push(id);
  }

  // Create sample plans
  const planIds = [];
  for (const [name, price, productId] of [
    ['Starter', 125000, productIds[0]],
    ['Professional', 249000, productIds[1]],
    ['Enterprise', 499000, productIds[2]],
  ] as const) {
    const id = randomUUID();
    await db.query(
      `INSERT INTO plans (id, name, price_cents, billing_frequency, min_quantity, end_of_term_behavior) VALUES ($1, $2, $3, 'monthly', 1, 'auto_close')`,
      [id, name, price]
    );
    planIds.push(id);
  }

  // Create sample subscriptions
  const subIds: string[] = [];
  const statuses: Array<'active' | 'active' | 'active' | 'confirmed' | 'quotation' | 'closed'> =
    ['active', 'active', 'active', 'confirmed', 'quotation', 'closed'];

  for (let i = 0; i < 24; i++) {
    const subId = randomUUID();
    subIds.push(subId);
    const planIdx = i % 3;
    await db.query(
      `INSERT INTO subscriptions (id, subscription_number, customer_id, plan_id, start_date, status, payment_terms, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, 14, $7)`,
      [subId, `SUB-${String(1001 + i).padStart(4, '0')}`, customerProfileId, planIds[planIdx], '2026-01-01', statuses[i % 6], adminId]
    );

    // Add subscription line
    const planPrice = [125000, 249000, 499000][planIdx];
    await db.query(
      `INSERT INTO subscription_lines (id, subscription_id, product_id, quantity, unit_price_cents, tax_rate, tax_amount_cents, amount_cents)
       VALUES ($1, $2, $3, 1, $4, 0, 0, $4)`,
      [randomUUID(), subId, productIds[planIdx], planPrice]
    );
  }

  // Create sample invoices & payments
  for (let i = 0; i < 36; i++) {
    const invId = randomUUID();
    const amount = [125000, 249000, 499000][i % 3] * (1 + i % 4);
    const month = String(1 + i % 10).padStart(2, '0');
    const status = i > 29 ? 'confirmed' : 'paid';

    await db.query(
      `INSERT INTO invoices (id, invoice_number, subscription_id, customer_id, status, subtotal_cents, tax_total_cents, grand_total_cents, billing_period_start, billing_period_end)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [invId, `INV-${String(2001 + i).padStart(4, '0')}`, subIds[i % 24], customerProfileId, status, amount, 0, amount, `2026-${month}-01`, `2026-${month}-28`]
    );

    if (i <= 29) {
      await db.query(
        `INSERT INTO payments (id, invoice_id, method, amount_cents, payment_date, recorded_by)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [randomUUID(), invId, ['Bank transfer', 'Card', 'UPI'][i % 3], amount, `2026-${month}-05`, adminId]
      );
    }
  }

  // Create quotation
  const quoId = randomUUID();
  await db.query(
    `INSERT INTO quotation_templates (id, name, plan_id, validity_days, created_by)
     VALUES ($1, $2, $3, 30, $4)`,
    [quoId, 'Standard monthly subscription', planIds[2], adminId]
  );

  console.log('Seeding complete!');
}

export async function close() {
  await db.end();
}
