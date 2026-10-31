# Sitemap

**Product:** Subscription Management System  
**Version:** 1.0  

Route and screen map for the three user interfaces: Admin Web, Staff Web, and Customer Portal. All routes require authentication unless marked Public.

---

## 1. Public Routes (No Auth Required)

| Path | Screen | Purpose |
|------|--------|---------|
| / | Landing / Login redirect | Redirects to login |
| /login | Login Page | Email + password sign-in |
| /register | Registration Page | Customer signup (email + password policy) |
| /forgot-password | Forgot Password | Request reset link to registered email |
| /reset-password | Reset Password | Set new password via token |

---

## 2. Admin Web

### Dashboard
| Path | Screen | Purpose |
|------|--------|---------|
| /admin | Admin Dashboard | Overview: active subs, revenue, quick actions |

### Product Catalog
| Path | Screen | Purpose |
|------|--------|---------|
| /admin/products | Product List | View all products |
| /admin/products/new | Create Product | Name, type, sales price, cost price, notes |
| /admin/products/:id/edit | Edit Product | Modify product details |

### Product Variants
| Path | Screen | Purpose |
|------|--------|---------|
| /admin/products/:id/variants | Variant List | Manage variants (e.g., brand) |
| /admin/products/:id/variants/new | Create Variant | Name + price adjustment (e.g., Odoo +560) |

### Plan Catalog
| Path | Screen | Purpose |
|------|--------|---------|
| /admin/plans | Plan List | View all plans |
| /admin/plans/new | Create Plan | Price, frequency (daily/weekly/monthly/yearly), min qty, availability dates, end-of-term behavior |
| /admin/plans/:id/edit | Edit Plan | Modify plan settings |

### Tax Rules
| Path | Screen | Purpose |
|------|--------|---------|
| /admin/taxes | Tax Rule List | View tax rules |
| /admin/taxes/new | Create Tax Rule | Name, rate, applicability |

### Discounts
| Path | Screen | Purpose |
|------|--------|---------|
| /admin/discounts | Discount List | View discount rules |
| /admin/discounts/new | Create Discount | Type, value, min purchase/qty, dates, usage limit, scope |

### Staff Management
| Path | Screen | Purpose |
|------|--------|---------|
| /admin/staff | Staff List | View staff members |
| /admin/staff/new | Add Staff | Create staff account (admin only) |

### Reports
| Path | Screen | Purpose |
|------|--------|---------|
| /admin/reports | Finance Dashboard | Active subs, revenue, payments, overdue invoices; filters + summary |
| /admin/reports/overdue | Overdue Invoices | Overdue invoice list for collections |

---

## 3. Staff Web

### Dashboard
| Path | Screen | Purpose |
|------|--------|---------|
| /staff | Staff Dashboard | Subscriptions, invoices, payments overview |

### Quotation Templates
| Path | Screen | Purpose |
|------|--------|---------|
| /staff/quotes | Template List | View quotation templates |
| /staff/quotes/new | Create Template | Plan + product lines, validity days |
| /staff/quotes/:id/edit | Edit Template | Modify template |

### Subscriptions
| Path | Screen | Purpose |
|------|--------|---------|
| /staff/subscriptions | Subscription List | View all subscriptions with status |
| /staff/subscriptions/new | Create Subscription | From template: customer, plan, dates, terms, lines |
| /staff/subscriptions/:id | Subscription Detail | Status, lines, history |
| /staff/subscriptions/:id/advance | Advance Status | Draft → Quotation → Confirmed → Active → Closed |

### Invoices
| Path | Screen | Purpose |
|------|--------|---------|
| /staff/invoices | Invoice List | Draft / Confirmed / Paid |
| /staff/invoices/:id | Invoice Detail | Lines, taxes, totals, status |
| /staff/invoices/:id/confirm | Confirm Invoice | Draft → Confirmed |
| /staff/invoices/:id/cancel | Cancel Invoice | Void invoice |
| /staff/invoices/:id/send | Send Invoice | Email to customer |
| /staff/invoices/:id/print | Print Invoice | Printable view |

### Payments
| Path | Screen | Purpose |
|------|--------|---------|
| /staff/payments | Payment List | View all payments |
| /staff/payments/new | Record Payment | Method, amount, date, note against invoice |

---

## 4. Customer Portal

### Account
| Path | Screen | Purpose |
|------|--------|---------|
| /portal | Portal Home | Own subscriptions + invoices summary |
| /portal/account | Account Settings | Email, password |
| /portal/subscriptions | My Subscriptions | List own subscriptions |
| /portal/subscriptions/:id | Subscription Detail | Status, lines, dates, terms |
| /portal/invoices | My Invoices | List own invoices (paid/outstanding) |
| /portal/invoices/:id | Invoice Detail | Amount, status, download/print |

---

## 5. Navigation Access Matrix

| Screen | Admin | Staff | Customer |
|--------|-------|-------|----------|
| Login / Register | ✓ | ✓ | ✓ |
| Admin Dashboard | ✓ | ✗ | ✗ |
| Product Catalog | ✓ | ✗ | ✗ |
| Plan Catalog | ✓ | ✗ | ✗ |
| Tax Rules | ✓ | ✗ | ✗ |
| Discounts | ✓ | ✗ | ✗ |
| Staff Management | ✓ | ✗ | ✗ |
| Finance Reports | ✓ | ✗ | ✗ |
| Staff Dashboard | ✓ | ✓ | ✗ |
| Quotation Templates | ✓ | ✓ | ✗ |
| Subscriptions (all) | ✓ | ✓ | Own only |
| Invoices (all) | ✓ | ✓ | Own only |
| Payments | ✓ | ✓ | ✗ |
| Customer Portal | ✗ | ✗ | ✓ |

✓ = Accessible ✗ = Not accessible (403)

---

## 6. Route Naming Convention

- Admin routes: `/admin/*`
- Staff routes: `/staff/*`
- Customer routes: `/portal/*`
- Public routes: `/login`, `/register`, `/forgot-password`, `/reset-password`

All authenticated routes redirect unauthenticated users to `/login`. Role mismatches return 403.
