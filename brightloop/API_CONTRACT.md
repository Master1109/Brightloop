# Brightloop API contract

The UI is isolated from transport details. Set NEXT_PUBLIC_USE_MOCKS=false and implement the HTTP adapter against these endpoints.

All list responses use { data: T[], meta: { page, pageSize, total } }. Errors use { error: { code, message, fieldErrors? } }. Money is INR with two decimals; dates are ISO strings.

| Method | Path | Query / body | Role |
|---|---|---|---|
| POST | /auth/login | { email, password } | public |
| POST | /auth/register | { name, email, password } | public |
| GET | /me | — | authenticated |
| GET | /dashboard | dateFrom, dateTo | admin, staff |
| GET | /products | page, pageSize, sort, q | admin, staff |
| POST | /products | product with variants | admin |
| GET | /plans | page, pageSize, q, status | admin, staff |
| GET | /customers | page, pageSize, q | admin, staff |
| GET | /subscriptions | page, pageSize, q, status, customerId | admin, staff, customer |
| POST | /subscriptions | subscription with lines | admin, staff |
| PATCH | /subscriptions/:id/status | { status } | admin, staff |
| GET | /invoices | page, pageSize, q, status, overdue | admin, staff, customer |
| GET | /invoices/:id | — | admin, staff, owner |
| POST | /invoices/:id/confirm | — | admin, staff |
| POST | /invoices/:id/cancel | — | admin, staff |
| POST | /invoices/:id/send | — | admin, staff |
| POST | /billing/run | — | admin, staff |
| GET | /payments | page, pageSize, invoiceId | admin, staff |
| POST | /payments | { invoiceId, method, amount, date, note } | admin, staff |
| GET | /reports/overview | filters | admin |
| GET | /reports/overdue | filters + pagination | admin |
| GET | /reports/overdue.csv | filters | admin |

Errors: AUTH_INVALID, EMAIL_TAKEN, FORBIDDEN, NOT_FOUND, VALIDATION_ERROR, INVALID_TRANSITION, PAYMENT_EXCEEDS_BALANCE, BILLING_DUPLICATE.
