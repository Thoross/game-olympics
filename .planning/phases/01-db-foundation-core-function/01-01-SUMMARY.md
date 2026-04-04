---
phase: 01-db-foundation-core-function
plan: "01"
subsystem: database
tags: [supabase, postgres, rls, migrations, typescript, types]

# Dependency graph
requires: []
provides:
  - season_scoring_schedules table with schedule_id, season_id, multipliers, created_at, updated_at columns
  - CHECK constraints enforcing non-empty array and all-positive multipliers
  - RLS policies: SELECT for authenticated, INSERT/UPDATE/DELETE for ADMIN role only
  - Fixed generate:types script pointing to src/lib/database.types.ts
  - Regenerated Database types including season_scoring_schedules Row/Insert/Update
affects:
  - 01-db-foundation-core-function
  - All phases reading scoring schedule data from Supabase

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Supabase migration file naming: YYYYMMDDHHMMSS_description.sql"
    - "RLS via public.get_user_role() helper — matches existing RBAC pattern"
    - "Postgres integer[] maps to TypeScript number[] in generated types"

key-files:
  created:
    - supabase/migrations/20260403000000_add_season_scoring_schedules.sql
  modified:
    - package.json
    - src/lib/database.types.ts

key-decisions:
  - "CHECK constraint uses 0 < ALL(multipliers) instead of subquery form — Supabase remote rejected the subquery form with a planning error"
  - "Separate season_scoring_schedules table (not a column on seasons) — absent row = legacy scoring; cleaner RLS isolation"

patterns-established:
  - "Migration files pushed directly to remote via npx supabase db push (no local dev instance)"
  - "Types regenerated after each migration via npm run generate:types"

requirements-completed: [DB-01, DB-02, DB-03]

# Metrics
duration: ~30min (includes human-action checkpoint)
completed: 2026-04-03
---

# Phase 01 Plan 01: DB Foundation Summary

**season_scoring_schedules Postgres table with RLS, non-empty/positive array CHECK constraints, and regenerated TypeScript types including multipliers: number[]**

## Performance

- **Duration:** ~30 min (includes human-action checkpoint for remote migration push)
- **Started:** 2026-04-03
- **Completed:** 2026-04-03
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Created `season_scoring_schedules` table with UUID PK, one-to-one FK to `seasons`, non-nullable `multipliers integer[]`, and `created_at`/`updated_at` timestamps
- Applied CHECK constraints: `cardinality(multipliers) > 0` (non-empty) and `0 < ALL(multipliers)` (all values positive)
- Enabled RLS with four policies: SELECT for any authenticated user; INSERT, UPDATE, DELETE restricted to ADMIN role via `public.get_user_role()`
- Fixed `generate:types` script path in package.json from `database.types.ts` (project root) to `src/lib/database.types.ts`
- Regenerated `src/lib/database.types.ts` — now contains `season_scoring_schedules` with `multipliers: number[]`

## Task Commits

Each task was committed atomically:

1. **Task 1: Create migration SQL and fix generate:types script** - `34ae429` (feat)
2. **Task 2: Push migration and regenerate types** - `747825e` (feat)

## Files Created/Modified
- `supabase/migrations/20260403000000_add_season_scoring_schedules.sql` - Migration creating table, constraints, and RLS policies
- `package.json` - Fixed generate:types output path to `src/lib/database.types.ts`
- `src/lib/database.types.ts` - Regenerated types including `season_scoring_schedules` table type

## Decisions Made
- The original plan's CHECK constraint `CHECK (multipliers = ARRAY(SELECT v FROM unnest(multipliers) v WHERE v > 0))` was rejected by Supabase remote (planning error on subquery inside CHECK). Replaced with `CHECK (0 < ALL(multipliers))` which is semantically equivalent and accepted by Postgres. This is the form that was actually applied to the remote database.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed CHECK constraint subquery form rejected by remote Supabase**
- **Found during:** Task 2 (Push migration to remote Supabase)
- **Issue:** The plan specified `CHECK (multipliers = ARRAY(SELECT v FROM unnest(multipliers) v WHERE v > 0))` — Supabase remote rejected this form with a planning error; subqueries are not allowed in CHECK constraints in this context
- **Fix:** Replaced with `CHECK (0 < ALL(multipliers))` which achieves the same semantic (all elements > 0) using the standard ALL operator
- **Files modified:** `supabase/migrations/20260403000000_add_season_scoring_schedules.sql`
- **Verification:** Migration applied successfully to remote; no errors
- **Committed in:** `747825e`

---

**Total deviations:** 1 auto-fixed (1 bug fix)
**Impact on plan:** Essential fix for migration to succeed. Constraint is semantically equivalent — all multiplier values must be positive. No scope creep.

## Issues Encountered
- Supabase remote rejected the subquery-based CHECK constraint. Fixed by using `0 < ALL(multipliers)` instead. Migration applied cleanly after the fix.

## User Setup Required
None - migration was pushed to remote Supabase during this plan execution. Types are regenerated. No additional environment variables or dashboard steps needed.

## Next Phase Readiness
- `season_scoring_schedules` table exists in remote Supabase with correct schema and RLS
- TypeScript types in `src/lib/database.types.ts` include `season_scoring_schedules` with `multipliers: number[]`
- Ready for Plan 02: `getMultiplier` pure function implementation (already completed in parallel)
- All subsequent plans can import and use the `season_scoring_schedules` type from `$lib/database.types`

---
*Phase: 01-db-foundation-core-function*
*Completed: 2026-04-03*
