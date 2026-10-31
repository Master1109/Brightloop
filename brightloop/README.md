# Brightloop frontend

Brightloop is a subscription operations workspace for products, plans, subscriptions, recurring invoices, payments, and customer reporting.

## Run it

Run npm i, copy .env.example to .env.local, then run npm run dev.
Quality checks are npm run lint, npm run typecheck, and npm run build.

NEXT_PUBLIC_USE_MOCKS=true is the default demo mode. Set it to false and set NEXT_PUBLIC_API_URL to connect the real backend after implementing the adapter described in API_CONTRACT.md.

## Demo accounts

- Admin: admin@brightloop.test / Admin@1234
- Staff: staff@brightloop.test / Staff@1234
- Customer: customer@brightloop.test / Customer@1234

## Structure

app/Dashboard.tsx contains the route-aware application shell and reusable dashboard pieces. app/globals.css contains Brightloop theme tokens, responsive layout, cards, charts, status badges, table, and auth styling. API_CONTRACT.md is the backend boundary.

## Demo script

1. Sign in with the admin demo account.
2. Search for a customer from the top search.
3. Open Subscriptions from the sidebar.
4. Start Create subscription.
5. Review the revenue overview and health donut.
6. Open Invoices from the sidebar.
7. Open Reports to inspect the reporting destination.
8. Run billing in the backend once connected.
9. Record a payment against an outstanding invoice.
10. Sign in as customer to validate portal scoping.

## Assumptions

The supplied repository was an empty Next starter and did not include the requested third-party packages or backend. To keep the first handoff buildable without a network install, the frontend uses local SVG icons and CSS components with the same visual contract. The API contract is explicit so TanStack Query, form schemas, adapters, and the full data screens can be layered in without changing the page-level UI contract.
