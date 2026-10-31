import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  OneToOne,
  OneToMany,
  JoinColumn,
  BeforeInsert,
  Relation,
} from 'typeorm';

// ── Account ──
export type UserRole = 'admin' | 'staff' | 'customer';

@Entity('accounts')
@Index(['email'])
export class Account {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password_hash: string;

  @Column({
    type: 'enum',
    enum: ['admin', 'staff', 'customer'],
    enumName: 'account_role',
    default: 'customer',
  })
  role: UserRole;

  @Column({ default: true, nullable: true })
  is_active: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updated_at: Date;

  @OneToOne(() => StaffProfile, (profile) => profile.account)
  staff_profile: Relation<StaffProfile>;

  @OneToOne(() => CustomerProfile, (profile) => profile.account)
  customer_profile: Relation<CustomerProfile>;

  @BeforeInsert()
  emailToLowerCase() {
    this.email = this.email.toLowerCase();
  }
}

// ── Staff Profile ──
@Entity('staff_profiles')
export class StaffProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'account_id', type: 'uuid', nullable: true })
  account_id: string;

  @Column({ name: 'full_name', nullable: true })
  full_name: string;

  @Column({ type: 'jsonb', default: () => '[]', nullable: true })
  permissions: string[];

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  created_by: string;

  @OneToOne(() => Account, (account) => account.staff_profile)
  @JoinColumn({ name: 'account_id' })
  account: Relation<Account>;
}

// ── Customer Profile ──
@Entity('customer_profiles')
export class CustomerProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'account_id', type: 'uuid', nullable: true })
  account_id: string;

  @Column({ name: 'company_name', nullable: true })
  company_name: string;

  @Column({ name: 'billing_address', type: 'text', nullable: true })
  billing_address: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', nullable: true })
  created_at: Date;

  @OneToOne(() => Account, (account) => account.customer_profile)
  @JoinColumn({ name: 'account_id' })
  account: Relation<Account>;
}

// ── Product ──
@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  type: string;

  @Column({ name: 'sales_price_cents' })
  sales_price_cents: number;

  @Column({ name: 'cost_price_cents', nullable: true })
  cost_price_cents: number;

  @Column({ nullable: true, type: 'text' })
  notes: string;

  @Column({ name: 'is_active', default: true, nullable: true })
  is_active: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  created_at: Date;

  @OneToMany(() => ProductVariant, (variant) => variant.product)
  variants: Relation<ProductVariant[]>;
}

// ── Product Variant ──
@Entity('product_variants')
export class ProductVariant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'product_id', type: 'uuid', nullable: true })
  product_id: string;

  @Column()
  name: string;

  @Column({ name: 'price_adjustment_cents', default: 0 })
  price_adjustment_cents: number;

  @Column({ name: 'is_active', default: true, nullable: true })
  is_active: boolean;

  @ManyToOne(() => Product, (product) => product.variants)
  @JoinColumn({ name: 'product_id' })
  product: Product;
}

// ── Plan ──
export type BillingFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';
export type EndOfTermBehavior = 'auto_close' | 'close_early' | 'pause' | 'renew';

@Entity('plans')
export class Plan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ name: 'price_cents' })
  price_cents: number;

  @Column({
    name: 'billing_frequency',
    type: 'enum',
    enum: ['daily', 'weekly', 'monthly', 'yearly'],
    enumName: 'billing_freq',
  })
  billing_frequency: BillingFrequency;

  @Column({ name: 'min_quantity', default: 1 })
  min_quantity: number;

  @Column({ name: 'available_from', type: 'date', nullable: true })
  available_from: Date;

  @Column({ name: 'available_until', type: 'date', nullable: true })
  available_until: Date;

  @Column({
    name: 'end_of_term_behavior',
    type: 'enum',
    enum: ['auto_close', 'close_early', 'pause', 'renew'],
    enumName: 'term_behavior',
  })
  end_of_term_behavior: EndOfTermBehavior;

  @Column({ name: 'is_active', default: true, nullable: true })
  is_active: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', nullable: true })
  created_at: Date;

  @OneToMany(() => Subscription, (sub) => sub.plan)
  subscriptions: Relation<Subscription[]>;
}

// ── Quotation Template ──
@Entity('quotation_templates')
export class QuotationTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ name: 'plan_id', type: 'uuid', nullable: true })
  plan_id: string;

  @Column({ name: 'validity_days' })
  validity_days: number;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  created_by: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', nullable: true })
  created_at: Date;

  @Column({ name: 'expires_at', type: 'timestamptz', nullable: true })
  expires_at: Date;

  @ManyToOne(() => Plan)
  @JoinColumn({ name: 'plan_id' })
  plan: Relation<Plan>;
}

// ── Quotation Template Line ──
@Entity('quotation_template_lines')
export class QuotationTemplateLine {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'template_id', type: 'uuid', nullable: true })
  template_id: string;

  @Column({ name: 'product_id', type: 'uuid', nullable: true })
  product_id: string;

  @Column({ name: 'variant_id', type: 'uuid', nullable: true })
  variant_id: string;

  @Column()
  quantity: number;

  @Column({ name: 'unit_price_cents' })
  unit_price_cents: number;

  @Column({ name: 'tax_rate', type: 'numeric', precision: 5, scale: 4, nullable: true })
  tax_rate: number;

  @ManyToOne(() => QuotationTemplate)
  @JoinColumn({ name: 'template_id' })
  template: Relation<QuotationTemplate>;
}

// ── Subscription ──
export type SubscriptionStatus = 'draft' | 'quotation' | 'confirmed' | 'active' | 'closed';

@Entity('subscriptions')
@Index(['customer_id'])
@Index(['status'])
@Index(['plan_id'])
@Index(['expiry_date'])
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'subscription_number', unique: true })
  subscription_number: string;

  @Column({ name: 'customer_id', type: 'uuid', nullable: true })
  customer_id: string;

  @Column({ name: 'plan_id', type: 'uuid', nullable: true })
  plan_id: string;

  @Column({ name: 'start_date', type: 'date' })
  start_date: Date;

  @Column({ name: 'expiry_date', type: 'date', nullable: true })
  expiry_date: Date;

  @Column({ name: 'payment_terms', nullable: true })
  payment_terms: string;

  @Column({
    type: 'enum',
    enum: ['draft', 'quotation', 'confirmed', 'active', 'closed'],
    enumName: 'sub_status',
    default: 'draft',
  })
  status: SubscriptionStatus;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  created_by: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', nullable: true })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz', nullable: true })
  updated_at: Date;

  @ManyToOne(() => Plan)
  @JoinColumn({ name: 'plan_id' })
  plan: Relation<Plan>;

  @OneToMany(() => SubscriptionLine, (line) => line.subscription, { cascade: true })
  lines: Relation<SubscriptionLine[]>;

  @OneToMany(() => Invoice, (invoice) => invoice.subscription)
  invoices: Relation<Invoice[]>;
}

// ── Subscription Line ──
@Entity('subscription_lines')
export class SubscriptionLine {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'subscription_id' })
  subscription_id: string;

  @Column({ name: 'product_id', type: 'uuid', nullable: true })
  product_id: string;

  @Column({ name: 'variant_id', type: 'uuid', nullable: true })
  variant_id: string;

  @Column()
  quantity: number;

  @Column({ name: 'unit_price_cents' })
  unit_price_cents: number;

  @Column({ name: 'tax_rate', type: 'numeric', precision: 5, scale: 4, nullable: true })
  tax_rate: number;

  @Column({ name: 'tax_amount_cents', nullable: true })
  tax_amount_cents: number;

  @Column({ name: 'amount_cents' })
  amount_cents: number;

  @ManyToOne(() => Subscription, (sub) => sub.lines)
  @JoinColumn({ name: 'subscription_id' })
  subscription: Relation<Subscription>;
}

// ── Tax Rule ──
export type TaxApplicability = 'all' | 'specific_products';

@Entity('tax_rules')
export class TaxRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'numeric', precision: 5, scale: 4 })
  rate: number;

  @Column({
    name: 'applicable_to',
    type: 'enum',
    enum: ['all', 'specific_products'],
    enumName: 'tax_scope',
  })
  applicable_to: TaxApplicability;

  @Column({ name: 'is_active', default: true, nullable: true })
  is_active: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', nullable: true })
  created_at: Date;
}

// ── Discount ──
export type DiscountType = 'fixed' | 'percentage';
export type DiscountScope = 'specific_products' | 'whole_subscription';

@Entity('discounts')
export class Discount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: ['fixed', 'percentage'], enumName: 'disc_type' })
  type: DiscountType;

  @Column({ name: 'value_cents', nullable: true })
  value_cents: number;

  @Column({ name: 'percentage', type: 'numeric', precision: 5, scale: 4, nullable: true })
  percentage: number;

  @Column({ name: 'min_purchase_cents', default: 0, nullable: true })
  min_purchase_cents: number;

  @Column({ name: 'min_quantity', default: 1, nullable: true })
  min_quantity: number;

  @Column({ name: 'start_date', type: 'date' })
  start_date: Date;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  end_date: Date;

  @Column({ name: 'usage_limit', nullable: true })
  usage_limit: number;

  @Column({ name: 'usage_count', default: 0, nullable: true })
  usage_count: number;

  @Column({
    type: 'enum',
    enum: ['specific_products', 'whole_subscription'],
    enumName: 'disc_scope',
  })
  scope: DiscountScope;

  @Column({ name: 'is_active', default: true, nullable: true })
  is_active: boolean;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  created_by: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', nullable: true })
  created_at: Date;
}

// ── Invoice ──
export type InvoiceStatus = 'draft' | 'confirmed' | 'paid';

@Entity('invoices')
@Index(['subscription_id'])
@Index(['customer_id'])
@Index(['status'])
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'invoice_number', unique: true })
  invoice_number: string;

  @Column({ name: 'subscription_id', type: 'uuid', nullable: true })
  subscription_id: string;

  @Column({ name: 'customer_id', type: 'uuid', nullable: true })
  customer_id: string;

  @Column({ name: 'billing_period_start', type: 'date', nullable: true })
  billing_period_start: Date;

  @Column({ name: 'billing_period_end', type: 'date', nullable: true })
  billing_period_end: Date;

  @Column({
    type: 'enum',
    enum: ['draft', 'confirmed', 'paid'],
    enumName: 'inv_status',
    default: 'draft',
  })
  status: InvoiceStatus;

  @Column({ name: 'subtotal_cents' })
  subtotal_cents: number;

  @Column({ name: 'tax_total_cents' })
  tax_total_cents: number;

  @Column({ name: 'discount_total_cents', default: 0, nullable: true })
  discount_total_cents: number;

  @Column({ name: 'grand_total_cents' })
  grand_total_cents: number;

  @Column({ name: 'idempotency_key', unique: true, nullable: true })
  idempotency_key: string;

  @Column({ name: 'sent_at', type: 'timestamptz', nullable: true })
  sent_at: Date;

  @Column({ name: 'paid_at', type: 'timestamptz', nullable: true })
  paid_at: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', nullable: true })
  created_at: Date;

  @ManyToOne(() => Subscription)
  @JoinColumn({ name: 'subscription_id' })
  subscription: Relation<Subscription>;

  @OneToMany(() => InvoiceLine, (line) => line.invoice, { cascade: true })
  lines: Relation<InvoiceLine[]>;

  @OneToMany(() => Payment, (payment) => payment.invoice)
  payments: Relation<Payment[]>;
}

// ── Invoice Line ──
@Entity('invoice_lines')
export class InvoiceLine {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'invoice_id', type: 'uuid', nullable: true })
  invoice_id: string;

  @Column({ name: 'product_id', type: 'uuid', nullable: true })
  product_id: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  quantity: number;

  @Column({ name: 'unit_price_cents' })
  unit_price_cents: number;

  @Column({ name: 'tax_rate', type: 'numeric', precision: 5, scale: 4, nullable: true })
  tax_rate: number;

  @Column({ name: 'tax_amount_cents', nullable: true })
  tax_amount_cents: number;

  @Column({ name: 'discount_applied_cents', default: 0, nullable: true })
  discount_applied_cents: number;

  @Column({ name: 'amount_cents' })
  amount_cents: number;

  @ManyToOne(() => Invoice, (invoice) => invoice.lines)
  @JoinColumn({ name: 'invoice_id' })
  invoice: Relation<Invoice>;
}

// ── Payment ──
@Entity('payments')
@Index(['invoice_id'])
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'invoice_id', type: 'uuid', nullable: true })
  invoice_id: string;

  @Column()
  method: string;

  @Column({ name: 'amount_cents' })
  amount_cents: number;

  @Column({ name: 'payment_date', type: 'date' })
  payment_date: Date;

  @Column({ nullable: true, type: 'text' })
  note: string;

  @Column({ name: 'recorded_by', type: 'uuid', nullable: true })
  recorded_by: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', nullable: true })
  created_at: Date;

  @ManyToOne(() => Invoice, (invoice) => invoice.payments)
  @JoinColumn({ name: 'invoice_id' })
  invoice: Relation<Invoice>;
}

// ── Audit Log ──
@Entity('audit_logs')
@Index(['entity_type', 'entity_id'])
@Index(['created_at'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'actor_id', type: 'uuid', nullable: true })
  actor_id: string;

  @Column()
  action: string;

  @Column({ name: 'entity_type' })
  entity_type: string;

  @Column({ name: 'entity_id', type: 'uuid', nullable: true })
  entity_id: string;

  @Column({ type: 'jsonb', nullable: true })
  before: any;

  @Column({ type: 'jsonb', nullable: true })
  after: any;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', nullable: true })
  created_at: Date;
}
