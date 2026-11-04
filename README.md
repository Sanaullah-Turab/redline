# Redline: F1 Prediction Game

Redline is a Formula 1 prediction game built with Next.js. Users can sign in, view the F1 schedule, and drag-and-drop to predict the top 10 finishers for upcoming qualifying, race, sprint qualifying, and sprint sessions. The app automatically fetches official results, validates classification data, and scores user predictions.

Live at: [redline.sanaullah.app](https://redline.sanaullah.app)

## Tech Stack

- **Framework**: [Next.js 16.2.6](https://nextjs.org/) (App Router, Server Actions)
- **Package Manager**: pnpm
- **Language**: TypeScript 5.7.3
- **Styling and UI**: [Tailwind CSS 4](https://tailwindcss.com/), [Shadcn UI](https://ui.shadcn.com/), Lucide React
- **Authentication**: [Better Auth](https://better-auth.com/)
- **Database**: PostgreSQL (hosted on [Supabase](https://supabase.com/)), managed via [Drizzle ORM](https://orm.drizzle.team/)
- **Interactivity**: `@dnd-kit` for drag-and-drop prediction lists
- **Telemetry and Official Results**:
  - Primary: Jolpi Ergast F1 API (`https://api.jolpi.ca/ergast/f1`) for schedules and official classifications.
  - Fallback: OpenF1 API (`https://api.openf1.org/v1`) when primary results are malformed, delayed, or contain duplicate positions.
  - Official 2026 driver grid hardcoded in `lib/f1/drivers.ts` to guarantee clean data independent of upstream API latency.
- **Hosting**: Vercel
- **Scoring Automation**: GitHub Actions scheduled workflow with fallback Vercel Cron

---

## Project Structure

```text
.
├── .github/workflows/score-predictions.yml  # Calls /api/cron-score every 30 minutes
├── app/
│   ├── actions/                  # Server actions: predictions (user) and admin (drivers, reference orders)
│   ├── admin/                    # Admin dashboard per round (restricted by ADMIN_EMAILS)
│   ├── api/
│   │   ├── auth/[...all]/        # Better Auth handler
│   │   ├── cron-score/           # Scores all pending sessions
│   │   └── score/                # Targeted scoring with optional force re-score
│   ├── calendar/  leaderboard/  picks/  predict/[round]/  profile/[id]/  stats/
│   ├── sign-in/  sign-up/  forgot-password/  reset-password/
│   ├── styles/                   # Modular CSS (effects, header, home, stats, leaderboard, prediction, picks, calendar, admin)
│   ├── template.tsx              # Per-navigation page transition
│   └── layout.tsx                # Root layout, start-lights intro, analytics
├── components/
│   ├── auth-shell.tsx            # Shared layout for all auth pages
│   ├── auth-form.tsx  forgot-password-form.tsx  reset-password-form.tsx  password-input.tsx
│   ├── start-lights-intro.tsx    # Loading overlay shown on first load, reloads and page changes
│   └── admin/ calendar/ leaderboard/ picks/ prediction/ stats/ ui/
├── drizzle/                      # SQL migrations (see Database)
├── lib/
│   ├── auth.ts  auth-client.ts   # Better Auth server and client
│   ├── mailer.ts                 # SMTP mailer and email templates
│   ├── safe-next.ts              # Validates the ?next= redirect target
│   ├── f1/                       # Schedule, drivers, official results (Jolpica)
│   ├── openf1.ts                 # OpenF1 fallback
│   ├── driver-mapping.ts         # Driver ID normalization across sources
│   ├── scoring.ts  podiums.ts    # Scoring engine and round podiums
│   ├── stats/                    # Standings, profiles, pick analytics
│   └── db/                       # Pool, Drizzle client, schema
├── scripts/                      # Circuit path generation, FastF1 bridge
└── vercel.json                   # Daily fallback cron
```

---

## Database Schema (`lib/db/schema.ts`)

The database is PostgreSQL hosted on Supabase and managed using Drizzle ORM.

### Auth Tables (managed by Better Auth)
- `user`: User account details (`id`, `name`, `email`, `createdAt`, `updatedAt`).
- `session`: Active sessions (`id`, `token`, `userId`, `expiresAt`).
- `account`: Provider credentials and password hashes (`id`, `userId`, `providerId`, `password`).
- `verification`: Tokens for email verification and password reset.

### Domain Tables
- **`predictions`**: Stores a player's top 10 picks for a specific session.
  - Fields: `id`, `userId`, `userName`, `season`, `round`, `sessionType`, `positions` (JSONB array of 10 driver IDs), `points` (default 0), `scored` (boolean default false), `submittedAt`, `updatedAt`.
  - Unique Constraint: `(userId, season, round, sessionType)`.
- **`event_results`**: Caches verified official top 10 results once a session concludes.
  - Fields: `id`, `season`, `round`, `sessionType`, `positions` (JSONB array of 10 driver IDs), `fetchedAt`.
  - Unique Constraint: `(season, round, sessionType)`.

**Security (Row Level Security)**: RLS is enabled on all tables to disable Supabase's auto-generated Data API. The application connects directly via PostgreSQL using node-postgres (`pg`) and Drizzle ORM.

---

## Core Workflows

### 1. Official Results & Dual-Source Fallback (`lib/f1/`, `lib/openf1.ts`, `lib/driver-mapping.ts`)
The application requires verified, contiguous top 10 classifications before awarding any points:
- **Jolpica Ergast API**: The primary source queried for race, qualifying, and sprint results.
- **Strict Validation**: The raw API response is checked to ensure every position `1` through `10` is present, contiguous, and unique. Any payload containing missing positions, duplicate positions, mismatched position numbers, or incomplete qualifying times is rejected.
- **OpenF1 Fallback**: If Jolpica is unavailable or fails validation, the system falls back to OpenF1 (`https://api.openf1.org/v1`), matching session keys by circuit, locality, and race date.
- **Driver Mapping**: `lib/driver-mapping.ts` normalizes driver representations across both APIs using permanent car numbers (`1` to `87`), three-letter acronyms (`VER`, `NOR`, `HAM`), and full-name aliases.

### 2. Prediction Interface (`app/predict/[round]/page.tsx`, `app/actions/predictions.ts`)
- Users navigate to a round to enter predictions.
- Regular race weekends offer tabs for **Qualifying** and **Race**.
- Sprint weekends include four tabs: **Sprint Qualifying**, **Sprint**, **Qualifying**, and **Race**.
- `@dnd-kit` provides interactive drag-and-drop reordering for the 10 selected drivers.
- Prediction submissions automatically lock when the session start timestamp is reached.

### 3. Scoring System (`lib/scoring.ts`, `app/api/cron-score/`, `app/api/score/`)
- Once a session concludes, the official top 10 is fetched, normalized, and saved to `event_results`.
- Predictions are evaluated index by index: 1 point is awarded for each driver predicted in the exact finishing position.
- Sprint Qualifying is scored like every other session: 1 point per exact position.
- A round's sessions are scored sequentially so the round podium is recomputed from complete totals.
- **Scheduled Scoring**:
  - GitHub Actions runs `.github/workflows/score-predictions.yml` every 30 minutes to trigger `/api/cron-score`.
  - Vercel Cron runs daily as a secondary fallback.
- **Targeted / Force Scoring**:
  - `/api/score?round=[round]&type=[sessionType]&force=true` can be called to score or re-score any session on demand. Both endpoints require a `Bearer <CRON_SECRET>` authorization header.

---

## Authentication

- Email and password via Better Auth. With SMTP configured, sign-up requires email verification (links expire in 24 hours) and a sign-in attempt by an unverified user resends the link.
- Forgot password at `/forgot-password`; reset links expire in 1 hour. Both pages are hidden when SMTP is not configured.
- Rate limiting is stored in the `rateLimit` table (active in production): 5 sign-ins/min, 5 sign-ups per 5 min, and 3 reset or verification emails per 5 min per IP. Run `drizzle/0003_rate_limit.sql` on any new database.
- `?next=` returns users to the page they came from; only same-site paths are accepted.

---

## Environment Variables

Configure the following environment variables in `.env.local` for local development and in your hosting dashboard for production:

```env
# PostgreSQL connection string (Supabase transaction pooler recommended)
DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"

# Better Auth configuration (BETTER_AUTH_URL must be the public site URL in production)
BETTER_AUTH_URL="http://localhost:3000"
BETTER_AUTH_SECRET="<32-byte-secure-random-string>"

# Comma-separated emails allowed to use /admin
ADMIN_EMAILS="you@example.com"

# SMTP for email verification and password reset (Gmail app password, Brevo, etc.)
# If unset, verification and reset are disabled and sign-up works without email.
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="465"
SMTP_USER="you@gmail.com"
SMTP_PASS="<app-password>"
SMTP_FROM="Redline <you@gmail.com>"

# Secret protecting the /api/cron-score and /api/score endpoints
CRON_SECRET="<random-secure-string>"
```

*Note: If your database password contains special characters (such as `@`, `#`, or `%`), ensure they are URL-encoded in `DATABASE_URL`.*

---

## Development & Operations

1. **Install dependencies:**
   ```bash
   pnpm install
   ```
2. **Start development server:**
   ```bash
   pnpm dev
   ```
3. **Run type checks:**
   ```bash
   pnpm exec tsc --noEmit
   ```
4. **Build production bundle:**
   ```bash
   pnpm build
   ```
5. **Push schema updates to database:**
   ```bash
   npx drizzle-kit push
   ```
6. **Existing databases:** run `drizzle/0002_verify_existing_users.sql` once before enabling SMTP so accounts created earlier can still sign in.

---

## License

Copyright (c) 2026 Sanaullah Turab. All rights reserved.

This project is not open source. The source code is made available for educational and contribution purposes only. You may study the code and submit contributions, but you may not use it commercially, redistribute it, or deploy it publicly without written permission. See the [LICENSE](./LICENSE) file for full terms.
