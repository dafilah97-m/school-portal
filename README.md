# SHG Designs School Portal & Edu-Vault

School merchandise ordering platform combined with a digital past-paper
marketplace ("Edu-Vault"), built with Next.js 16 (App Router) + Supabase.

## Roles

- **Super Admin** — approves/rejects Edu-Vault submissions, manages user roles, views analytics.
- **Shop Admin** — manages stores/products/orders, exports fulfillment lists.
- **Subject Admin** — uploads past papers/study guides (enter "pending approval" until a Super Admin approves).
- **Customer (student/parent)** — browses stores + Edu-Vault, checks out via DPO Pay, downloads purchased PDFs from `/dashboard`.

## Setup

1. Create a Supabase project.
2. Copy `.env.example` to `.env.local` and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (Project Settings → API)
   - `NEXT_PUBLIC_SITE_URL` (`http://localhost:3000` for local dev)
   - `DPO_COMPANY_TOKEN`, `DPO_SERVICE_TYPE` (from your DPO Pay merchant back office)
3. Run `supabase/schema.sql` in the Supabase SQL editor. This creates all tables, RLS policies, and the three storage buckets (`public-images`, `private-resources`, `watermarked-cache`).
4. Install dependencies and start the dev server:
   ```bash
   npm install
   npm run dev
   ```
5. Register your own account at `/register` (this creates a `student_parent` profile by default), then bootstrap the first Super Admin directly in the Supabase SQL editor — there's no other way to create the first one:
   ```sql
   update public.profiles set role = 'super_admin' where email = 'you@example.com';
   ```
6. Sign in and go to `/admin/super/users` to promote any further Shop Admins / Subject Admins from there.

## Payment flow (DPO Pay)

Checkout creates a `pending` order, then redirects to DPO Pay's hosted payment
page. On return, `/checkout/success` verifies the transaction token directly
against DPO's `verifyToken` API (never trusts the redirect query params alone)
and — only once confirmed — marks the order `paid` and unlocks any purchased
Edu-Vault resources. If you configure a server-to-server payment notification
URL in your DPO back office, point it at `/api/payments/dpo/callback` as a
redundant confirmation path; the logic is idempotent either way.

## Edu-Vault PDF delivery

Past papers are stored in the private `private-resources` bucket and are never
exposed via a public or signed URL. `/api/edu-vault/download/[resourceId]`
checks purchase ownership, then watermarks the PDF on first download
("Licensed to [name] — [school]") using `pdf-lib` and caches the result in the
private `watermarked-cache` bucket for instant repeat downloads.

## Notes

- This project uses `proxy.ts` (not `middleware.ts`) for route protection — Next.js 16 renamed the convention. See [`AGENTS.md`](./AGENTS.md).
- Every mutating API route re-checks the caller's role server-side and relies on Postgres RLS as the actual security boundary — the proxy is a UX-level redirect, not the enforcement layer.
