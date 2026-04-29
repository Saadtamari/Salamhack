# Masraf Backend (Express + TypeScript + Drizzle)

This backend is initialized with a clean, modular architecture that follows separation of concerns:

- `modules/*`: feature boundaries (controller, service, repository, routes, validators)
- `infrastructure/*`: database and external integrations
- `shared/*`: cross-cutting concerns (errors, middleware, utils)
- `config/*`: environment and app configuration

## Quick start

1. Copy `.env.example` to `.env`
2. Install packages:
   - `npm install`
3. Run development server:
   - `npm run dev`

## Scripts

- `npm run dev`: run server with watch mode
- `npm run build`: compile TypeScript
- `npm run start`: run compiled server
- `npm run db:generate`: generate Drizzle migrations
- `npm run db:migrate`: run migrations
- `npm run db:push`: push schema to database
- `npm run typecheck`: TypeScript validation

## Current API

- `GET /health`
- `GET /api/users`
- `GET /api/users/:id`
- `POST /api/users`

## Supabase Storage

The backend now includes a reusable storage integration for Supabase buckets.

- Configure `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_STORAGE_BUCKET` in your `.env`
- Use `src/infrastructure/storage/supabase-storage.ts` for uploads, deletes, and signed/public URLs
- Store files by prefix, for example `contracts/`, `invoices/`, `reports/`, or `images/`
