# Game Olympics

A board-game tracking app for a group of players competing across **seasons**. Each season is a series of **sessions** in which players play specific board games and earn standings points based on their finish position. Players can view live standings, per-game stats, and score history over the course of a season.

Live at **[gameolympics.ca](https://gameolympics.ca)**.

## Tech Stack

- **[SvelteKit](https://svelte.dev/docs/kit)** + **Svelte 5** (runes: `$props()`, `$derived()`, `$state()`)
- **[Supabase](https://supabase.com)** — auth + Postgres
- **[shadcn-svelte](https://shadcn-svelte.com)** (bits-ui) components
- **Tailwind CSS v4**
- **Zod v4** for validation
- **LayerChart** for charts
- **Vitest** for unit tests, deployed via **Vercel**

## Prerequisites

- **Node.js 22+** and **npm 11+** (`engine-strict=true` — installs will fail on older Node)
- A **Supabase** project (auth + Postgres)

## Getting Started

```sh
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# then fill in your Supabase values (see below)

# 3. Start the dev server
npm run dev            # or: npm run dev -- --open
```

### Environment Variables

Create a `.env` from `.env.example` with:

| Variable                          | Description                                       |
| --------------------------------- | ------------------------------------------------- |
| `PUBLIC_SUPABASE_URL`             | Your Supabase project URL                         |
| `PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable (anon) key                   |
| `BGG_API_TOKEN`                   | Bearer token for BoardGameGeek XML API (optional) |

The `PUBLIC_*` variables are exposed to the client via `$env/static/public`.

`BGG_API_TOKEN` is a server-only secret read at runtime via `$env/dynamic/private`.
When set, it is sent as an `Authorization: Bearer` header on BoardGameGeek XML API
requests; when unset, requests are made unauthenticated (game metadata enrichment
degrades gracefully). Set it in your host's dashboard for production deploys.

## Database

Schema is managed with Supabase migrations in `supabase/migrations/`.

```sh
# Apply migrations to your Supabase project (via the Supabase CLI)
supabase db push

# Regenerate TypeScript types from the remote schema
npm run generate:types   # writes src/lib/database.types.ts
```

Core tables: `seasons`, `games`, `sessions`, `player`, `player_sessions`, `season_players`.

## Scripts

| Command                  | Description                                  |
| ------------------------ | -------------------------------------------- |
| `npm run dev`            | Start the dev server                         |
| `npm run build`          | Production build                             |
| `npm run preview`        | Preview the production build                 |
| `npm run check`          | Svelte / TypeScript type checking            |
| `npm run lint`           | Prettier + ESLint check                      |
| `npm run format`         | Auto-format with Prettier                    |
| `npm run test`           | Run all unit tests once                      |
| `npm run test:unit`      | Run tests in watch mode                      |
| `npm run generate:types` | Regenerate Supabase types from remote schema |

## Architecture

### Server hooks pipeline (`src/hooks.server.ts`)

1. **supabase** — creates a typed `SupabaseClient<Database>` on `event.locals`; adds `safeGetSession()` (validates the JWT via `getUser()`)
2. **hasAuthSession** — redirects unauthenticated users to `/auth/signin`
3. **augmentUser** — attaches `player_id`, `player_name`, and `player_role` to `event.locals.user`

### Routes

All routes under `(authed)/` require authentication.

- `/` — seasons list
- `/seasons/[seasonId]` — season detail with **standings**, **stats**, and **sessions** tabs
- `/games`, `/games/[gameId]`, `/games/add` — game catalogue
- `/admin/*` — admin-only management (seasons, sessions, games, players); gated by `player_role = 'ADMIN'` via `requireAdmin()`
- `/api/*` — JSON endpoints (`/api/games`, `/api/player`, `/api/player/[id]`)

### Scoring

Standings points are awarded by finish position (1st → 4, 2nd → 3, 3rd → 2, 4th → 1, 5th+ → 0). Pure aggregation logic lives in co-located `utils.server.ts` files (e.g. `src/routes/(authed)/seasons/[seasonId=uuid]/stats/utils.server.ts`) so it can be unit-tested without the framework.

## Conventions

- Svelte 5 **runes** throughout — no legacy `export let` or stores
- All Supabase clients typed with `Database` from `$lib/database.types`
- Prettier: no semicolons, single quotes, 100-char width
- Extract pure logic into `utils.server.ts` for testability; tests require assertions

See [`CLAUDE.md`](./CLAUDE.md) for deeper architectural notes.
