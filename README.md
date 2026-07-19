# Redline: F1 Prediction Game

This repository contains **Redline**, a Formula 1 prediction game built with Next.js. Users can sign in, view the F1 schedule, and drag-and-drop to predict the top 10 finishers for upcoming qualifying and race sessions. The app automatically fetches official results and scores user predictions.

This README is designed to give developers (and AI agents) a comprehensive overview of the architecture, stack, and file structure so you can jump straight into building or modifying features.

## 🛠️ Tech Stack

- **Framework**: [Next.js 16.2.6](https://nextjs.org/) (App Router)
- **Styling & UI**: [Tailwind CSS 4](https://tailwindcss.com/), [Shadcn UI](https://ui.shadcn.com/), Lucide React
- **Authentication**: [Better Auth](https://better-auth.com/)
- **Database**: PostgreSQL (hosted on [Supabase](https://supabase.com/)), managed via [Drizzle ORM](https://orm.drizzle.team/)
- **Interactivity**: `@dnd-kit` for drag-and-drop prediction lists
- **External Data**: Jolpi Ergast F1 API (`https://api.jolpi.ca/ergast/f1`) for schedules, drivers, and race results.

---

## 📂 Project Structure

```text
.
├── app/                  # Next.js App Router root
│   ├── api/              # API Routes (Better Auth catch-all, cron-scoring, etc.)
│   ├── leaderboard/      # Leaderboard page UI
│   ├── predict/          # Prediction interface (uses dnd-kit for drag and drop)
│   ├── sign-in/          # Login page
│   ├── sign-up/          # Registration page
│   └── globals.css       # Tailwind entrypoint and CSS variables
├── components/           # Reusable UI components (Shadcn UI & custom)
├── lib/                  # Core application logic & configuration
│   ├── db/               # Database config (index.ts) and Drizzle schema (schema.ts)
│   ├── auth.ts           # Better Auth configuration
│   ├── f1.ts             # External F1 API fetching (Schedule, Drivers, Results)
│   └── scoring.ts        # Logic to compare predictions against official results
├── supabase/             # Supabase configuration (for local dev or migrations)
└── .env.local            # Environment variables (Database URL, Auth secrets)
```

---

## 🗄️ Database Schema (`lib/db/schema.ts`)

The database is PostgreSQL. Drizzle ORM is used for queries and schema declarations.

### Auth Tables (managed by Better Auth)
- `user`: Standard user profile.
- `session`: User sessions for authentication.
- `account`: OAuth / Provider linking.
- `verification`: For email verification or magic links.

### Domain Tables
- **`predictions`**: Stores a user's prediction for a specific session.
  - Fields: `id`, `userId`, `season`, `round`, `sessionType` ('qualifying' | 'race'), `positions` (JSONB array of driver IDs), `points` (integer), `scored` (boolean).
  - *Unique Constraint*: A user can only have one prediction per `[season, round, sessionType]`.
- **`event_results`**: Caches the official top 10 results once a session concludes.
  - Fields: `id`, `season`, `round`, `sessionType`, `positions` (JSONB array).
  - *Unique Constraint*: Only one result per `[season, round, sessionType]`.

---

## ⚙️ Core Workflows

### 1. F1 Data Fetching (`lib/f1.ts`)
The app does not store the entire F1 driver roster or schedule in the database. Instead, it dynamically fetches them from `api.jolpi.ca/ergast/f1`.
- `getSchedule()`: Retrieves the race calendar for the current season.
- `getDrivers()`: Retrieves the driver lineup.
- `getOfficialResults(round, type)`: Fetches the top 10 finishers to be used for scoring.

### 2. Predictions (`app/predict/`)
Users navigate to a specific race and select a session (`qualifying` or `race`). They are presented with a drag-and-drop interface powered by `@dnd-kit`. When saved, the ordered list of driver IDs is stored in the `predictions` table as a JSONB array.

### 3. Scoring (`lib/scoring.ts` & `app/api/cron-score/`)
Once a session concludes:
1. `scoreRound(round, type)` is executed (usually triggered by a cron job or manual API call).
2. It fetches the official top 10 from the Ergast API.
3. If the official results are available, it saves them to `event_results`.
4. It iterates over all un-scored `predictions` for that session, comparing the user's `positions` array against the official `positions` array index by index.
5. 1 point is awarded for every driver placed in the exact correct position.

---

## 🔐 Environment Variables

For the application to run successfully, the `.env.local` file must contain:

```env
# Database connection (e.g. Supabase connection string)
DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"

# Better Auth required variables
BETTER_AUTH_URL="http://localhost:3000"
BETTER_AUTH_SECRET="<32-byte-secure-random-string>"
```

---

## 🚀 Running the App

1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Start the development server:**
   ```bash
   npm run dev
   ```
3. **Database Migrations:**
   Ensure your database is synchronized with your Drizzle schema (you may need `npx drizzle-kit push` or `generate`/`migrate` depending on your workflow).

## 🤖 Notes for AI Agents

- **Modifying the Schema**: If you add columns to `lib/db/schema.ts`, remember to push/migrate the database.
- **Styling**: Always use Tailwind utility classes. If a complex component is needed, check if a Shadcn component exists in `components/ui` or can be added via `npx shadcn@latest add <component>`.
- **Authentication**: Auth state is accessed via Better Auth (`auth.api.getSession` on the server, `useSession` on the client). Avoid writing custom JWT/Cookie logic; rely on Better Auth primitives.
