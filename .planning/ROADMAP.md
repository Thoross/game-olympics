# Roadmap: Game Olympics — Configurable Season Scoring

## Overview

This milestone adds a configurable per-season multiplier schedule to the existing fixed 4/3/2/1 scoring system. Three phases deliver the feature from the ground up: the database schema and pure scoring function (Phase 1), the scoring pipeline wired into both display paths (Phase 2), and the admin UI for creating and managing schedules (Phase 3). Existing seasons require no changes.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: DB Foundation & Core Function** - Schema, types, and the pure `getMultiplier()` function with full boundary coverage
- [ ] **Phase 2: Scoring Pipeline** - Multiplied points flow through both standings and stats load paths; canonical session ordering established
- [ ] **Phase 3: Admin UI** - Admin can create and update multiplier schedules from `/admin/scoring`; season detail links to the schedule

## Phase Details

### Phase 1: DB Foundation & Core Function
**Goal**: The `season_scoring_schedules` table exists with correct RLS, the `generate:types` path bug is fixed and types are regenerated, and `getMultiplier()` is implemented and unit-tested with full boundary coverage
**Depends on**: Nothing (first phase)
**Requirements**: DB-01, DB-02, DB-03, SCORING-04, SCORING-05
**Success Criteria** (what must be TRUE):
  1. A `season_scoring_schedules` row can be inserted for a season and queried back with the correct `multipliers` integer array; rows with empty or non-positive values are rejected at the DB level
  2. An authenticated non-admin user attempting INSERT or DELETE on `season_scoring_schedules` receives a permission error; a SELECT succeeds
  3. Running `npm run generate:types` writes output to `src/lib/database.types.ts` (not the project root) and the generated file includes the `season_scoring_schedules` table type
  4. `getMultiplier(null, n)` returns 1; `getMultiplier([], n)` returns 1; `getMultiplier([1,2,3], 2)` returns 2; `getMultiplier([1,2,3], 5)` returns 3 (overflow repeats last) — all verified by unit tests
  5. Seasons without a `season_scoring_schedules` row continue to display the same fixed standings values as before this phase
**Plans:** 2 plans
Plans:
- [x] 01-01-PLAN.md — DB migration, RLS policies, generate:types fix, type regeneration
- [x] 01-02-PLAN.md — TDD getMultiplier() pure function with boundary tests

### Phase 2: Scoring Pipeline
**Goal**: Both the standings tab and the stats tab apply the season's multiplier schedule when one exists, using canonical session ordering, with no visual change for seasons that have no schedule
**Depends on**: Phase 1
**Requirements**: SCORING-02, SCORING-03, DISPLAY-01, DISPLAY-02, DISPLAY-03
**Success Criteria** (what must be TRUE):
  1. For a season with schedule `[1, 2, 3]` and a game played 3 times, the standings tab shows 1st-place standings points as 4, 8, and 12 for the 1st, 2nd, and 3rd sessions respectively
  2. The stats tab shows the same multiplied point totals as the standings tab for the same season — no discrepancy between the two tabs
  3. Session ordering for multiplier assignment is `session_date_played ASC, session_id ASC` in both the stats and standings load paths (same canonical sort)
  4. For a game played more times than the schedule defines (overflow), the last multiplier in the schedule is applied to all excess sessions — verified in both tabs
  5. Seasons without a schedule row display the same standings values as before Phase 2 (no visual change)
**Plans:** 2 plans
Plans:
- [x] 02-01-PLAN.md — Consolidate positionToPoints into shared module, add schedule fetch to season layout
- [ ] 02-02-PLAN.md — Wire multiplier into both standings and stats pipelines with canonical sort and per-game counter

### Phase 3: Admin UI
**Goal**: Admin can view all season schedules in one place, create or update a season's multiplier schedule, and the season detail admin page links directly to that season's schedule
**Depends on**: Phase 2
**Requirements**: SCORING-01, ADMIN-01, ADMIN-02, ADMIN-03
**Success Criteria** (what must be TRUE):
  1. Navigating to `/admin/scoring` as an admin shows a list of all seasons, each with either its active multiplier schedule (e.g. "1x -> 2x -> 2x -> 3x") or "No schedule" for legacy seasons
  2. An admin can create a new multiplier schedule for a season (or update an existing one) using a form with ordered number inputs; submitting an empty list or a non-positive integer is rejected with a validation error
  3. After saving a schedule, the standings and stats tabs for that season immediately reflect the new multiplied point totals
  4. The season detail admin page (`/admin/seasons/[seasonId]`) shows a read-only schedule summary and an admin-only link to `/admin/scoring?season=[seasonId]`
  5. A non-admin user cannot access `/admin/scoring` (redirected or shown an error)
**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. DB Foundation & Core Function | 2/2 | Complete |  |
| 2. Scoring Pipeline | 1/2 | In Progress | - |
| 3. Admin UI | 0/TBD | Not started | - |
