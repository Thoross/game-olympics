# Requirements: Game Olympics — Configurable Season Scoring

**Defined:** 2026-04-03
**Core Value:** Players can see standings that accurately reflect a season's intended scoring schedule — with points that escalate as a game is played more times within the season.

## v1 Requirements

### Database & Schema

- [x] **DB-01**: A `season_scoring_schedules` table exists in Supabase with columns: `schedule_id` (uuid PK), `season_id` (uuid unique FK → seasons), `multipliers` (integer[]), `created_at`, `updated_at`; with DB-level constraints enforcing non-empty and all-positive values
- [x] **DB-02**: Row-level security on `season_scoring_schedules`: authenticated users can SELECT; only ADMIN role can INSERT, UPDATE, DELETE
- [x] **DB-03**: `npm run generate:types` script correctly outputs to `src/lib/database.types.ts` (fix existing path bug) and is run after migration is applied

### Scoring Logic

- [ ] **SCORING-01**: Admin can define a multiplier schedule for a season as an ordered list of positive integers (e.g. `[1, 2, 2, 3]`)
- [x] **SCORING-02**: Standings points for a session are calculated as `positionToPoints(position) × multiplier[n-1]` where `n` = the number of times that game has been played in the season up to and including that session
- [ ] **SCORING-03**: When a game is played more times than the schedule defines, the last multiplier in the schedule is used for all overflow sessions
- [x] **SCORING-04**: Seasons without a schedule row continue using the fixed 4/3/2/1 system unchanged (null schedule → multiplier = 1 for all sessions)
- [x] **SCORING-05**: A pure `getMultiplier(multipliers: number[] | null, n: number): number` function is exported from `utils.server.ts` handling null, empty array, in-range, and overflow inputs; unit tests cover all boundary cases

### Standings & Stats Display

- [ ] **DISPLAY-01**: The standings tab (`/seasons/[id]/standings`) shows the multiplied point total as the canonical value for all sessions in seasons with a schedule
- [x] **DISPLAY-02**: The stats tab (`/seasons/[id]/stats`) shows multiplied point totals consistently with the standings tab — both use the same session ordering (`session_date_played ASC, session_id ASC`) and the same multiplier lookup
- [ ] **DISPLAY-03**: Seasons without a schedule display the same standings values as before (no visual change for legacy seasons)

### Admin UI

- [ ] **ADMIN-01**: A global `/admin/scoring` page lists all seasons with their active multiplier schedule (or "No schedule" for legacy seasons), accessible to ADMIN role only
- [ ] **ADMIN-02**: Admin can create or update a season's multiplier schedule from `/admin/scoring` using a form with an ordered list of number inputs (add step / remove step), validated with Zod (`z.array(z.number().int().positive()).min(1)`)
- [ ] **ADMIN-03**: The season detail admin page (`/admin/seasons/[seasonId]`) includes an admin-only link to `/admin/scoring?season=[seasonId]` and shows a read-only summary of the season's current schedule (e.g. "Scoring: 1× → 2× → 2× → 3×" or "Scoring: fixed (4/3/2/1)")

## v2 Requirements

### Enhancements

- **V2-01**: Live preview of effective points per position as the schedule is edited (client-side `$derived()` — no server round-trip)
- **V2-02**: Points breakdown tooltip in standings ("8 pts = 4 base × 2×") visible on hover
- **V2-03**: Season-level scoring summary visible to all players on the public season detail page
- **V2-04**: Up/down reorder buttons on schedule steps (current v1 approach: delete-and-re-add)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Per-game-within-season different schedules | Confirmed out of scope; one schedule per season covers stated need |
| Fractional/decimal multipliers | Not requested; produces non-integer standings points |
| Schedule edit history / audit log | Not requested |
| Copy schedule between seasons | Rare action; manual re-entry sufficient |
| Per-position custom points (non-proportional) | User confirmed multiplier-on-fixed-table approach |

## Traceability

Updated during roadmap creation: 2026-04-03

| Requirement | Phase | Status |
|-------------|-------|--------|
| DB-01 | Phase 1 | Complete |
| DB-02 | Phase 1 | Complete |
| DB-03 | Phase 1 | Complete |
| SCORING-04 | Phase 1 | Complete |
| SCORING-05 | Phase 1 | Complete |
| SCORING-02 | Phase 2 | Complete |
| SCORING-03 | Phase 2 | Pending |
| DISPLAY-01 | Phase 2 | Pending |
| DISPLAY-02 | Phase 2 | Complete |
| DISPLAY-03 | Phase 2 | Pending |
| SCORING-01 | Phase 3 | Pending |
| ADMIN-01 | Phase 3 | Pending |
| ADMIN-02 | Phase 3 | Pending |
| ADMIN-03 | Phase 3 | Pending |

**Coverage:**
- v1 requirements: 14 total
- Mapped to phases: 14
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-03*
*Last updated: 2026-04-03 after roadmap creation*
