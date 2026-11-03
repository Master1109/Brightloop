import 'reflect-metadata';
import { config } from 'dotenv';
config({ path: '.env' });

import { Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { randomUUID, createHash, randomBytes } from 'node:crypto';
import { hash, compare } from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { Queue, Worker } from 'bullmq';
import nodemailer from 'nodemailer';
import PDFDocument from 'pdfkit';
import { db, init, calculateTotals, nextBillingDate, cents, toCents, close } from './db';

@Module({}) class AppModule {}

const secret = process.env.JWT_SECRET || 'development-only-brightloop-secret-2026';
if (!secret) throw Error('JWT_SECRET required');

const passwordSchema = z.string().min(9).regex(/[A-Z]/).regex(/[a-z]/).regex(/[^A-Za-z0-9]/);

const mail = () => nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 1025),
  secure: false,
  ...(process.env.SMTP_USER ? { auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } } : {})
});

// Serializes mutations
let mutation = Promise.resolve();
function serial<T>(fn: () => Promise<T>): Promise<T> {
  const p = mutation.then(fn);
  mutation = p.then(() => {}, () => {});
  return p;
}

async function transaction<T>(fn: (client: any) => Promise<T>): Promise<T> {
  const client = await db.connect();
  await client.query('BEGIN');
  try {
    const value = await fn(client);
    await client.query('COMMIT');
    return value;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

// ============================================================================
// BILLING ENGINE
// ============================================================================

async function bill(asOf = new Date().toISOString().slice(0, 10)) {
  return serial(() => transaction(async (client) => {
    // Get active subscriptions
    const subsResult = await client.query(`
      SELECT s.*, p.price_cents, p.billing_frequency, p.name as plan_name
      FROM subscriptions s
      JOIN plans p ON s.plan_id = p.id
      WHERE s.status = 'active'
    `);

    let count = 0;

    for (const sub of subsResult.rows) {
      let date = sub.start_date;
      let periods = 0;

      while (date && date <= asOf && periods++ < 3660) {
        // Check expiry
        if (sub.expiry_date && new Date(date) > new Date(sub.expiry_date)) {
          await client.query(`UPDATE subscriptions SET status = 'closed', updated_at = now() WHERE id = $1`, [sub.id]);
          break;
        }

        // Check if already billed for this period
        const existing = await client.query(
          'SELECT id FROM billing_periods WHERE subscription_id = $1 AND period = $2',
          [sub.id, date]
        );

        if (!existing.rowCount) {
          // Calculate discount
          let discountCents = 0;
          const discounts = await client.query(`
            SELECT d.* FROM discounts d
            WHERE d.is_active = true
            AND (d.start_date IS NULL OR d.start_date <= $1)
            AND (d.end_date IS NULL OR d.end_date >= $1)
            AND (d.usage_limit IS NULL OR d.usage_count < d.usage_limit)
          `, [date]);

          for (const d of discounts.rows) {
            if (d.scope === 'specific_products') {
              // Check if subscription has this product
              const hasProduct = await client.query(
                'SELECT 1 FROM subscription_lines WHERE subscription_id = $1 AND product_id = ANY($2)',
                [sub.id, d.product_ids || []]
              );
              if (!hasProduct.rowCount) continue;
            }

            if (d.type === 'percentage') {
              discountCents += Math.round(sub.price_cents * d.percentage / 100);
            } else {
              discountCents += d.value_cents || 0;
            }

            // Increment usage count
            await client.query('UPDATE discounts SET usage_count = usage_count + 1 WHERE id = $1', [d.id]);
          }

          const totals = calculateTotals(sub.price_cents, 1, 0, discountCents);

          const dueDate = new Date(date);
          dueDate.setUTCDate(dueDate.getUTCDate() + 14);

          const invoiceId = randomUUID();
          const invoiceNumber = `INV-${invoiceId.slice(0, 8).toUpperCase()}`;

          await client.query(`
            INSERT INTO invoices (id, invoice_number, subscription_id, customer_id, status,
              subtotal_cents, tax_total_cents, discount_total_cents, grand_total_cents,
              billing_period_start, billing_period_end)
            VALUES ($1, $2, $3, $4, 'draft', $5, $6, $7, $8, $9, $10)
          `, [
            invoiceId, invoiceNumber, sub.id, sub.customer_id,
            totals.subtotalCents, totals.taxCents, totals.discountCents, totals.totalCents,
            date, date
          ]);

          // Add invoice line
          await client.query(`
            INSERT INTO invoice_lines (id, invoice_id, product_id, quantity, unit_price_cents, tax_rate, amount_cents)
            SELECT $1, $2, sl.product_id, sl.quantity, sl.unit_price_cents, sl.tax_rate, sl.amount_cents
            FROM subscription_lines sl WHERE sl.subscription_id = $3
          `, [randomUUID(), invoiceId, sub.id]);

          await client.query(
            'INSERT INTO billing_periods (subscription_id, period, invoice_id) VALUES ($1, $2, $3)',
            [sub.id, date, invoiceId]
          );
          count++;
        }

        date = nextBillingDate(date, sub.billing_frequency);
      }
    }

    return { count };
  }));
}

// ============================================================================
// AUTH HELPERS
// ============================================================================

async function getAccountByEmail(email: string) {
  const r = await db.query('SELECT * FROM accounts WHERE email = $1', [email.toLowerCase()]);
  return r.rows[0];
}

async function getAccountById(id: string) {
  const r = await db.query('SELECT * FROM accounts WHERE id = $1', [id]);
  return r.rows[0];
}

async function getCustomerProfile(accountId: string) {
  const r = await db.query('SELECT * FROM customer_profiles WHERE account_id = $1', [accountId]);
  return r.rows[0];
}

// ============================================================================
// BOOTSTRAP
// ============================================================================

async function bootstrap() {
  await init();

  const app = await NestFactory.create<NestExpressApplication>(AppModule, { logger: ['error', 'warn'] });
  app.enableCors({ origin: true, credentials: true });
  app.use((req: any, res: any, next: any) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();
  });
  app.useBodyParser('json', { limit: '100kb' });

  const api = app.getHttpAdapter().getInstance();

  // Health check
  api.get('/health', (_: any, res: any) => res.json({ ok: true, demo: false }));

  // Rate limiting for auth
  const attempts = new Map<string, { count: number, at: number }>();

  // Auth endpoints
  api.post('/auth/:action', async (req: any, res: any) => {
    try {
      const key = req.ip;
      const now = Date.now();
      const a = attempts.get(key);
      if (a && now - a.at < 60000 && a.count >= 20) {
        return res.status(429).json({ error: 'Too many attempts. Try in a minute.' });
      }
      attempts.set(key, { count: a && now - a.at < 60000 ? a.count + 1 : 1, at: a && now - a.at < 60000 ? a.at : now });

      const { action } = req.params;
      const body = req.body || {};

      if (action === 'reset') {
        const password = passwordSchema.parse(body.password);
        const token = createHash('sha256').update(String(body.token)).digest('hex');
        const account = (await db.query('SELECT * FROM accounts WHERE reset_token = $1', [token])).rows[0];
        if (!account || Number(account.reset_expires) < Date.now()) throw Error('Invalid or expired reset link');
        await db.query('UPDATE accounts SET password_hash = $2, reset_token = NULL, reset_expires = NULL WHERE id = $1', [account.id, await hash(password, 12)]);
        return res.json({ ok: true });
      }

      const email = z.string().email().parse(body.email).toLowerCase();

      if (action === 'forgot') {
        const account = await getAccountByEmail(email);
        if (account && process.env.SMTP_HOST) {
          const token = randomBytes(32).toString('hex');
          await db.query(
            'UPDATE accounts SET reset_token = $2, reset_expires = $3 WHERE id = $1',
            [account.id, createHash('sha256').update(token).digest('hex'), Date.now() + 3600000]
          );
          await mail().sendMail({
            from: process.env.MAIL_FROM || 'hello@brightloop.local',
            to: email,
            subject: 'Reset your Brightloop password',
            text: `Reset your password: ${process.env.APP_URL || 'http://localhost:3000'}?reset=${token}`
          });
        }
        return res.json({ message: 'If this account exists, a reset link will be sent.' });
      }

      if (action === 'register') {
        const password = passwordSchema.parse(body.password);
        const name = z.string().min(2).max(100).parse(body.name);
        if ((await db.query('SELECT id FROM accounts WHERE email = $1', [email])).rowCount) throw Error('Email already registered');

        const accountId = randomUUID();
        await db.query(
          'INSERT INTO accounts (id, email, password_hash, role) VALUES ($1, $2, $3, $4)',
          [accountId, email, await hash(password, 12), 'customer']
        );
        await db.query(
          'INSERT INTO customer_profiles (id, account_id, company_name) VALUES ($1, $2, $3)',
          [randomUUID(), accountId, name]
        );
        return res.json({ ok: true });
      }

      if (!['login', 'register'].includes(action)) throw Error('Unknown action');

      const account = await getAccountByEmail(email);
      if (!account || !await compare(String(body.password), account.password_hash)) {
        return res.status(401).json({ error: 'Incorrect email or password' });
      }

      const payload = { id: account.id, email: account.email, role: account.role };
      res.json({ user: payload, token: jwt.sign(payload, secret, { expiresIn: '8h' }) });

    } catch (e: any) {
      res.status(400).json({ error: e instanceof z.ZodError ? 'Please check the email and password requirements.' : e.message });
    }
  });

  // Auth middleware
  api.use('/api', async (req: any, res: any, next: any) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      const claims = jwt.verify(token || '', secret) as any;
      const account = await getAccountById(claims.id);
      if (!account) throw Error();
      req.account = account;
      next();
    } catch {
      res.status(401).json({ error: 'Please sign in again' });
    }
  });

  // ============================================================================
  // API ENDPOINTS
  // ============================================================================

  // Bootstrap - full workspace data
  api.get('/api/bootstrap', async (req: any, res: any) => {
    try {
      const account = req.account;

      // Get customer profile if customer
      let customerProfile = null;
      if (account.role === 'customer') {
        customerProfile = await getCustomerProfile(account.id);
      }

      // Fetch all data
      const [
        accounts,
        products,
        plans,
        subscriptions,
        invoices,
        payments,
        discounts,
        taxRules,
        quotationTemplates
      ] = await Promise.all([
        account.role === 'admin' ? db.query('SELECT id, email, email as name, role FROM accounts') : Promise.resolve({ rows: [] }),
        db.query('SELECT * FROM products WHERE is_active = true'),
        db.query('SELECT * FROM plans WHERE is_active = true'),
        db.query(`
          SELECT s.*, p.name as plan_name, p.price_cents, p.billing_frequency
          FROM subscriptions s
          JOIN plans p ON s.plan_id = p.id
          ${account.role === 'customer' && customerProfile ? 'WHERE s.customer_id = $1' : ''}
          ORDER BY s.created_at DESC
        `, account.role === 'customer' && customerProfile ? [customerProfile.id] : []),
        db.query(`
          SELECT i.*, s.subscription_number
          FROM invoices i
          LEFT JOIN subscriptions s ON i.subscription_id = s.id
          ${account.role === 'customer' && customerProfile ? 'WHERE i.customer_id = $1' : ''}
          ORDER BY i.created_at DESC
        `, account.role === 'customer' && customerProfile ? [customerProfile.id] : []),
        db.query(`
          SELECT p.*, i.invoice_number
          FROM payments p
          LEFT JOIN invoices i ON p.invoice_id = i.id
          ${account.role === 'customer' && customerProfile ? 'WHERE i.customer_id = $1' : ''}
          ORDER BY p.created_at DESC
        `, account.role === 'customer' && customerProfile ? [customerProfile.id] : []),
        db.query('SELECT * FROM discounts WHERE is_active = true'),
        db.query('SELECT * FROM tax_rules WHERE is_active = true'),
        db.query('SELECT * FROM quotation_templates'),
      ]);

      // Format response to match frontend expectations
      const formatMoney = (cents: number) => cents / 100;

      const records = [
        ...products.rows.map(p => ({
          id: p.id, kind: 'products', name: p.name, status: p.is_active ? 'Active' : 'Archived',
          amount: formatMoney(p.sales_price_cents), data: { type: p.type, cost: formatMoney(p.cost_price_cents || 0) }, created_at: p.created_at
        })),
        ...plans.rows.map(p => ({
          id: p.id, kind: 'plans', name: p.name, status: p.is_active ? 'Active' : 'Archived',
          amount: formatMoney(p.price_cents), data: { frequency: p.billing_frequency, minimum_quantity: p.min_quantity }, created_at: p.created_at
        })),
        ...subscriptions.rows.map(s => ({
          id: s.id, kind: 'subscriptions', name: s.subscription_number, status: s.status,
          amount: formatMoney(s.price_cents), customer_id: s.customer_id, plan_id: s.plan_id,
          data: { start_date: s.start_date, payment_terms: s.payment_terms, frequency: s.billing_frequency }, created_at: s.created_at
        })),
        ...invoices.rows.map(i => ({
          id: i.id, kind: 'invoices', name: i.invoice_number, status: i.status,
          amount: formatMoney(i.grand_total_cents), customer_id: i.customer_id, plan_id: i.subscription_id,
          data: {
            invoice_date: i.billing_period_start, due_date: i.billing_period_end,
            paid: i.status === 'paid' ? formatMoney(i.grand_total_cents) : 0,
            subtotal: formatMoney(i.subtotal_cents), tax: formatMoney(i.tax_total_cents),
            discount: formatMoney(i.discount_total_cents), total: formatMoney(i.grand_total_cents),
            subscription_id: i.subscription_id
          }, created_at: i.created_at
        })),
        ...payments.rows.map(p => ({
          id: p.id, kind: 'payments', name: `PAY-${p.id.slice(0, 8).toUpperCase()}`, status: 'Recorded',
          amount: formatMoney(p.amount_cents), customer_id: null, plan_id: null,
          data: { invoice_id: p.invoice_id, method: p.method, payment_date: p.payment_date }, created_at: p.created_at
        })),
        ...discounts.rows.map(d => ({
          id: d.id, kind: 'discounts', name: d.name, status: d.is_active ? 'Active' : 'Archived',
          amount: d.type === 'percentage' ? d.percentage : formatMoney(d.value_cents || 0),
          data: { type: d.type, start_date: d.start_date, end_date: d.end_date }, created_at: d.created_at
        })),
        ...taxRules.rows.map(t => ({
          id: t.id, kind: 'taxes', name: t.name, status: t.is_active ? 'Active' : 'Archived',
          amount: t.rate, data: { applicable_to: t.applicable_to }, created_at: t.created_at
        })),
               ...quotationTemplates.rows.map(q => ({
          id: q.id, kind: 'templates', name: q.name, status: 'Active',
          amount: 0, data: { validity_days: q.validity_days }, created_at: q.created_at
        })),
        ...(account.role !== 'customer' ? (await db.query(
          'SELECT cp.*, a.email FROM customer_profiles cp JOIN accounts a ON cp.account_id = a.id'
        )).rows.map((c: any) => ({
          id: c.id, kind: 'customers', name: c.company_name || c.email, status: 'Active',
          amount: 0, customer_id: c.id, data: { email: c.email, contact: c.company_name, address: c.billing_address },
          created_at: c.created_at
        })) : [])
      ];

      // Team members
      const team = accounts.rows.map(a => ({
        id: a.id, name: a.email, email: a.email, role: a.role.toUpperCase()
      }));

      res.json({
        user: { id: account.id, name: account.email, email: account.email, role: account.role.toUpperCase() },
        demo: false,
        records: records.map(r => ({ ...r, amount: Number(r.amount) })),
        team
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Paginated records
  api.get('/api/records/:kind', async (req: any, res: any) => {
    try {
      const { kind } = req.params;
      const account = req.account;
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));

      // Map frontend kinds to queries
      let query = '';
      let params: any[] = [];

      switch (kind) {
        case 'products':
          query = 'SELECT * FROM products WHERE is_active = true ORDER BY created_at DESC';
          break;
        case 'plans':
          query = 'SELECT * FROM plans WHERE is_active = true ORDER BY created_at DESC';
          break;
        case 'subscriptions':
          query = `
            SELECT s.*, p.name as plan_name, p.price_cents, p.billing_frequency
            FROM subscriptions s
            JOIN plans p ON s.plan_id = p.id
            ${account.role === 'customer' ? 'WHERE s.customer_id = (SELECT id FROM customer_profiles WHERE account_id = $1)' : ''}
            ORDER BY s.created_at DESC
          `;
          if (account.role === 'customer') params = [account.id];
          break;
        case 'invoices':
          query = `
            SELECT i.*, s.subscription_number
            FROM invoices i
            LEFT JOIN subscriptions s ON i.subscription_id = s.id
            ${account.role === 'customer' ? 'WHERE i.customer_id = (SELECT id FROM customer_profiles WHERE account_id = $1)' : ''}
            ORDER BY i.created_at DESC
          `;
          if (account.role === 'customer') params = [account.id];
          break;
        case 'payments':
          query = `
            SELECT p.*, i.invoice_number
            FROM payments p
            LEFT JOIN invoices i ON p.invoice_id = i.id
            ${account.role === 'customer' ? 'WHERE i.customer_id = (SELECT id FROM customer_profiles WHERE account_id = $1)' : ''}
            ORDER BY p.created_at DESC
          `;
          if (account.role === 'customer') params = [account.id];
          break;
        case 'discounts':
          query = 'SELECT * FROM discounts WHERE is_active = true ORDER BY created_at DESC';
          break;
        case 'taxes':
          query = 'SELECT * FROM tax_rules WHERE is_active = true ORDER BY created_at DESC';
          break;
        case 'templates':
          query = 'SELECT * FROM quotation_templates ORDER BY created_at DESC';
          break;
        case 'customers':
          if (account.role !== 'admin') return res.status(403).json({ error: 'Access denied' });
          query = `
            SELECT cp.*, a.email
            FROM customer_profiles cp
            JOIN accounts a ON cp.account_id = a.id
            ORDER BY cp.created_at DESC
          `;
          break;
        case 'team':
          if (account.role !== 'admin') return res.status(403).json({ error: 'Access denied' });
          query = 'SELECT id, email, role FROM accounts WHERE role IN (\'admin\', \'staff\') ORDER BY created_at DESC';
          break;
        default:
          return res.status(400).json({ error: 'Unknown resource' });
      }

      // Add pagination
      params.push(limit, (page - 1) * limit);
      query += ` LIMIT $${params.length - 1} OFFSET $${params.length}`;

      const countQuery = query.replace(/SELECT \*|SELECT s\.\*|SELECT i\.\*|SELECT p\.\*|SELECT cp\.\*/, 'SELECT COUNT(*)');
      const [data, countResult] = await Promise.all([
        db.query(query, params),
        db.query(countQuery, params.slice(0, -2))
      ]);

      res.json({ rows: data.rows, count: Number(countResult.rows[0].count), page });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // Record history (audit log)
  api.get('/api/records/:kind/:id/history', async (req: any, res: any) => {
    try {
      const { id } = req.params;
      const logs = await db.query(
        'SELECT * FROM audit_logs WHERE entity_type = $1 AND entity_id = $2 ORDER BY created_at DESC',
        [req.params.kind, id]
      );
      res.json(logs.rows);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // Invoice PDF
  api.get('/api/invoices/:id/pdf', async (req: any, res: any) => {
    try {
      const invoice = (await db.query(`
        SELECT i.*, s.subscription_number, cp.company_name, a.email as customer_email
        FROM invoices i
        LEFT JOIN subscriptions s ON i.subscription_id = s.id
        LEFT JOIN customer_profiles cp ON i.customer_id = cp.id
        LEFT JOIN accounts a ON cp.account_id = a.id
        WHERE i.id = $1
      `, [req.params.id])).rows[0];

      if (!invoice) throw Error('Invoice not found');

      // Check access
      if (req.account.role === 'customer') {
        const customerProfile = await getCustomerProfile(req.account.id);
        if (invoice.customer_id !== customerProfile?.id) throw Error('Access denied');
      }

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${invoice.invoice_number}.pdf"`);

      const pdf = new PDFDocument({ margin: 55 });
      pdf.pipe(res);
      pdf.fontSize(28).text('Brightloop').moveDown()
        .fontSize(20).text(invoice.invoice_number).fontSize(11)
        .text(`Status: ${invoice.status}`).moveDown()
        .text(`Bill to: ${invoice.company_name || 'Customer'}`)
        .text(invoice.customer_email || '')
        .text(`Invoice date: ${invoice.billing_period_start}`)
        .text(`Due: ${invoice.billing_period_end}`)
        .moveDown()
        .text(`Subscription: ${invoice.subscription_number || '—'}`)
        .moveDown()
        .fontSize(11)
        .text(`Subtotal: ${cents(invoice.subtotal_cents).toFixed(2)}`)
        .text(`Tax: ${cents(invoice.tax_total_cents).toFixed(2)}`)
        .text(`Discount: ${cents(invoice.discount_total_cents).toFixed(2)}`)
        .fontSize(16).text(`Total: ${cents(invoice.grand_total_cents).toFixed(2)}`)
        .fontSize(11).text(`Paid: ${invoice.paid_at ? cents(invoice.grand_total_cents).toFixed(2) : '0.00'}`);
      pdf.end();
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // Billing run
  api.post('/api/billing/run', async (req: any, res: any) => {
    if (req.account.role !== 'admin') return res.status(403).json({ error: 'Administrator access required' });
    try {
      res.json(await bill());
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // Create record
  api.post('/api/records/:kind', async (req: any, res: any) => {
    try {
      const { kind } = req.params;
      const account = req.account;

      if (account.role === 'customer') return res.status(403).json({ error: 'Access denied' });
      if (['products', 'plans', 'taxes', 'discounts', 'team'].includes(kind) && account.role !== 'admin') return res.status(403).json({ error: 'Administrator access required' });

      const body = req.body;

      if (kind === 'products') {
        const id = randomUUID();
        await db.query(
          'INSERT INTO products (id, name, type, sales_price_cents, cost_price_cents, notes) VALUES ($1, $2, $3, $4, $5, $6)',
          [id, body.name, body.data.type, toCents(body.amount), toCents(body.data.cost || 0), body.data.notes]
        );
        return res.json({ id, name: body.name });
      }

      if (kind === 'plans') {
        const id = randomUUID();
        await db.query(
          'INSERT INTO plans (id, name, price_cents, billing_frequency, min_quantity, end_of_term_behavior) VALUES ($1, $2, $3, $4, $5, $6)',
          [id, body.name, toCents(body.amount), body.data.frequency, body.data.minimum_quantity || 1, body.data.end_behavior || 'auto_close']
        );
        return res.json({ id, name: body.name });
      }

      if (kind === 'taxes') {
        const id = randomUUID();
        await db.query(
          'INSERT INTO tax_rules (id, name, rate, applicable_to) VALUES ($1, $2, $3, $4)',
          [id, body.name, body.amount, 'all']
        );
        return res.json({ id, name: body.name });
      }

      if (kind === 'discounts') {
        const id = randomUUID();
        await db.query(
          `INSERT INTO discounts (id, name, type, value_cents, percentage, min_purchase_cents, min_quantity, start_date, end_date, usage_limit, scope, created_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [id, body.name, body.data.type, toCents(body.data.value || 0), body.data.percentage || null, toCents(body.data.minimum_amount || 0), body.data.minimum_quantity || null, body.data.start_date || null, body.data.end_date || null, body.data.usage_limit || null, body.data.scope || 'whole_subscription', account.id]
        );
        return res.json({ id, name: body.name });
      }

      if (kind === 'team') {
        const email = z.string().email().parse(body.data.email).toLowerCase();
        const password = passwordSchema.parse(body.data.password);
        const role = z.enum(['STAFF', 'ADMIN']).parse(body.data.role);

        const accountId = randomUUID();
        await db.query(
          'INSERT INTO accounts (id, email, password_hash, role) VALUES ($1, $2, $3, $4)',
          [accountId, email, await hash(password, 12), role.toLowerCase()]
        );

        if (role === 'STAFF') {
          await db.query(
            'INSERT INTO staff_profiles (id, account_id, full_name, created_by) VALUES ($1, $2, $3, $4)',
            [randomUUID(), accountId, body.name, account.id]
          );
        }

        return res.json({ ok: true });
      }

            if (kind === 'subscriptions' || kind === 'quotations') {
        const customerId = body.customer_id;
        const planId = body.plan_id;
        if (!customerId || !planId) throw Error('Customer and plan are required');
        const plan = (await db.query('SELECT * FROM plans WHERE id = $1', [planId])).rows[0];
        if (!plan) throw Error('Plan not found');
        const subId = randomUUID();
        const subNumber = `SUB-${subId.slice(0, 8).toUpperCase()}`;
        const startDate = body.data?.start_date || new Date().toISOString().slice(0, 10);
        const expiryDate = body.data?.expiry_date || null;
        const paymentTerms = body.data?.payment_terms || '14';
        const status = kind === 'quotations' ? 'quotation' : 'draft';
        await db.query(
          `INSERT INTO subscriptions (id, subscription_number, customer_id, plan_id, start_date, expiry_date, payment_terms, status, created_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [subId, subNumber, customerId, planId, startDate, expiryDate, paymentTerms, status, account.id]
        );
        const quantity = Number(body.data?.quantity) || 1;
        const unitPriceCents = plan.price_cents;
        const amountCents = unitPriceCents * quantity;
        await db.query(
          `INSERT INTO subscription_lines (id, subscription_id, product_id, quantity, unit_price_cents, tax_rate, amount_cents)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [randomUUID(), subId, null, quantity, unitPriceCents, 0, amountCents]
        );
        await db.query(
          'INSERT INTO audit_logs (id, actor_id, action, entity_type, entity_id) VALUES ($1, $2, $3, $4, $5)',
          [randomUUID(), account.id, 'create', 'subscriptions', subId]
        );
        return res.json({ id: subId, name: subNumber });
      }

      if (kind === 'customers') {
        const email = z.string().email().parse(body.data?.email || body.email).toLowerCase();
        const name = body.name || body.data?.contact || email;
        let accountId: string;
        const existing = await getAccountByEmail(email);
        if (existing) {
          accountId = existing.id;
          const existingProfile = await getCustomerProfile(accountId);
          if (existingProfile) throw Error('Customer profile already exists for this email');
        } else {
          accountId = randomUUID();
          const tempPass = randomBytes(16).toString('hex');
          await db.query(
            'INSERT INTO accounts (id, email, password_hash, role) VALUES ($1, $2, $3, $4)',
            [accountId, email, await hash(tempPass, 12), 'customer']
          );
        }
        const profileId = randomUUID();
        await db.query(
          'INSERT INTO customer_profiles (id, account_id, company_name, billing_address) VALUES ($1, $2, $3, $4)',
          [profileId, accountId, name, body.data?.address || null]
        );
        return res.json({ id: profileId, name });
      }

      return res.status(400).json({ error: 'Unsupported resource' });
    } catch (e: any) {
      res.status(400).json({ error: e instanceof z.ZodError ? 'Please complete all required fields correctly.' : e.message });
    }
  });

  // Record action (lifecycle)
  api.post('/api/records/:kind/:id/action', async (req: any, res: any) => {
    try {
      const { kind, id } = req.params;
      const { action } = req.body;
      const account = req.account;

      if (account.role !== 'admin' && account.role !== 'staff') return res.status(403).json({ error: 'Access denied' });

      if (kind === 'subscriptions') {
        const sub = (await db.query('SELECT * FROM subscriptions WHERE id = $1', [id])).rows[0];
        if (!sub) throw Error('Subscription not found');

        const transitions: Record<string, string[]> = {
          draft: ['quotation'],
          quotation: ['confirmed', 'closed'],
          confirmed: ['active', 'closed'],
          active: ['paused', 'closed'],
          paused: ['active', 'closed'],
          closed: []
        };

        if (action === 'renew' && sub.status === 'closed') {
          await db.query(
            'UPDATE subscriptions SET status = \'draft\', start_date = $2, updated_at = now() WHERE id = $1',
            [id, new Date().toISOString().slice(0, 10)]
          );
        } else if (transitions[sub.status]?.includes(action)) {
          await db.query(
            'UPDATE subscriptions SET status = $2, updated_at = now() WHERE id = $1',
            [id, action]
          );
        } else {
          throw Error('Invalid lifecycle transition');
        }

        // Audit log
        await db.query(
          'INSERT INTO audit_logs (id, actor_id, action, entity_type, entity_id) VALUES ($1, $2, $3, $4, $5)',
          [randomUUID(), account.id, action, 'subscriptions', id]
        );

        return res.json({ ok: true });
      }

            if (kind === 'invoices') {
        const invoice = (await db.query('SELECT * FROM invoices WHERE id = $1', [id])).rows[0];
        if (!invoice) throw Error('Invoice not found');
        const act = String(action || '').toLowerCase();
        if (act === 'confirmed') {
          if (invoice.status !== 'draft') throw Error('Can only confirm draft invoices');
          await db.query("UPDATE invoices SET status = 'confirmed' WHERE id = $1", [id]);
        } else if (act === 'cancelled') {
          if (!['draft', 'confirmed'].includes(invoice.status)) throw Error('Cannot cancel this invoice');
          await db.query('DELETE FROM invoices WHERE id = $1', [id]);
        } else if (act === 'send') {
          if (process.env.SMTP_HOST) {
            const customer = (await db.query(
              'SELECT a.email FROM customer_profiles cp JOIN accounts a ON cp.account_id = a.id WHERE cp.id = $1',
              [invoice.customer_id]
            )).rows[0];
            if (customer) {
              await mail().sendMail({
                from: process.env.MAIL_FROM || 'hello@brightloop.local',
                to: customer.email,
                subject: `Invoice ${invoice.invoice_number} from Brightloop`,
                text: `Your invoice ${invoice.invoice_number} is ready.`
              });
            }
          }
          await db.query('UPDATE invoices SET sent_at = now() WHERE id = $1', [id]);
        } else {
          throw Error('Invalid invoice action');
        }
        await db.query(
          'INSERT INTO audit_logs (id, actor_id, action, entity_type, entity_id) VALUES ($1, $2, $3, $4, $5)',
          [randomUUID(), account.id, action, 'invoices', id]
        );
        return res.json({ ok: true });
      }

      if (kind === 'quotations' && action === 'active') {
        // Convert quotation to subscription
        // Implementation depends on quotation structure
      }

      res.json({ ok: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // Update record
  api.patch('/api/records/:kind/:id', async (req: any, res: any) => {
    try {
      const { kind, id } = req.params;
      const account = req.account;

      if (account.role !== 'admin') return res.status(403).json({ error: 'Administrator access required' });

      // Implement updates per kind
      if (kind === 'products') {
        await db.query(
          'UPDATE products SET name = $2, sales_price_cents = $3, type = $4, cost_price_cents = $5, notes = $6 WHERE id = $1',
          [id, req.body.name, toCents(req.body.amount), req.body.data.type, toCents(req.body.data.cost || 0), req.body.data.notes]
        );
      }
      // Add other kinds as needed

      res.json({ ok: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // Delete record
  api.delete('/api/records/:kind/:id', async (req: any, res: any) => {
    try {
      if (req.account.role !== 'admin') throw Error('Administrator access required');

      const { kind, id } = req.params;

      // Soft delete or archive based on kind
      if (kind === 'products' || kind === 'plans' || kind === 'taxes' || kind === 'discounts') {
        const tableMap: Record<string, string> = { products: 'products', plans: 'plans', taxes: 'tax_rules', discounts: 'discounts' };
        const table = tableMap[kind];
        await db.query(`UPDATE ${table} SET is_active = false WHERE id = $1`, [id]);
      }

      res.json({ ok: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // Payment recording
  api.post('/api/records/payments', async (req: any, res: any) => {
    try {
      const account = req.account;
      const { name, amount, data } = req.body;

      if (!data.invoice_id) throw Error('Invoice required');

      const invoice = (await db.query('SELECT * FROM invoices WHERE id = $1', [data.invoice_id])).rows[0];
      if (!invoice || !['confirmed', 'draft'].includes(invoice.status)) throw Error('Choose a confirmed unpaid invoice');

      const paidCents = toCents(amount);
      const grandTotalCents = invoice.grand_total_cents;
      if (paidCents <= 0 || paidCents > grandTotalCents) throw Error('Payment exceeds outstanding balance or is zero');

      const paymentId = randomUUID();
      await db.query(
        `INSERT INTO payments (id, invoice_id, method, amount_cents, payment_date, recorded_by)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [paymentId, data.invoice_id, data.method, paidCents, data.payment_date, account.id]
      );

      // Check if fully paid
      const paymentsSum = (await db.query(
        'SELECT COALESCE(SUM(amount_cents), 0) as total FROM payments WHERE invoice_id = $1', [data.invoice_id]
      )).rows[0].total;

      if (Number(paymentsSum) >= grandTotalCents) {
        await db.query('UPDATE invoices SET status = \'paid\', paid_at = now() WHERE id = $1', [data.invoice_id]);
      }

      res.json({ id: paymentId });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // Start server
  const port = Number(process.env.PORT || 4000);
  await app.listen(port, '127.0.0.1');
  console.log(`Brightloop API http://localhost:${port} (PostgreSQL)`);

  // BullMQ workers (if Redis configured)
  if (process.env.REDIS_HOST) {
    const connection = { host: process.env.REDIS_HOST, port: Number(process.env.REDIS_PORT || 6379) };
    const queue = new Queue('billing', { connection });
    new Worker('billing', async () => bill(), { connection, concurrency: 1 });
    await queue.upsertJobScheduler('hourly-billing', { every: 3600000 }, { name: 'invoice-due', data: {}, opts: { attempts: 5, backoff: { type: 'exponential', delay: 1000 }, removeOnComplete: 100, removeOnFail: 100 } });
  }
}

bootstrap().catch(e => { console.error(e); process.exit(1); });