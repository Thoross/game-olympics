---
phase: 02-scoring-pipeline
plan: "01"
subsystem: scoring
tags: [typescript, scoring, shared-module, refactor, layout]

# Dependency graph
requires:
  - "src/lib/server/utils.server.ts (getMultiplier from Phase 01)"
provides:
  - "positionToPoints() in $lib/server/utils.server — single source of truth"
  - "Season layout returns multipliers (number[] | null) to child pages via parent data"
affects: [02-02-PLAN.md, standings pipeline, stats pipeline]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Shared scoring module ($lib/server/utils.server) consolidates all scoring primitives"
    - "Season layout uses Promise.all for parallel fetches; .maybeSingle() for optional FK join"
    - "Child pages receive multipliers via await parent() — no extra DB round trip per tab"

key-files:
  created: []
  modified:
    - src/lib/server/utils.server.ts
    - src/routes/(authed)/seasons/[seasonId=uuid]/+layout.server.ts
    - src/routes/(authed)/seasons/[seasonId=uuid]/standings/utils.server.ts
    - src/routes/(authed)/seasons/[seasonId=uuid]/stats/utils.server.ts
    - src/routes/(authed)/seasons/[seasonId=uuid]/stats/+page.server.ts
    - tests-unit/lib/server/utils.server.test.ts
    - tests-unit/routes/(authed)/seasons/[seasonId=uuid]/standings/utils.server.test.ts
    - tests-unit/routes/(authed)/seasons/[seasonId=uuid]/stats/utils.server.test.ts

key-decisions:
  - "positionToPoints moved to $lib/server/utils.server alongside getMultiplier — both scoring primitives in one file"
  - "standings/utils.server.ts imports positionToPoints from shared module (not local); stats/+page.server.ts does the same"
  - "Season layout fetches season_scoring_schedules in parallel with seasons; .maybeSingle() returns null when no row exists"
  - "multipliers typed as number[] | null — null = legacy season, number[] = configured schedule"

requirements-completed: [SCORING-02, DISPLAY-02]

# Metrics
duration: ~5min
completed: 2026-04-04
---

# Phase 02 Plan 01: Consolidate Scoring Module + Schedule Fetch Summary

**positionToPoints() moved to single shared module; season layout now fetches multipliers via parallel Promise.all with .maybeSingle(), returning null for legacy seasons**

## Performance

- **Duration:** ~5 min
- **Completed:** 2026-04-04
- **Tasks:** 2 tasks, 2 commits
- **Files modified:** 8

## Accomplishments

- Consolidated `positionToPoints()` into `src/lib/server/utils.server.ts` alongside `getMultiplier()` — both scoring primitives now live in one place
- Removed duplicate `positionToPoints` definitions from `standings/utils.server.ts` and `stats/utils.server.ts`
- Updated all import paths: `standings/utils.server.ts` and `stats/+page.server.ts` both import from the shared module
- Added 6 `positionToPoints` tests to `tests-unit/lib/server/utils.server.test.ts` (all positions 0-5+)
- Updated `+layout.server.ts` to fetch `season_scoring_schedules` in parallel with season data via `Promise.all`
- Uses `.maybeSingle()` — returns `null` data (not an error) when no schedule row exists (legacy seasons unchanged)
- Returns `multipliers: number[] | null` to all child pages via SvelteKit's parent data pattern
- All 72 unit tests pass

## Task Commits

1. **Task 1 - Consolidate positionToPoints** - `40fcf43`
2. **Task 2 - Add schedule fetch to layout** - `ba638bc`

## Files Created/Modified

- `src/lib/server/utils.server.ts` — Added `positionToPoints()` export after `getMultiplier()`
- `src/routes/(authed)/seasons/[seasonId=uuid]/+layout.server.ts` — Parallel fetch of season + schedule; returns `multipliers` to child pages
- `src/routes/(authed)/seasons/[seasonId=uuid]/standings/utils.server.ts` — Removed local `positionToPoints`; added import from shared module
- `src/routes/(authed)/seasons/[seasonId=uuid]/stats/utils.server.ts` — Removed local `positionToPoints` (not needed here; called in page.server.ts)
- `src/routes/(authed)/seasons/[seasonId=uuid]/stats/+page.server.ts` — Imports `positionToPoints` from `$lib/server/utils.server.js`
- `tests-unit/lib/server/utils.server.test.ts` — Added `positionToPoints` import and 6 test cases
- `tests-unit/routes/(authed)/seasons/[seasonId=uuid]/standings/utils.server.test.ts` — Fixed import to use `$lib/server/utils.server` (Rule 1 auto-fix)
- `tests-unit/routes/(authed)/seasons/[seasonId=uuid]/stats/utils.server.test.ts` — Fixed import to use `$lib/server/utils.server` (Rule 1 auto-fix)

## Decisions Made

- Both scoring primitives (`getMultiplier` and `positionToPoints`) now live in `$lib/server/utils.server` — single source of truth for all scoring math
- Season layout uses `Promise.all` to avoid serial DB round trips for every season tab navigation
- `.maybeSingle()` chosen over `.single()` to gracefully handle legacy seasons with no schedule row (no error thrown, just null data)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed test imports in standings and stats test files**
- **Found during:** Task 1 execution (tests failed on first run)
- **Issue:** Pre-existing test files `tests-unit/routes/(authed)/seasons/[seasonId=uuid]/standings/utils.server.test.ts` and `tests-unit/routes/(authed)/seasons/[seasonId=uuid]/stats/utils.server.test.ts` imported `positionToPoints` from their co-located utils files. Once those exports were removed, the tests broke with `TypeError: positionToPoints is not a function`.
- **Fix:** Updated both test file imports to import `positionToPoints` from `$lib/server/utils.server` (the new canonical location)
- **Files modified:** Both test files listed above
- **Commit:** `40fcf43`

### Pre-existing check failures (out of scope)

`npm run check` reports 18 pre-existing errors across the codebase (missing env vars in type check environment, spinner/label component casing issues, unrelated API route type errors). None are caused by this plan's changes. Deferred per scope boundary rules.

## Known Stubs

None — all changes wire real data flows. The `multipliers` value returned from the layout is either a real array from the DB or `null` for legacy seasons.

---
*Phase: 02-scoring-pipeline*
*Completed: 2026-04-04*

## Self-Check: PASSED

- FOUND: src/lib/server/utils.server.ts (contains positionToPoints)
- FOUND: src/routes/(authed)/seasons/[seasonId=uuid]/+layout.server.ts (contains maybeSingle, Promise.all, multipliers)
- FOUND: commit 40fcf43 (Task 1)
- FOUND: commit ba638bc (Task 2)
- All 72 tests pass
