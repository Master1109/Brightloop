# Brightloop Frontend

A Next.js 15 + React 18 + TypeScript subscription workspace UI built with Tailwind CSS, Radix dialog primitives, Lucide icons, Recharts, and NextAuth credential sessions.

## Quick Start

Requires Node.js 22+.

```sh
npm ci
npm run dev
```

Open http://localhost:3000.

To run the full application, including login and dashboard data, use one command from this folder:

```sh
npm run dev
```

This starts the Next.js frontend on port `3000` and the API on port `4000`. The API source is in `backend/`; it uses its seeded in-memory database by default, so no PostgreSQL setup is needed for local development.

> **Note:** The frontend connects to the Brightloop Backend API at `http://localhost:4000` via the Next.js rewrite proxy (`/backend` → API). Make sure the backend server is running separately.

## Project Structure

```
app/              Next.js App Router pages, global styles, and NextAuth API route
components/       Dashboard/workspace, entity forms, authentication, charts, and UI primitives
backend/          NestJS API, database layer, authentication, and backend tests
public/           Static assets and images
next.config.mjs   Next.js configuration with API proxy rewrite
tailwind.config.js
postcss.config.js
tsconfig.json
```

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start Next.js dev server on port 3000 |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm run typecheck` | TypeScript type checking |

## Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable | Description |
| --- | --- |
| `NEXTAUTH_SECRET` | Random secret for NextAuth session encryption |
| `NEXTAUTH_URL` | App URL (default: `http://localhost:3000`) |
| `NEXT_PUBLIC_API_URL` | Backend API URL (default: `http://localhost:4000`) |
