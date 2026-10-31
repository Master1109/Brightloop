import { Injectable } from '@nestjs/common';
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
} from '../../entities/index';

@Injectable()
export class BootstrapService {
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
    @InjectRepository(SubscriptionLine)
    private subLineRepo: Repository<SubscriptionLine>,
    @InjectRepository(InvoiceLine)
    private invoiceLineRepo: Repository<InvoiceLine>,
  ) {}

  async getBootstrap(userId: string) {
    const account = await this.accountRepo.findOne({
      where: { id: userId },
      relations: ['customer_profile'],
    });

    if (!account) {
      throw new Error('User not found');
    }

    const isDemo = process.env.NODE_ENV === 'development';
    const role = account.role === 'admin' ? 'ADMIN' : account.role === 'staff' ? 'STAFF' : 'CUSTOMER';

    const user = {
      id: account.id,
      email: account.email,
      name:
        account.role === 'customer'
          ? account.customer_profile?.company_name || account.email
          : account.email,
      role: role,
    };

    // Build records array (what the frontend expects)
    const records: any[] = [];

    // Get all subscriptions for this user
    let subscriptions: Subscription[] = [];
    if (account.role === 'customer') {
      subscriptions = await this.subscriptionRepo.find({
        where: { customer_id: userId },
        relations: ['plan', 'lines'],
      });
    } else {
      subscriptions = await this.subscriptionRepo.find({
        relations: ['plan', 'lines'],
      });
    }

    // Build plan and customer name lookups
    const plans = await this.planRepo.find();
    const planMap = new Map(plans.map((p) => [p.id, p]));
    const customers = await this.accountRepo.find({ where: { role: 'customer' } });
    const customerMap = new Map(customers.map((c) => [c.id, c.email]));

    // Process subscriptions
    for (const sub of subscriptions) {
      const plan = planMap.get(sub.plan_id);
      let amount = plan ? plan.price_cents / 100 : 0;

      records.push({
        id: sub.id,
        kind: 'subscriptions',
        name: sub.subscription_number,
        status: sub.status,
        amount: amount,
        customer_id: sub.customer_id,
        plan_id: sub.plan_id,
        data: {
          start_date: sub.start_date ? sub.start_date.toISOString().split('T')[0] : null,
          expiry_date: sub.expiry_date ? sub.expiry_date.toISOString().split('T')[0] : null,
          payment_terms: sub.payment_terms,
          frequency: plan ? plan.billing_frequency : 'Monthly',
          quantity: sub.lines?.[0]?.quantity || 1,
          next_billing: sub.expiry_date ? sub.expiry_date.toISOString().split('T')[0] : null,
        },
      });
    }

    // Get invoices
    let invoices: Invoice[] = [];
    if (account.role === 'customer') {
      invoices = await this.invoiceRepo.find({
        where: { customer_id: userId },
      });
    } else {
      invoices = await this.invoiceRepo.find();
    }

    for (const inv of invoices) {
      records.push({
        id: inv.id,
        kind: 'invoices',
        name: inv.invoice_number,
        status: inv.status,
        amount: inv.grand_total_cents / 100,
        customer_id: inv.customer_id,
        data: {
          invoice_date: inv.created_at.toISOString().split('T')[0],
          due_date: inv.billing_period_end
            ? inv.billing_period_end.toISOString().split('T')[0]
            : null,
          paid: inv.status === 'paid' ? inv.grand_total_cents / 100 : 0,
        },
      });
    }

    // Get payments
    let payments: Payment[] = [];
    if (account.role === 'customer') {
      payments = await this.paymentRepo.find({
        where: { invoice: { customer_id: userId } },
        relations: ['invoice'],
      });
    } else {
      payments = await this.paymentRepo.find({ relations: ['invoice'] });
    }

    for (const pay of payments) {
      records.push({
        id: pay.id,
        kind: 'payments',
        name: `Payment for ${pay.invoice?.invoice_number || 'invoice'}`,
        status: 'Recorded',
        amount: pay.amount_cents / 100,
        customer_id: pay.invoice?.customer_id,
        data: {
          payment_date: pay.payment_date.toISOString().split('T')[0],
          method: pay.method,
          note: pay.note,
        },
      });
    }

    // Get team
    const team = await this.accountRepo.find({
      where: { role: 'staff' },
    });
    const teamList = team.map((t) => ({
      id: t.id,
      name: t.email,
      email: t.email,
      role: t.role,
    }));

    return {
      user,
      records,
      team: teamList,
      demo: isDemo,
    };
  }
}
