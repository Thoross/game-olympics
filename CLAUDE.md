# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev              # Start dev server
npm run build            # Production build
npm run check            # Svelte type checking
npm run lint             # Prettier + ESLint check
npm run format           # Auto-format with Prettier
npm run test             # Run all tests once
npm run test:unit        # Run tests in watch mode
npm run test:unit -- --run --project=server --reporter=verbose src/path/to/file.test.ts  # Single test file
npm run generate:types   # Regenerate Supabase types from remote schema
```

## Tech Stack

- **SvelteKit** with **Svelte 5** (runes: `$props()`, `$derived()`, `$state()`)
- **Supabase** for auth and Postgres database
- **shadcn-svelte** (bits-ui) for UI components in `src/lib/components/ui/`
- **Tailwind CSS v4** with `@tailwindcss/vite` plugin
- **Zod v4** for validation (schemas in `src/lib/schemas/`)
- **LayerChart** (via `layerchart`) for charts, wrapped in `ChartContainer` from `$lib/components/ui/chart`
- **Vitest** — only the `server` project is active (node, `.test.ts` files); the `client` browser project is commented out

## Architecture

### Server Hooks Pipeline

`src/hooks.server.ts` runs three hooks in sequence via `sequence()`:

1. **supabase** (`src/lib/hooks/supabase.ts`) — Creates typed `SupabaseClient<Database>` on `event.locals`, adds `safeGetSession()` which validates JWT via `getUser()`
2. **hasAuthSession** (`src/lib/hooks/hasAuthSession.ts`) — Redirects unauthenticated users to `/auth/signin`; redirects authenticated users away from auth routes
3. **augmentUser** (`src/lib/hooks/augmentUser.ts`) — Looks up `player_id`, `player_name`, and `player_role` from the `player` table and attaches them to `event.locals.user`

### Data Flow

- `+layout.server.ts` exposes `session`, `user`, and `cookies` to all pages
- `App.Locals` (in `src/app.d.ts`) defines: `supabase`, `safeGetSession`, `session`, `user` (Supabase `User` merged with `{ player_id?, player_name?, player_role?: 'ADMIN' | 'PLAYER' }`)
- Client-side Supabase client at `src/lib/supabase/client.ts` uses `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- Admin-only server routes use `requireAdmin()` / `isAdmin()` from `src/lib/server/authorization.ts`

### Database

Supabase project ID: `ouzhwuxmfjrfktlwnwjo`. Tables: `seasons`, `games`, `sessions`, `player`, `player_sessions`, `season_players`. Generated types live in `src/lib/database.types.ts`.

### Routes

All routes under `(authed)/` require authentication (enforced by `hasAuthSession` hook).

**Season detail** (`/seasons/[seasonId]`) has three tabs:
- `standings` — per-player standings points and averages
- `stats` — game play counts, per-session score tables, line charts (standings over time, score per game)
- `sessions` — chronological list of recorded game sessions

**Admin routes** (require `player_role = 'ADMIN'`):
- `/admin/seasons` — list and manage seasons
- `/admin/seasons/[seasonId]` — edit season details; add/remove players via three form actions (`updateDetails`, `addPlayer`, `removePlayer`)
- `/admin/sessions/add` — record a game session (select season + game, add players with scores; positions are auto-ranked by score descending with tie handling)
- `/admin/games/add` — add a new game (name + optional BGG URL)
- `/admin/players` — player management

**API endpoints:** `/api/games`, `/api/player`, `/api/player/[id]`

### Scoring System

Standings points are awarded by finish position: 1st → 4pts, 2nd → 3pts, 3rd → 2pts, 4th → 1pt, 5th+ → 0pts. Implemented in `positionToPoints()` in `src/routes/(authed)/seasons/[seasonId=uuid]/stats/utils.server.ts`, which also exports the pure aggregation functions (`buildGameStats`, `buildPlayers`, `buildSessionBreakdowns`, `buildStandingsOverTime`, `buildScoresByGame`) used by the stats page server load.

Standings sort: `standings_points` desc → `avg_score` desc (tiebreaker).

## Conventions

- Use Svelte 5 runes (`$props()`, `$derived()`, `$state()`) — not legacy `export let` or stores
- All Supabase clients are typed with `Database` from `$lib/database.types`
- Tests require assertions (`expect.requireAssertions: true` in vitest config)
- Unit tests use `.test.ts` (node); extract pure functions from SvelteKit server files into a co-located `utils.server.ts` to keep them testable without mocking the framework
- Line charts use `LineChart` from `layerchart`, wrapped in `ChartContainer` from `$lib/components/ui/chart`
