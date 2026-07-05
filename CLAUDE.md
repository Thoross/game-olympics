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

## Project

**Game Olympics — Configurable Season Scoring**

Game Olympics is a board game tracking app for a group of players competing across seasons. Each season consists of a series of sessions where players play specific board games and earn standings points based on their finish position. This milestone adds a configurable per-season scoring system where a multiplier schedule controls how standings points scale for each game's sessions within a season.

**Core Value:** Players can see standings that accurately reflect a season's intended scoring schedule — with points that escalate as a game is played more times within the season.

### Constraints

- **Tech stack**: Must use existing SvelteKit + Supabase stack — no new backend services
- **DB schema**: Requires Supabase migration; types regenerated via `npm run generate:types`
- **Backwards compat**: Existing seasons without a schedule must continue to work with the fixed 4/3/2/1 system
- **Auth**: Schedule management is admin-only; follow existing `requireAdmin()` pattern

## Technology Stack

## Languages

- TypeScript ^5.9.3 - All application code (`.ts`, `.svelte`)
- Svelte 5 ^5.54.0 - Component templates with runes syntax
- JavaScript - Configuration files (`svelte.config.js`, `eslint.config.js`)

## Runtime

- Node.js v22.15.0
- npm 11.4.2
- Lockfile: `package-lock.json` present

## Frameworks

- SvelteKit ^2.55.0 - Full-stack web framework (`@sveltejs/kit`)
- Svelte ^5.54.0 - Component framework with runes (`$props()`, `$derived()`, `$state()`)
- Vite ^8.0.1 - Dev server and build tool
- shadcn-svelte via bits-ui ^2.16.3 - Component library in `src/lib/components/ui/`
- Tailwind CSS ^4.1.18 - Utility-first CSS via `@tailwindcss/vite` plugin
- tailwind-merge ^3.5.0 - Class merging utility
- tailwind-variants ^3.2.2 - Variant-based styling
- tw-animate-css ^1.4.0 - Animation utilities
- LayerChart ^2.0.0-next.43 - Charting library (pre-release)
- Lucide Svelte ^0.577.0 - Icon library (`@lucide/svelte`)
- Vitest ^4.1.0 - Test runner (server project only, node environment)
- Playwright ^1.58.1 - Browser testing (client project currently commented out in config)
- `@vitest/browser-playwright` ^4.0.18 - Browser test integration (inactive)
- `vitest-browser-svelte` ^2.0.2 - Svelte browser test rendering (inactive)
- `@sveltejs/adapter-auto` ^7.0.0 - Auto-detecting deployment adapter
- `@sveltejs/vite-plugin-svelte` ^7.0.0 - Svelte Vite integration
- `@tailwindcss/vite` ^4.2.2 - Tailwind CSS Vite plugin
- svelte-check ^4.4.5 - Type checking for Svelte files
- ESLint ^10.0.3 - Linting
- eslint-plugin-svelte ^3.14.0 - Svelte-specific lint rules
- eslint-config-prettier ^10.1.8 - Disable ESLint rules that conflict with Prettier
- Prettier ^3.8.1 - Code formatting
- prettier-plugin-svelte ^3.4.1 - Svelte formatting
- prettier-plugin-tailwindcss ^0.7.2 - Tailwind class sorting

## Key Dependencies

- `@supabase/supabase-js` ^2.33.0 - Supabase client for database and auth
- `@supabase/ssr` ^0.8.0 - Supabase SSR integration for server-side auth cookie handling
- `zod` ^4.3.6 - Schema validation (schemas in `src/lib/schemas/`)
- `mode-watcher` ^1.1.0 - Dark/light mode management
- `bits-ui` ^2.16.3 - Headless UI primitives for shadcn-svelte
- `@tanstack/table-core` ^8.21.3 - Headless table logic
- `@internationalized/date` ^3.12.0 - Date handling for internationalized calendars
- `@fontsource-variable/public-sans` ^5.2.7 - Self-hosted Public Sans variable font
- `clsx` ^2.1.1 - Conditional class string construction
- `layerchart` ^2.0.0-next.43 - Chart components built on D3/LayerCake

## Configuration

- Config: `tsconfig.json` extends `.svelte-kit/tsconfig.json`
- Strict mode enabled
- Module resolution: `bundler`
- Source maps enabled
- Config: `svelte.config.js`
- Adapter: `adapter-auto` (auto-detects deployment platform)
- Path aliases: `$components` -> `src/components`, `$routes` -> `src/routes`, `$lib` -> `src/lib` (default)
- TypeScript config extended to include `tests-unit/**/*.ts`
- Config: `vite.config.ts`
- Plugins: `@tailwindcss/vite`, `sveltekit`
- Config: embedded in `vite.config.ts`
- `expect.requireAssertions: true` - All tests must contain assertions
- Active project: `server` (node environment, tests in `tests-unit/**/*.{test,spec}.{js,ts}`)
- Inactive project: `client` (browser/Playwright, commented out)
- Coverage provider: Istanbul
- `.env` file present - contains Supabase connection vars (not read for security)
- Public env vars accessed via `$env/static/public`: `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- ESLint config: `eslint.config.js`
- Prettier config: `.prettierrc`

## Build Commands

## Platform Requirements

- Node.js v22+
- npm 11+
- Supabase project access (project ID: `ouzhwuxmfjrfktlwnwjo`)
- Determined by `adapter-auto` (supports Vercel, Netlify, Cloudflare Pages, etc.)
- Requires `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_PUBLISHABLE_KEY` environment variables

## Conventions

## Code Style & Formatting

- **Prettier**: No tabs, single quotes, trailing commas, no semicolons, 100 char print width
- **ESLint**: `eslint-config-prettier` + `eslint-plugin-svelte` + `typescript-eslint`

## Svelte 5 Patterns

- **Runes throughout**: `$props()`, `$derived()`, `$state()` — no legacy `export let` or stores
- Components use Svelte 5 syntax exclusively
- Client-side reactivity via `$state()` and `$derived()`

## TypeScript

- Strict typing with Supabase `Database` type for all DB interactions
- `App.Locals` in `src/app.d.ts` defines server-side context types
- Zod v4 schemas for form validation in `src/lib/schemas/`
- Error utility: `getZodErrors()` in `src/lib/utils/getZodErrors.ts`

## Component Patterns

- **UI primitives**: shadcn-svelte (bits-ui) in `src/lib/components/ui/` — not modified directly
- **App components**: `src/lib/components/` — custom components for app-specific UI
- **Table components**: Dedicated table components in `src/lib/components/tables/`
- **Charts**: LayerChart (`LineChart`) wrapped in `ChartContainer` from `$lib/components/ui/chart`

## Server-Side Patterns

- Server hooks pipeline: supabase → hasAuthSession → augmentUser
- Data loading in `+page.server.ts` / `+layout.server.ts`
- Form actions for mutations (named actions: `updateDetails`, `addPlayer`, etc.)
- Pure business logic extracted to co-located `utils.server.ts` files
- Authorization via `requireAdmin()` / `isAdmin()` from `$lib/server/authorization`

## Import Conventions

- `$lib/` alias for `src/lib/`
- Supabase types imported from `$lib/database.types`
- UI components imported from `$lib/components/ui/<component>`
- Server utilities from `$lib/server/`

## CSS

- Tailwind CSS v4 with `@tailwindcss/vite` plugin
- Global styles in `src/routes/layout.css`
- Tailwind class ordering managed by prettier-plugin-tailwindcss

## Architecture

## Overview

## Server Hooks Pipeline

## Layers

### Data Access

- All database access through Supabase client (typed with `Database` from `$lib/database.types`)
- Server-side client created in hooks, available on `event.locals.supabase`
- Client-side Supabase client at `src/lib/supabase/client.ts` (public key only)

### Server Load Functions

- `+layout.server.ts` files load shared data (session, user)
- `+page.server.ts` files load page-specific data
- Form actions handle mutations (e.g., admin season management has `updateDetails`, `addPlayer`, `removePlayer`)

### Business Logic

- Pure functions extracted to `utils.server.ts` files co-located with routes
- Key examples: `src/routes/(authed)/seasons/[seasonId=uuid]/stats/utils.server.ts` (scoring, standings, aggregations)
- `src/routes/(authed)/admin/sessions/add/utils.server.ts` (session creation utilities)

### Authorization

- `src/lib/server/authorization.ts` exports `requireAdmin()` and `isAdmin()`
- Auth hook redirects unauthenticated users
- Admin routes should call `requireAdmin()` in their load/action functions

### UI Components

- shadcn-svelte components in `src/lib/components/ui/` (card, tabs, sidebar, input, alert, etc.)
- Custom app components in `src/lib/components/` (Alert, Breadcrumbs, Table, SeasonsTable, GamesTable, etc.)
- Charts via LayerChart wrapped in `ChartContainer` from `$lib/components/ui/chart`

## Data Flow

```

```

## Key Types

- `App.Locals` (`src/app.d.ts`): `supabase`, `safeGetSession`, `session`, `user` (Supabase `User` + player fields)
- `Database` (`src/lib/database.types.ts`): Generated Supabase types for all tables
- Zod schemas in `src/lib/schemas/` for form validation (signin, registration, game add, etc.)

## Scoring System
