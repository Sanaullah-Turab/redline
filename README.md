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
  - Official 2026 driver grid hardcoded in `lib/f1.ts` to guarantee clean data independent of upstream API latency.
- **Hosting**: Vercel
- **Scoring Automation**: GitHub Actions scheduled workflow with fallback Vercel Cron

---

## Project Structure

```text
.
├── .github/
│   └── score-predictions.yml     # GitHub Actions workflow for scheduled scoring (every 30 min)
├── app/                          # Next.js App Router root
│   ├── actions/
│   │   └── predictions.ts        # Server actions to save and fetch user predictions
│   ├── api/
│   │   ├── auth/
│   │   │   └── [...all]/         # Better Auth route handlers
│   │   ├── cron-score/
│   │   │   └── route.ts          # Automated scoring route for all pending sessions
│   │   └── score/
│   │       └── route.ts          # Targeted scoring route with optional force-rescore support
│   ├── calendar/
│   │   └── page.tsx              # Filterable full-season Grand Prix calendar
│   ├── leaderboard/
│   │   └── page.tsx              # Championship leaderboard with podium and accuracy metrics
│   ├── predict/
│   │   └── [round]/
│   │       └── page.tsx          # Prediction picker interface for race weekends
│   ├── profile/
│   │   └── [id]/
│   │       └── page.tsx          # User stats, points by round, and session history
│   ├── sign-in/
│   │   └── page.tsx              # Authentication sign-in page
│   ├── sign-up/
│   │   └── page.tsx              # Authentication registration page
│   ├── stats/
│   │   └── page.tsx              # Season telemetry, global accuracy, and round totals
│   ├── styles/                   # Modular CSS stylesheets
│   │   ├── effects.css
│   │   ├── header.css
│   │   ├── home.css
│   │   ├── mobile-menu.css
│   │   └── stats.css
│   ├── globals.css               # Tailwind CSS entrypoint and theme variables
│   ├── layout.tsx                # Root layout with metadata and site header
│   ├── loading.tsx               # Top-level loading state
│   ├── not-found.tsx             # Custom 404 page
│   └── page.tsx                  # Home page with upcoming race hero, stats, and calendar preview
├── components/                   # Reusable UI components
│   ├── ui/
│   │   └── button.tsx            # Button primitive
│   ├── auth-form.tsx             # Sign in and sign up form component
│   ├── bar-chart.tsx             # CSS bar chart for round points distribution
│   ├── countdown.tsx             # Dynamic session countdown timer
│   ├── mobile-menu.tsx           # Responsive drawer navigation for mobile devices
│   ├── nav-links.tsx             # Header navigation links with active state
│   ├── prediction-picker.tsx     # DnD-kit sortable grid for ordering top 10 picks
│   ├── race-calendar.tsx         # Interactive search and filterable race schedule
│   ├── sign-out-button.tsx       # Auth sign-out control
│   ├── site-header.tsx           # Global site navigation header
│   └── stat-card.tsx             # Metric display cards
├── drizzle/                      # Drizzle schema migrations and metadata
│   ├── 0000_faithful_sunfire.sql
│   ├── 0001_enable_rls.sql
│   └── meta/
├── lib/                          # Core application utilities and business logic
│   ├── db/
│   │   ├── index.ts              # PostgreSQL connection pool and Drizzle client
│   │   └── schema.ts             # Database tables, relations, and types
│   ├── auth.ts                   # Better Auth server configuration
│   ├── auth-client.ts            # Better Auth client hooks and helpers
│   ├── driver-mapping.ts         # Driver normalization, number/code mapping, and alias equivalence
│   ├── f1.ts                     # Jolpica Ergast API fetching, schedule caching, and classification parsing
│   ├── openf1.ts                 # OpenF1 session resolver and fallback classification parser
│   ├── scoring.ts                # Scoring engine, session validation, and database updates
│   ├── stats.ts                  # Standings calculation, user profiles, and season metrics
│   └── utils.ts                  # Shared helper functions (clsx, twMerge)
├── public/                       # Static public assets, icons, and brand graphics
│   ├── images/brand/             # Official Redline logos and brand marks
│   ├── icon.svg
│   └── placeholder.svg
├── supabase/
│   └── config.toml               # Supabase configuration for local environments
├── drizzle.config.ts             # Drizzle Kit configuration
├── next.config.mjs               # Next.js configuration
├── package.json                  # Project dependencies and run scripts
├── pnpm-lock.yaml                # Lockfile for pnpm
├── pnpm-workspace.yaml           # pnpm configuration settings
├── postcss.config.mjs            # PostCSS configuration for Tailwind
├── tsconfig.json                 # TypeScript compiler options
└── vercel.json                   # Vercel deployment and cron configuration
```

---

## Database Schema (`lib/db/schema.ts`)

The database is PostgreSQL hosted on Supabase and managed using Drizzle ORM.

### Auth Tables (managed by Better Auth)
- `user`: User account details (`id`, `name`, `email`, `createdAt`, `updatedAt`).
- `session`: Active sessions (`id`, `token`, `userId`, `expiresAt`).
- `account`: Provider credentials and password hashes (`id`, `userId`, `providerId`, `password`).
- `verification`: Tokens for account verification flows.

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

### 1. Official Results & Dual-Source Fallback (`lib/f1.ts`, `lib/openf1.ts`, `lib/driver-mapping.ts`)
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
- Sprint Qualifying predictions accept picks but award 0 points by design.
- **Scheduled Scoring**:
  - GitHub Actions runs `.github/score-predictions.yml` every 30 minutes to trigger `/api/cron-score`.
  - Vercel Cron runs daily as a secondary fallback.
- **Targeted / Force Scoring**:
  - `/api/score?round=[round]&type=[sessionType]&force=true` can be called to score or re-score any session on demand. Both endpoints require a `Bearer <CRON_SECRET>` authorization header.

---

## Environment Variables

Configure the following environment variables in `.env.local` for local development and in your hosting dashboard for production:

```env
# PostgreSQL connection string (Supabase transaction pooler recommended)
DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"

# Better Auth configuration
BETTER_AUTH_URL="http://localhost:3000"
BETTER_AUTH_SECRET="<32-byte-secure-random-string>"

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

---

## License

Copyright (c) 2026 Sanaullah Turab. All rights reserved.

This project is not open source. The source code is made available for educational and contribution purposes only. You may study the code and submit contributions, but you may not use it commercially, redistribute it, or deploy it publicly without written permission. See the [LICENSE](./LICENSE) file for full terms.
