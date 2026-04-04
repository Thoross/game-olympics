# Game Olympics — Configurable Season Scoring

## What This Is

Game Olympics is a board game tracking app for a group of players competing across seasons. Each season consists of a series of sessions where players play specific board games and earn standings points based on their finish position. This milestone adds a configurable per-season scoring system where a multiplier schedule controls how standings points scale for each game's sessions within a season.

## Core Value

Players can see standings that accurately reflect a season's intended scoring schedule — with points that escalate as a game is played more times within the season.

## Requirements

### Validated

- ✓ Players can be registered and assigned to seasons — existing
- ✓ Games can be added to the system with an optional BGG URL — existing
- ✓ Admins can record game sessions with per-player scores and auto-ranked positions — existing
- ✓ Standings are calculated per season using a fixed 4/3/2/1 scoring system — existing
- ✓ Season stats page shows standings, per-game stats, session breakdowns, and charts — existing
- ✓ Auth-gated routes with admin role enforcement — existing

### Active

- [ ] **SCORING-01**: Admin can define a multiplier schedule for a season (ordered list of multipliers, e.g. [1, 2, 2, 3])
- [ ] **SCORING-02**: Standings points for a session are calculated as base position points × the nth multiplier, where n is the number of times that game has been played in the season (1st occurrence = multiplier[0], 2nd = multiplier[1], etc.)
- [ ] **SCORING-03**: If a game is played more times than the schedule defines, the last multiplier in the schedule is repeated
- [ ] **SCORING-04**: Existing seasons continue using the fixed 4/3/2/1 system (not required to define a schedule)
- [ ] **SCORING-05**: Admin can manage multiplier schedules from a global `/admin/scoring` page
- [ ] **SCORING-06**: Season detail admin page (`/admin/seasons/[seasonId]`) includes a link to that season's schedule on the global scoring page
- [ ] **SCORING-07**: Standings display shows the multiplied point total (e.g. 8pts for 1st × 2x, not raw 4pts)

### Out of Scope

- Per-position custom points (only multipliers on the base 4/3/2/1 table) — user confirmed multiplier approach
- Per-game-within-season different schedules (one schedule per season, applies to all games) — keeps config simple
- Fractional multipliers (implied; not discussed, defer unless raised)
- Schedule edit history / audit log — not requested

## Context

**Existing scoring logic:** `positionToPoints()` in `src/routes/(authed)/seasons/[seasonId=uuid]/stats/utils.server.ts` maps position → fixed points. All standings aggregation (`buildPlayers`, `buildStandingsOverTime`, etc.) calls this function. Updating the scoring system requires threading the season's multiplier schedule through this pipeline.

**Session ordering for multiplier lookup:** The nth multiplier applies to the nth session played for a given game within a season. This count is derived by querying how many prior sessions exist for the same (season_id, game_id) pair. The session being recorded/queried is 1-indexed: session #1 uses multiplier[0], session #2 uses multiplier[1], etc.

**Database:** Supabase Postgres. A new table (e.g. `season_scoring_schedule`) will store the multiplier array for each season. Alternatively, a JSON/array column on the `seasons` table. Schema change required and types must be regenerated via `npm run generate:types`.

**Tech stack:** SvelteKit + Supabase + Svelte 5 runes. Admin UI uses shadcn-svelte components. Form handling via SvelteKit form actions + Zod schemas. Pure scoring functions in `utils.server.ts` files to keep them testable.

## Constraints

- **Tech stack**: Must use existing SvelteKit + Supabase stack — no new backend services
- **DB schema**: Requires Supabase migration; types regenerated via `npm run generate:types`
- **Backwards compat**: Existing seasons without a schedule must continue to work with the fixed 4/3/2/1 system
- **Auth**: Schedule management is admin-only; follow existing `requireAdmin()` pattern

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Multiplier per session (not per-position points) | Simpler config; proportional scaling preserves relative position value | — Pending |
| One schedule per season (not per-game) | Reduces config complexity; all games in a season share the same escalation cadence | — Pending |
| Global `/admin/scoring` page + link from season detail | Best of both worlds — centralized management with contextual access | — Pending |
| Existing seasons left as-is (no forced migration) | Zero risk of breaking existing standings; opt-in for new seasons | — Pending |
| Last multiplier repeats on overflow | Simple, predictable behavior; admin doesn't need to pre-define all sessions | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-03 after initialization*
