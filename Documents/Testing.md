# Testing Strategy

**Product:** Subscription Management System  
**Version:** 1.0  

This document defines the test approach for the Subscription Management System. Testing must validate both correctness of financial behavior (billing, taxes, discounts, state transitions) and performance (sub-2-second pages at thousands-of-subscriptions scale).

---

## 1. Test Pyramid

```
        /\
       /E2E\      (Playwright) — critical user journeys
      /____\
     /INT\    (API + DB integration) — billing jobs, discounts, state machines
    /____\
   /UNIT\   (Vitest/Jest) — pure functions, tax calc, validation rules
  /____\
```

Target coverage: ≥ 85% unit, 100% of critical billing paths.

---

## 2. Unit Tests

| Area | What to Test | Example Cases |
|------|--------------|---------------|
| Auth | Password validation | < 8 chars rejected; missing uppercase rejected; missing special char rejected |
| Auth | Email uniqueness | Duplicate registration rejected |
| Tax | Tax calculation | Rate applied correctly; 0% for non-taxable products |
| Discount | Fixed vs percentage | Fixed subtracts amount; percentage computes on subtotal |
| Discount | Eligibility | Min purchase not met → not applied; min quantity met → applied |
| Discount | Expiry/limit | Past end_date → inactive; usage_count ≥ limit → inactive |
| Subscription | State transitions | Draft→Quotation→Confirmed→Active→Closed; invalid transition rejected |
| Invoice | Amount math | grand_total = subtotal + tax − discount; no negative totals |
| Idempotency | Duplicate billing | Same subscription+billing period → one invoice only |

---

## 3. Integration Tests

| Area | What to Test | Example Cases |
|------|--------------|---------------|
| Billing job | Daily run | All due subscriptions invoiced; none skipped; none duplicated |
| Billing job | Re-run safety | Re-running job for same day creates no extra invoices |
| Quote→Subscription | Template conversion | Subscription inherits template lines, plan, validity |
| Payment | Partial vs full | Partial payment keeps invoice Confirmed; full payment → Paid |
| Discount application | Auto-apply | Next generated invoice includes discount; subsequent invoice after expiry does not |
| Role access | Customer scoping | Customer A cannot view Customer B's invoice (403) |
| Role access | Staff limits | Staff cannot create staff accounts (403); admin can |

---

## 4. End-to-End Tests (Playwright)

| Journey | Steps | Assertion |
|---------|-------|-----------|
| Customer signup | Register with valid email/password → login | Dashboard loads; role = customer |
| Password reset | Forgot password → email link → new password | Login succeeds with new password |
| Admin creates plan | Admin adds product + variant + plan | Plan visible in catalog; variant price +560 reflected |
| Staff quote to sub | Staff creates quote from template → confirms → active | Subscription status = Active; lines correct |
| Billing day | Trigger billing job → invoices created | Invoices Draft; taxes/totals correct; no dupes |
| Staff confirms invoice | Confirm Draft invoice | Status → Confirmed |
| Payment recorded | Record payment for full amount | Status → Paid |
| Customer portal | Customer logs in → views own sub/invoice | Only own data visible; no other customer data |
| Finance report | Open dashboard with thousands of subs | Page loads < 2s; numbers match DB |

---

## 5. Performance Tests

| Requirement | Target | Method |
|-------------|--------|--------|
| Page load (all pages) | < 2 seconds | k6 / Playwright with 1,000–5,000 subscriptions seeded |
| Billing job throughput | Complete within scheduled window | Time job run against 5,000 active subscriptions |
| Report query | < 2 seconds | Dashboard query with filters on large dataset |
| Concurrent users | 50+ staff/admin users | Load test login + invoice actions |

---

## 6. Security Tests

| Test | Expectation |
|------|-------------|
| Password stored hashed | DB contains hash, never plaintext |
| Reset token expiry | Token rejected after 1 hour |
| Role escalation | Staff calling admin endpoint → 403 |
| Customer data isolation | Customer A requesting Customer B's invoice → 403 |
| SQL injection | Parameterized queries; malicious input neutralized |
| CSRF | State-changing requests require valid token |

---

## 7. Test Data Strategy

- Use seeded fixtures for products, plans, tax rules, discounts.
- Generate large subscription volumes (1,000–10,000) for performance runs using factory scripts.
- Never use real customer PII in test environments.
- Reset DB between test runs; use transactions for rollback where supported.

---

## 8. Entry / Exit Criteria

### Entry
- Code merged to feature branch
- Unit tests pass locally
- Preview environment deployed

### Exit (per story)
- Unit + integration tests pass
- E2E journey for the feature passes
- No critical/high bugs open
- Performance requirement (< 2s) met for affected pages
- QA sign-off

---

## 9. Bug Severity

| Severity | Definition | Example |
|----------|------------|---------|
| Critical | Financial data incorrect; billing breaks | Duplicate invoice; wrong tax total |
| High | Core feature unusable | Cannot confirm invoice; subscription stuck in Draft |
| Medium | Degraded experience | Page loads 2–4 seconds; filter missing |
| Low | Cosmetic | Typo; misaligned UI |
