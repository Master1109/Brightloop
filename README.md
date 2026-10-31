# Brightloop Subscription Management System

A subscription management app with a Next.js frontend, NestJS API, and PostgreSQL database. Neon PostgreSQL is supported.

## Run locally

Requires Node.js 18+ and a PostgreSQL database.

```powershell
Copy-Item .env.example .env
# Set DATABASE_URL to your PostgreSQL/Neon connection string in .env.
npm install
npm run backend:setup
npm run backend:dev
```

In a second terminal, start the frontend:

```powershell
npm run frontend:dev
```

Open http://localhost:3000. The backend loads `.env` first and `backend/.env` as a fallback. The frontend proxies `/backend/*` to `BACKEND_URL`, then `NEXT_PUBLIC_API_URL`, then `http://127.0.0.1:4000`. Pending migrations also run automatically when the backend starts.

The initial migration creates tables for an empty database. If it finds an existing complete Brightloop schema, it records a baseline without changing existing tables; partial or unrelated schemas are rejected. Schema synchronization is disabled to prevent accidental data loss.

## Project structure

- `src/`: NestJS API, TypeORM entities, and database migrations
- `app/`: Next.js App Router pages and NextAuth API route
- `components/`: frontend workspace, forms, charts, and UI
- `Documents/`: product and architecture documentation

## Scripts

| Command | Description |
| --- | --- |
| `npm run backend:dev` | Start NestJS in watch mode |
| `npm run backend:build` | Build the backend to `dist/` |
| `npm run backend:start` | Start the compiled backend |
| `npm run backend:setup` | Apply pending PostgreSQL migrations |
| `npm run backend:seed` | Create the local demo accounts |
| `npm run backend:test` | Run backend tests |
| `npm run backend:typecheck` | Type-check backend |
| `npm run frontend:dev` | Start Next.js on port 3000 |
| `npm run frontend:build` | Build the frontend |
| `npm run frontend:start` | Start the production frontend |
| `npm run frontend:typecheck` | Type-check frontend |
| `npm run typecheck` | Type-check both apps |
| `npm run build` | Build backend and frontend |

## API endpoints

| Route | Method | Description |
| --- | --- | --- |
| `/health` | GET | API and database health |
| `/auth/login` | POST | Login and receive JWT |
| `/auth/register` | POST | Register an account |
| `/auth/forgot-password` | POST | Request password reset |
| `/auth/reset-password` | POST | Reset password |
| `/api/bootstrap` | GET | Get workspace data |
| `/api/records` | GET | List records |
| `/api/records/{kind}` | POST | Create a record |
| `/api/records/{kind}/{id}` | PATCH/DELETE | Update or delete a record |
| `/api/records/{kind}/{id}/action` | POST | Perform a record action |
| `/api/records/{kind}/{id}/history` | GET | Get record history |
| `/invoices/{id}/pdf` | GET | Download invoice |

Swagger docs: http://localhost:4000/v1/api

## Environment

Set `DATABASE_URL` to a PostgreSQL connection string; Neon URLs should include `sslmode=require`. The backend accepts `.env` or the ignored `backend/.env` file. `.env.example` contains placeholders only.

Other settings include `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `BACKEND_URL`, `NEXT_PUBLIC_API_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `PORT`, `NODE_ENV`, and `BCRYPT_ROUNDS`.
