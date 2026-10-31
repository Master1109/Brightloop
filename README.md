# Brightloop Subscription Management System

A full-stack subscription management system built with NestJS (backend), Next.js 15 (frontend), PostgreSQL, and TypeScript.

## Quick Start

Requires Node.js 18+ and PostgreSQL 15.

```sh
# Backend
npm install
npm run backend:build
npm run backend:start

# Frontend (in a separate terminal)
npm run frontend:dev
```

Open http://localhost:3000. The frontend connects to the Brightloop Backend API at `http://localhost:4000` via a Next.js rewrite proxy (`/backend` → API).

## Project Structure

```
src/              NestJS backend (entities, modules, services, controllers)
  entities/       TypeORM entities
  modules/        Feature modules (auth, health, bootstrap, records, invoices)
  common/         Shared utilities (guards, strategies, decorators)
  main.ts         Backend entry point
app/              Next.js App Router pages, global styles, and NextAuth API route
components/       Dashboard/workspace, entity forms, authentication, charts, and UI primitives
```

## Scripts

| Command | Description |
| --- | --- |
| `npm run backend:start` | Start NestJS dev server on port 4000 |
| `npm run backend:build` | Build backend to dist/ |
| `npm run backend:test` | Run backend tests |
| `npm run backend:seed` | Seed initial database data |
| `npm run backend:typecheck` | TypeScript type checking for backend |
| `npm run frontend:dev` | Start Next.js dev server on port 3000 |
| `npm run frontend:build` | Production build |
| `npm run frontend:start` | Start production server |
| `npm run frontend:typecheck` | TypeScript type checking |

## API Endpoints

| Route | Method | Description |
| --- | --- | --- |
| `/health` | GET | API health check |
| `/auth/login` | POST | Login and receive JWT |
| `/auth/register` | POST | Register new account |
| `/auth/forgot-password` | POST | Request password reset |
| `/auth/reset-password` | POST | Reset password with token |
| `/api/bootstrap` | GET | Get workspace bootstrap data |
| `/api/records` | GET | List all records |
| `/api/records/{kind}` | POST | Create a record |
| `/api/records/{kind}/{id}` | PATCH | Update a record |
| `/api/records/{kind}/{id}/action` | POST | Perform action on record |
| `/api/records/{kind}/{id}/history` | GET | Get record history |
| `/api/records/{kind}/{id}` | DELETE | Delete a record |
| `/invoices/{id}/pdf` | GET | Download invoice as PDF |

Swagger docs available at `http://localhost:4000/v1/api`

## Environment Variables

Copy `.env.example` to `.env` and configure.

| Variable | Description |
| --- | --- |
| `NEXTAUTH_SECRET` | Random secret for NextAuth session encryption |
| `NEXTAUTH_URL` | App URL (default: `http://localhost:3000`) |
| `NEXT_PUBLIC_API_URL` | Backend API URL (default: `http://localhost:4000`) |
| `DATABASE_URL` | Database connection string |
| `DB_HOST` | Database host |
| `DB_PORT` | Database port |
| `DB_USER` | Database user |
| `DB_PASSWORD` | Database password |
| `DB_NAME` | Database name |
| `JWT_SECRET` | JWT signing secret |
| `JWT_EXPIRES_IN` | JWT expiration (default: 1h) |
| `PORT` | Backend port (default: 4000) |
| `NODE_ENV` | Environment (development/production) |
| `BCRYPT_ROUNDS` | Password hashing rounds (default: 12) |
