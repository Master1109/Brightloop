import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Account,
  Subscription,
  Invoice,
  Payment,
  Plan,
  Product,
  SubscriptionLine,
  InvoiceLine,
  TaxRule,
  Discount,
  QuotationTemplate,
  CustomerProfile,
  QuotationTemplateLine,
  AuditLog,
} from '../../entities/index';

@Injectable()
export class RecordsService {
  constructor(
    @InjectRepository(Account)
    private accountRepo: Repository<Account>,
    @InjectRepository(Subscription)
    private subscriptionRepo: Repository<Subscription>,
    @InjectRepository(Invoice)
    private invoiceRepo: Repository<Invoice>,
    @InjectRepository(Payment)
    private paymentRepo: Repository<Payment>,
    @InjectRepository(Plan)
    private planRepo: Repository<Plan>,
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
    @InjectRepository(TaxRule)
    private taxRepo: Repository<TaxRule>,
    @InjectRepository(Discount)
    private discountRepo: Repository<Discount>,
    @InjectRepository(QuotationTemplate)
    private templateRepo: Repository<QuotationTemplate>,
    @InjectRepository(CustomerProfile)
    private customerProfileRepo: Repository<CustomerProfile>,
    @InjectRepository(SubscriptionLine)
    private subLineRepo: Repository<SubscriptionLine>,
    @InjectRepository(InvoiceLine)
    private invoiceLineRepo: Repository<InvoiceLine>,
    @InjectRepository(QuotationTemplateLine)
    private templateLineRepo: Repository<QuotationTemplateLine>,
    @InjectRepository(AuditLog)
    private auditRepo: Repository<AuditLog>,
  ) {}

  async listAll() {
    const records: any[] = [];

    const plans = await this.planRepo.find();
    const products = await this.productRepo.find();
    const customers = await this.accountRepo.find({
      where: { role: 'customer' },
      relations: ['customer_profile'],
    });
    const subscriptions = await this.subscriptionRepo.find({ relations: ['plan', 'lines'] });
    const invoices = await this.invoiceRepo.find();
    const payments = await this.paymentRepo.find();
    const discounts = await this.discountRepo.find();
    const taxRules = await this.taxRepo.find();
    const templates = await this.templateRepo.find();

    const planMap = new Map(plans.map((p) => [p.id, p]));
    const productMap = new Map(products.map((p) => [p.id, p]));
    const customerMap = new Map(
      customers.map((c) => [
        c.id,
        c.customer_profile?.company_name || c.email,
      ]),
    );

    plans.forEach((p) => {
      records.push({
        id: p.id,
        kind: 'plans',
        name: p.name,
        amount: p.price_cents / 100,
        status: p.is_active ? 'Active' : 'Inactive',
        customer_id: null,
        plan_id: null,
        data: {
          billing_frequency: p.billing_frequency,
          min_quantity: p.min_quantity,
          available_from: p.available_from,
          available_until: p.available_until,
          end_of_term_behavior: p.end_of_term_behavior,
          product_id: p.id, // for lookup in frontend
          is_active: p.is_active,
        },
      });
    });

    products.forEach((p) => {
      records.push({
        id: p.id,
        kind: 'products',
        name: p.name,
        amount: p.sales_price_cents / 100,
        status: p.is_active ? 'Active' : 'Inactive',
        customer_id: null,
        plan_id: null,
        data: {
          type: p.type,
          cost_price_cents: p.cost_price_cents,
          sales_price_cents: p.sales_price_cents,
          notes: p.notes,
          is_active: p.is_active,
          variants: p.variants,
        },
      });
    });

    customers.forEach((c) => {
      records.push({
        id: c.id,
        kind: 'customers',
        name: c.customer_profile?.company_name || c.email,
        amount: 0,
        status: 'Active',
        customer_id: c.id,
        plan_id: null,
        data: {
          email: c.email,
          contact: c.customer_profile?.billing_address || '',
          phone: '',
          address: c.customer_profile?.billing_address || '',
        },
      });
    });

    subscriptions.forEach((s) => {
      const plan = planMap.get(s.plan_id);
      const amount = plan ? plan.price_cents / 100 : 0;
      records.push({
        id: s.id,
        kind: 'subscriptions',
        name: s.subscription_number,
        amount: amount,
        status: this.capitalizeStatus(s.status),
        customer_id: s.customer_id,
        plan_id: s.plan_id,
        data: {
          start_date: s.start_date instanceof Date ? s.start_date.toISOString().split('T')[0] : s.start_date,
          expiry_date: s.expiry_date instanceof Date ? s.expiry_date.toISOString().split('T')[0] : s.expiry_date,
          payment_terms: s.payment_terms,
          frequency: plan ? plan.billing_frequency : 'Monthly',
          quantity: s.lines?.[0]?.quantity || 1,
          next_billing: s.expiry_date instanceof Date ? s.expiry_date.toISOString().split('T')[0] : s.expiry_date,
        },
      });
    });

    invoices.forEach((inv) => {
      const customerName = customerMap.get(inv.customer_id) || '—';
      let paid = 0;
      const payments = this.paymentRepo.find({ where: { invoice_id: inv.id } });
      payments.then((pays) => {
        paid = pays.reduce((acc, p) => acc + p.amount_cents, 0) / 100;
      });
      records.push({
        id: inv.id,
        kind: 'invoices',
        name: inv.invoice_number,
        amount: inv.grand_total_cents / 100,
        status: this.capitalizeStatus(inv.status),
        customer_id: inv.customer_id,
        plan_id: null,
        data: {
          invoice_date: inv.created_at.toISOString().split('T')[0],
          due_date: inv.billing_period_end instanceof Date ? inv.billing_period_end.toISOString().split('T')[0] : null,
          paid: paid,
        },
      });
    });

    discounts.forEach((d) => {
      records.push({
        id: d.id,
        kind: 'discounts',
        name: d.name,
        amount: d.type === 'fixed' ? d.value_cents / 100 : d.percentage,
        status: d.is_active ? 'Active' : 'Inactive',
        customer_id: null,
        plan_id: null,
        data: {
          type: d.type,
          value_cents: d.value_cents,
          percentage: d.percentage,
          min_purchase_cents: d.min_purchase_cents,
          min_quantity: d.min_quantity,
          start_date: d.start_date,
          end_date: d.end_date,
          usage_limit: d.usage_limit,
          usage_count: d.usage_count,
          scope: d.scope,
          is_active: d.is_active,
        },
      });
    });

    taxRules.forEach((t) => {
      records.push({
        id: t.id,
        kind: 'taxes',
        name: t.name,
        amount: Number(t.rate) * 100,
        status: t.is_active ? 'Active' : 'Inactive',
        customer_id: null,
        plan_id: null,
        data: {
          rate: t.rate,
          applicable_to: t.applicable_to,
          is_active: t.is_active,
        },
      });
    });

    templates.forEach((tmpl) => {
      const plan = planMap.get(tmpl.plan_id);
      records.push({
        id: tmpl.id,
        kind: 'quotations',
        name: tmpl.name,
        amount: plan ? plan.price_cents / 100 : 0,
        status: 'Quotation',
        customer_id: null,
        plan_id: tmpl.plan_id,
        data: {
          validity_days: tmpl.validity_days,
          plan_id: tmpl.plan_id,
          expires_at: tmpl.expires_at,
        },
      });
    });

    return records;
  }

  async listByKind(kind: string) {
    const all = await this.listAll();
    return all.filter((r) => r.kind === kind);
  }

  capitalizeStatus(status: string): string {
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  async create(kind: string, body: any, userId: string) {
    // Map the frontend kind to entity operations
    switch (kind) {
      case 'customers':
        return this.createCustomer(body, userId);
      case 'plans':
        return this.createPlan(body, userId);
      case 'products':
        return this.createProduct(body, userId);
      case 'subscriptions':
        return this.createSubscription(body, userId);
      case 'invoices':
        return this.createInvoice(body, userId);
      case 'payments':
        return this.createPayment(body, userId);
      default:
        return { success: true, kind, received: body };
    }
  }

  private async createCustomer(body: any, userId: string) {
    const account = this.accountRepo.create({
      email: body.data.email.toLowerCase(),
      password_hash: '', // No password for managed customers
      role: 'customer',
      is_active: true,
    });
    const saved = await this.accountRepo.save(account);
    const profile = this.customerProfileRepo.create({
      account_id: saved.id,
      company_name: body.name,
      billing_address: body.data?.address || '',
    });
    await this.customerProfileRepo.save(profile);
    return { id: saved.id, kind: 'customers', name: saved.email, status: 'Active' };
  }

  private async createPlan(body: any, userId: string) {
    const product = await this.productRepo.findOne({ where: { id: body.data.product_id } });
    const plan = this.planRepo.create({
      name: body.name,
      price_cents: Math.round(body.amount * 100),
      billing_frequency: body.data?.frequency || 'monthly',
      min_quantity: body.data?.minimum_quantity || 1,
      end_of_term_behavior: 'auto_close',
      is_active: true,
    });
    const saved = await this.planRepo.save(plan);
    return { id: saved.id, kind: 'plans', name: saved.name, amount: saved.price_cents / 100, status: 'Active' };
  }

  private async createProduct(body: any, userId: string) {
    const product = this.productRepo.create({
      name: body.name,
      type: body.data?.type || 'Service',
      sales_price_cents: Math.round(body.amount * 100),
      cost_price_cents: Math.round(body.data?.cost || 0),
      notes: body.data?.notes || '',
      is_active: true,
    });
    const saved = await this.productRepo.save(product);
    return { id: saved.id, kind: 'products', name: saved.name, amount: saved.sales_price_cents / 100, status: 'Active' };
  }

  private async createSubscription(body: any, userId: string) {
    const plan = await this.planRepo.findOne({ where: { id: body.data.plan_id } });
    const sub = this.subscriptionRepo.create({
      subscription_number: `SUB-${Date.now()}`,
      customer_id: body.data.customer_id,
      plan_id: body.data.plan_id || plan?.id,
      start_date: new Date(body.data.start_date),
      expiry_date: body.data.expiry_date ? new Date(body.data.expiry_date) : null,
      payment_terms: body.data.payment_terms?.toString() || '14',
      status: 'draft',
      created_by: userId,
    });
    const saved = await this.subscriptionRepo.save(sub);
    return { id: saved.id, kind: 'subscriptions', name: saved.subscription_number, amount: plan ? plan.price_cents / 100 : 0, status: 'Draft' };
  }

  private async createInvoice(body: any, userId: string) {
    const invoice = this.invoiceRepo.create({
      invoice_number: `INV-${Date.now()}`,
      subscription_id: body.data.subscription_id,
      customer_id: body.data.customer_id,
      status: 'draft',
      subtotal_cents: 0,
      tax_total_cents: 0,
      discount_total_cents: 0,
      grand_total_cents: 0,
      idempotency_key: `inv-${Date.now()}`,
    });
    const saved = await this.invoiceRepo.save(invoice);
    return { id: saved.id, kind: 'invoices', name: saved.invoice_number, amount: 0, status: 'Draft' };
  }

  private async createPayment(body: any, userId: string) {
    const payment = this.paymentRepo.create({
      invoice_id: body.data.invoice_id,
      method: body.data.method || 'Bank transfer',
      amount_cents: Math.round(body.amount * 100),
      payment_date: body.data.payment_date ? new Date(body.data.payment_date) : new Date(),
      note: body.data.note || '',
      recorded_by: userId,
    });
    const saved = await this.paymentRepo.save(payment);
    return { id: saved.id, kind: 'payments', name: `Payment for invoice ${body.data.invoice_id}`, amount: saved.amount_cents / 100, status: 'Recorded' };
  }

  async update(kind: string, id: string, body: any, userId: string) {
    switch (kind) {
      case 'customers':
        return this.updateCustomer(id, body);
      case 'plans':
        return this.updatePlan(id, body);
      case 'products':
        return this.updateProduct(id, body);
      case 'subscriptions':
        return this.updateSubscription(id, body);
      case 'invoices':
        return this.updateInvoice(id, body);
      default:
        return { success: true, kind, id, updated: body };
    }
  }

  private async updateCustomer(id: string, body: any) {
    const profile = await this.customerProfileRepo.findOne({ where: { account_id: id } });
    if (profile) {
      profile.company_name = body.name;
      profile.billing_address = body.data?.address || profile.billing_address;
      await this.customerProfileRepo.save(profile);
    }
    const account = await this.accountRepo.findOne({ where: { id } });
    if (account && body.data?.email) {
      account.email = body.data.email;
      await this.accountRepo.save(account);
    }
    return { id, success: true };
  }

  private async updatePlan(id: string, body: any) {
    const plan = await this.planRepo.findOne({ where: { id } });
    if (!plan) throw new NotFoundException('Plan not found');
    plan.name = body.name;
    plan.price_cents = Math.round(body.amount * 100);
    await this.planRepo.save(plan);
    return { id, success: true };
  }

  private async updateProduct(id: string, body: any) {
    const product = await this.productRepo.findOne({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    product.name = body.name;
    product.sales_price_cents = Math.round(body.amount * 100);
    await this.productRepo.save(product);
    return { id, success: true };
  }

  private async updateSubscription(id: string, body: any) {
    const sub = await this.subscriptionRepo.findOne({ where: { id } });
    if (!sub) throw new NotFoundException('Subscription not found');
    if (body.data?.start_date) sub.start_date = new Date(body.data.start_date);
    if (body.data?.expiry_date) sub.expiry_date = new Date(body.data.expiry_date);
    if (body.data?.payment_terms) sub.payment_terms = body.data.payment_terms;
    if (body.status) sub.status = body.status.toLowerCase() as any;
    await this.subscriptionRepo.save(sub);
    return { id, success: true, newStatus: sub.status };
  }

  private async updateInvoice(id: string, body: any) {
    const invoice = await this.invoiceRepo.findOne({ where: { id } });
    if (!invoice) throw new NotFoundException('Invoice not found');
    await this.invoiceRepo.save(invoice);
    return { id, success: true };
  }

  async performAction(kind: string, id: string, action: string, userId: string) {
    // Log the action in audit_log
    await this.auditRepo.save({
      actor_id: userId,
      action: action,
      entity_type: kind,
      entity_id: id,
      before: null,
      after: null,
    });

    switch (kind) {
      case 'subscriptions': {
        const sub = await this.subscriptionRepo.findOne({ where: { id }, relations: ['plan'] });
        if (!sub) throw new NotFoundException('Subscription not found');
        let newStatus = sub.status;
        switch (action) {
          case 'Quotation': newStatus = 'quotation'; break;
          case 'Confirm': newStatus = 'confirmed'; break;
          case 'Activate': newStatus = 'active'; break;
          case 'Pause': newStatus = 'paused' as any; break;
          case 'Closed': newStatus = 'closed'; break;
          case 'Renew': newStatus = 'active'; break;
          default: newStatus = action.toLowerCase() as any;
        }
        sub.status = newStatus;
        await this.subscriptionRepo.save(sub);
        return { id, kind, newStatus: this.capitalizeStatus(newStatus) };
      }
      case 'quotations': {
        const tmpl = await this.templateRepo.findOne({ where: { id } });
        if (!tmpl) throw new NotFoundException('Quotation not found');
        return { id, kind, action };
      }
      case 'invoices': {
        const invoice = await this.invoiceRepo.findOne({ where: { id } });
        if (!invoice) throw new NotFoundException('Invoice not found');
        if (action === 'send') {
          invoice.status = 'confirmed';
          invoice.sent_at = new Date();
        } else if (action === 'mark_as_paid') {
          invoice.status = 'paid';
          invoice.paid_at = new Date();
        }
        await this.invoiceRepo.save(invoice);
        return { id, kind, newStatus: this.capitalizeStatus(invoice.status) };
      }
      default:
        return { id, kind, action };
    }
  }

  async getHistory(kind: string, id: string) {
    const logs = await this.auditRepo.find({
      where: { entity_type: kind, entity_id: id },
      order: { created_at: 'DESC' },
    });
    // Also get basic history from the entity itself
    let entity: any = null;
    switch (kind) {
      case 'subscriptions':
        entity = await this.subscriptionRepo.findOne({ where: { id } });
        break;
      case 'invoices':
        entity = await this.invoiceRepo.findOne({ where: { id } });
        break;
    }

    const history = logs.map((log) => ({
      id: log.id,
      action: log.action,
      actor: log.actor_id,
      before: log.before,
      after: log.after,
      created_at: log.created_at.toISOString(),
    }));

    // Add the entity's own updated_at as a history entry
    if (entity?.updated_at) {
      history.unshift({
        id: `upd-${entity.id}`,
        action: 'Updated',
        actor: entity.created_by || 'system',
        before: null,
        after: null,
        created_at: entity.updated_at.toISOString(),
      });
    }

    return history;
  }

  async delete(kind: string, id: string, userId: string) {
    switch (kind) {
      case 'customers':
        await this.accountRepo.delete(id);
        break;
      case 'plans':
        await this.planRepo.delete(id);
        break;
      case 'products':
        await this.productRepo.delete(id);
        break;
      case 'subscriptions':
        await this.subscriptionRepo.delete(id);
        break;
      case 'invoices':
        await this.invoiceRepo.delete(id);
        break;
      case 'payments':
        await this.paymentRepo.delete(id);
        break;
      case 'quotations':
        await this.templateRepo.delete(id);
        break;
      case 'discounts':
        await this.discountRepo.delete(id);
        break;
      case 'taxes':
        await this.taxRepo.delete(id);
        break;
      default:
        return { success: true, kind, id };
    }
    return { id, kind, deleted: true };
  }
}
