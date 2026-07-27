# Per-Game Session Numbering — Scores per Session

**Date:** 2026-07-26
**Type:** Bug fix
**Area:** Season stats page → "Scores per Session" table

## Problem

On the season stats page (`/seasons/[seasonId]` → stats tab), the "Scores per Session"
section labels each session tab as `<game_name> <n>`. The number `n` is currently the
**global** index of the session across the whole season, not the number of times that
specific game has been played.

Observed (global index):

```
Brass: Birmingham 1   Galactic Cruise 2   Brass: Birmingham 3   Brass: Birmingham 4   Brass: Birmingham 5   Root 6
```

Expected (per-game occurrence):

```
Brass: Birmingham 1   Galactic Cruise 1   Brass: Birmingham 2   Brass: Birmingham 3   Brass: Birmingham 4   Root 1
```

## Root Cause

In `src/routes/(authed)/seasons/[seasonId=uuid]/stats/+page.svelte`, the session label uses
the array index `i` from `data.sessionBreakdowns`:

- Desktop tabs (~line 124-125): `{session.game_name} {i + 1}`
- Mobile dropdown `sessionItems` (~line 22): `` `${s.game_name} ${i + 1}` ``

`i` is the position in the full, chronologically-ordered list of all sessions, so it counts
total sessions rather than per-game sessions.

## Design

Keep the numbering logic in pure, testable server code rather than the component, matching
the project convention (pure logic in co-located `utils.server.ts`, unit-tested).

### Change 1 — `stats/utils.server.ts`

`buildSessionBreakdowns()` gains a `game_occurrence: number` field on each returned session.
It is a running per-`game_id` counter, incremented in the existing chronological order of
`sessions`. The first session of a given game is `1`, the second `2`, etc. — independent of
other games.

### Change 2 — `stats/+page.svelte`

Replace both `i + 1` usages with `session.game_occurrence` / `s.game_occurrence`:

- Desktop tab label: `{session.game_name} {session.game_occurrence}`
- Mobile `sessionItems` label: `` `${s.game_name} ${s.game_occurrence}` ``

The `i` index in the `{#each}` / `.map()` is no longer needed for labeling (may remain if
still used elsewhere; currently it is only used for the label).

## Testing

Add a unit test under `tests-unit/` mirroring the stats utils, covering
`buildSessionBreakdowns` with an **interleaved** game sequence (e.g. GameA, GameB, GameA,
GameA, GameB) and asserting `game_occurrence` is `[1, 1, 2, 3, 2]` respectively. Assert the
existing fields (date formatting, player sorting) are unaffected.

## Out of Scope

- No change to session ordering, scoring, or any other stats aggregation.
- No DB/schema change.
