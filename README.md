# Obsidian Performance Coach

A premium, dark-themed coaching platform for managing personal training clients — onboarding, daily check-ins, nutrition review, workout programming, progress tracking, messaging, and analytics in one place.

Built with Next.js 15 (App Router), TypeScript, Tailwind CSS v4, and Supabase (Postgres + Auth + RLS).

## Stack

- **Next.js 15** — App Router, Server Components, Server Actions, Route Handlers
- **Supabase** — Postgres database, authentication, Row Level Security
- **Prisma** — schema-as-documentation and type generation (`prisma/schema.prisma`); the app itself talks to Supabase directly via `@supabase/supabase-js` / `@supabase/ssr`
- **Tailwind CSS v4** — dark, minimal, "Linear/Stripe/Vercel"-style design system (`src/app/globals.css`)
- **Zod + React Hook Form patterns** for validation
- **Recharts** for the weight progress graph
- **lucide-react** for icons

## Project structure

```
prisma/schema.prisma            Canonical data model (documentation + type generation)
supabase/migrations/
  0001_init.sql                 Tables, enums, indexes, triggers
  0002_rls.sql                  Row Level Security policies
src/
  app/
    (auth)/                     Public routes: /login, /onboarding/[token]
    (coach)/coach/...           Coach dashboard, clients, analytics, messages
    (client)/client/...         Client dashboard, check-in, workouts, progress, messages
    api/                        Route handlers for actions best done server-side
  components/
    ui/                         Design-system primitives (Button, Card, Input, Badge, ...)
    coach/, client/, shared/    Feature components
    charts/                     Weight chart (Recharts)
  lib/
    supabase/                   Browser / server / admin / middleware Supabase clients
    auth/                       requireCoach() / requireClient() session helpers
    db/                         Typed data-access functions (one file per entity)
    calculations/               Weekly averages, compliance %, streaks, starting targets
    validation/                 Zod schemas
  types/database.ts             Hand-authored Supabase Database type (see note below)
```

## Getting started

### 1. Supabase project — already provisioned

A Supabase project (**pqiwuhshbbdafaxqbybp**, region `ca-central-1`) has already been created and both migrations applied:

1. `supabase/migrations/0001_init.sql` — tables, enums, indexes, the `updated_at` triggers, and the trigger that mirrors new `auth.users` rows into `public.users`.
2. `supabase/migrations/0002_rls.sql` — Row Level Security policies so clients can only ever see their own data and coaches can see their own clients.
3. A follow-up hardening migration (search_path fix, tightened notifications policy, locked-down RPC exposure on internal helper functions) has also been applied.

`.env.example` is pre-filled with this project's URL and anon key. You still need to add two secrets that can't be retrieved programmatically for security reasons — grab them from the Supabase dashboard (**Project Settings**):

- `SUPABASE_SERVICE_ROLE_KEY` — **Project Settings → API → service_role secret**
- `DATABASE_URL` / `DIRECT_URL` — **Project Settings → Database → Connection string** (replace `[YOUR-PASSWORD]`; reset the DB password there if you don't have it)

If you'd rather use a different Supabase project, create one yourself and re-run the two migration files against it via the SQL Editor (or `supabase db push`), then update `.env.example`/`.env.local` accordingly.

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in the two secrets from step 1.

### 3. Install and run

```bash
npm install
npm run dev
```

### 4. Create your coach account

Sign up for an account through Supabase Auth (e.g. via the Supabase dashboard's **Authentication → Add user**, or build a temporary sign-up form). New users default to the `CLIENT` role. To make yourself the coach, run in the SQL Editor:

```sql
update public.users set role = 'COACH' where email = 'you@example.com';
```

Log in at `/login` — you'll land on `/coach/dashboard`.

### 5. Add your first client

From the coach dashboard, **Add client** creates an invite record and gives you a link (`/onboarding/<token>`). Send that link to your client — they'll set their password and complete the full onboarding questionnaire (basic info, training, nutrition, lifestyle). On submission, a starting set of nutrition targets is generated automatically (Mifflin-St Jeor based) and their client profile is created.

## Notes on the type system

`src/types/database.ts` is **hand-authored** to mirror the SQL migrations, because generating it requires a live Supabase project (`npx supabase gen types typescript --project-id <ref> > src/types/database.ts`). Once your project is live, regenerate it from the real schema — it's the source of truth going forward.

`prisma/schema.prisma` is included as the canonical, readable data model and for optional future use with Prisma Client / Prisma Migrate. The app's actual runtime queries go through Supabase directly so that Row Level Security is enforced automatically per-request — if you introduce Prisma Client for some server-side jobs, remember it connects with full DB privileges and bypasses RLS, so use it only for trusted, server-only code paths (similar to `lib/supabase/admin.ts`).

## Security model

- Every table has RLS enabled. Clients can only read/write rows tied to their own `client_id`; coaches can read/write rows for clients where `coach_id = auth.uid()`.
- `coach_notes` are coach-only — no policy grants client-side read access.
- `lib/supabase/admin.ts` uses the `service_role` key and bypasses RLS. It's used only in trusted server contexts: creating invited clients' auth accounts and generating system notifications. Never import it into client components.
- `middleware.ts` refreshes the Supabase session on every request and redirects unauthenticated users to `/login`, and redirects users into the wrong role's section (`/coach/*` vs `/client/*`).

Running Supabase's security advisor after migrating will show two intentional low-risk warnings: `is_coach()` and `owns_client()` are `SECURITY DEFINER` functions callable by `authenticated` users. This is required — RLS policies invoke them under the querying user's role — and both only return booleans (no sensitive data exposure). All other flagged issues (mutable search_path, an overly permissive notifications policy, public RPC exposure of the auth trigger) have been fixed in `supabase/migrations` via a follow-up hardening pass.

## What's implemented

- Auth (Supabase Auth) with coach/client role separation and route protection
- Coach dashboard: total/active clients, missed check-ins, upcoming weekly check-ins, latest check-ins, per-client progress cards
- Full client profile: basic info, nutrition targets, lifestyle goals, weight graph, measurements, progress photos section, private coach notes
- Onboarding questionnaire → auto-generated client profile + starting nutrition targets
- Daily check-in (weight, free-text meals, water, workout, steps, sleep, energy/hunger, digestion, notes)
- Coach food review: estimate calories/macros per day, leave feedback, approve
- Workout programming: coach builds programs (days → exercises with sets/reps/RPE/notes); clients log sessions with per-set weight/reps; automatic PR detection
- Progress tracking: weekly/monthly weight change, compliance % (workout/nutrition/steps/cardio)
- Messaging: simple coach ↔ client threads per client
- Notifications: missed check-in / weekly check-in due reminders (generated on dashboard load — see below)
- Analytics: average weight change, average compliance, fastest progressing clients, at-risk clients

## Known simplifications / good next steps

- **Progress photo uploads**: the schema and UI slots are in place (`progress_photos` table, gallery placeholders), but the Supabase Storage upload flow itself isn't wired up yet. Create a `progress-photos` storage bucket and add an upload form.
- **Notification generation** currently runs inline when the coach visits their dashboard, not on a schedule. For production, move `generateReminderNotifications()` (in `src/lib/notifications/generate.ts`) into a daily Supabase Edge Function or Vercel Cron job.
- **Cardio tracking** reuses `workout_completed` as a proxy for cardio compliance. Add a `cardio_minutes` column to `daily_logs` for real tracking.
- **Calorie/macro estimation** is manual (coach enters numbers in the food review screen). `src/lib/calculations/nutrition.ts` has a stub (`estimateFromDescription`) ready to be swapped for an AI call.

## Future features (structured for, not yet built)

The schema and code organization were designed so these drop in cleanly:

- **AI calorie estimation from meal descriptions** — wire into `estimateFromDescription()` in `lib/calculations/nutrition.ts`, called from the food review flow.
- **AI meal plan / workout generators** — new API routes alongside `/api/workouts`, writing into the existing `workout_programs` / `targets` tables.
- **Stripe subscriptions** — `clients.status` already models `ACTIVE`/`PAUSED`/`ARCHIVED`; add a `subscriptions` table and webhook route.
- **Appointment booking** — new `appointments` table + calendar UI.
- **Habit / supplement tracking** — new tables following the same `client_id`-scoped + RLS pattern as everything else.
- **Document uploads / exercise video library** — Supabase Storage buckets, same pattern as progress photos.

## Design system

Dark by default — black background, charcoal surfaces, a single blue accent (`--color-accent`), all defined in `src/app/globals.css` via Tailwind v4's `@theme`. Reusable primitives live in `src/components/ui/`; keep new UI consistent by composing those rather than one-off styles.

## Note on this copy

`package-lock.json` was intentionally not copied (it's a large generated file) — running `npm install` will regenerate it fresh, which is expected and fine.
