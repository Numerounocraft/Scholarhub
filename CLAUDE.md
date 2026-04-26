# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Next.js version warning

**This is Next.js 16, which has breaking changes from your training data.** Before writing any Next.js-specific code, read the relevant guide in `node_modules/next/dist/docs/`. Key differences:

- Middleware is now called **Proxy** — the file is `src/proxy.ts`, exporting a named `proxy` function (not `default` and not `middleware`)
- Consult `node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md` for proxy/middleware details

## Commands

```bash
npm run dev      # start dev server (localhost:3000)
npm run build    # production build
npm run lint     # ESLint
```

No test suite is configured.

## Architecture

**Global Scholarship Aggregator** — Next.js 16 App Router on Vercel, Supabase (Postgres + Auth), Resend email, GitHub Actions cron.

### Data flow

- `GET /api/scholarships` — public, filtered by `country`, `field`, `degree_level`, `before` query params; only returns scholarships with future deadlines. No auth required (RLS policy: anyone can select).
- `POST /api/scholarships` — admin-only (checks `user.user_metadata.role === "admin"`); uses the service client to bypass RLS.
- `GET /api/preferences` — returns the authenticated user's preferences row (null if none).
- `POST /api/preferences` — upserts preferences for the authenticated user.
- `POST /api/cron/notify` — protected by `x-cron-secret` header; fetches scholarships added in the last 24h, matches against each user's preferences, sends Resend digest emails.

### Supabase clients

Two clients — use the right one:

| Client | File | Use for |
|--------|------|---------|
| Server (cookie-based) | `src/lib/supabase/server.ts → createClient()` | Server Components, Route Handlers, Proxy — reads auth session from cookies |
| Browser | `src/lib/supabase/browser.ts → createClient()` | Client Components — `"use client"` files only |
| Service | `src/lib/supabase/server.ts → createServiceClient()` | Cron jobs, admin operations — bypasses RLS |

### Auth flow

Supabase Auth with PKCE. The callback route is `GET /api/auth/callback?code=&next=`. Sign-up/reset-password emails both redirect through this route. After code exchange, users are redirected to `next` (defaults to `/`).

Password reset: `ForgotPasswordForm` calls `resetPasswordForEmail` with `redirectTo=/api/auth/callback?next=/reset-password`. After callback, `ResetPasswordForm` calls `supabase.auth.updateUser({ password })`.

`src/proxy.ts` guards `/preferences` and `/reset-password` (redirect to `/login` if unauthenticated) and redirects logged-in users away from `/login` and `/signup`.

### Database schema

Defined in `supabase/schema.sql`. Two public tables:

- `scholarships(id, title, country, field, degree_level, deadline, link, description, created_at)` — RLS: anyone can select; admins can insert.
- `preferences(id, user_id, countries[], fields[], degree_levels[], updated_at)` — RLS: users access only their own row. `unique(user_id)`.

Seed data: `supabase/seed.sql` (20 sample scholarships). Run both files in the Supabase SQL editor.

### Email / cron

`src/lib/email/resend.ts` sends HTML digest emails via Resend. The cron route uses `supabase.auth.admin.listUsers()` (service client) to resolve user emails — there is no `public.users` table; auth users live in `auth.users`.

GitHub Actions workflow (`.github/workflows/daily-notify.yml`) runs at 08:00 UTC, POSTing to `/api/cron/notify` with the `x-cron-secret` header. Requires GitHub secrets `APP_URL` and `CRON_SECRET`.

### Environment variables

| Variable | Used by |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Both clients |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser + server client |
| `SUPABASE_SERVICE_ROLE_KEY` | Service client (cron, admin) |
| `RESEND_API_KEY` | Email sending |
| `RESEND_FROM_EMAIL` | Email from address |
| `NEXT_PUBLIC_APP_URL` | Email unsubscribe links |
| `CRON_SECRET` | Cron route authentication |
