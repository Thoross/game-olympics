# Per-Game Session Numbering Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Label each session tab in "Scores per Session" with a per-game occurrence number (the Nth time that game was played) instead of the global session index.

**Architecture:** Add a `game_occurrence` field to the output of the pure `buildSessionBreakdowns()` server util (a per-`game_id` running counter over the already-chronological session list), then consume it in the stats `+page.svelte` for both the desktop tabs and the mobile dropdown, replacing the two `i + 1` usages.

**Tech Stack:** SvelteKit, Svelte 5 runes, TypeScript, Vitest (server project, node env).

## Global Constraints

- Prettier: no semicolons, single quotes, trailing commas, 100 char width, no tabs.
- Svelte 5 runes only (`$props()`, `$derived()`, `$state()`) — no `export let`/stores.
- Pure logic lives in co-located `utils.server.ts`; unit tests mirror source under `tests-unit/` and must contain assertions (`expect.requireAssertions: true`).
- Server unit tests run via `npm run test` (node, browser-free).
- Backwards compat: seasons with no/one session must still render correctly.

---

### Task 1: Add `game_occurrence` to `buildSessionBreakdowns`

**Files:**

- Modify: `src/routes/(authed)/seasons/[seasonId=uuid]/stats/utils.server.ts:172-183`
- Test: `tests-unit/routes/(authed)/seasons/[seasonId=uuid]/stats/utils.server.test.ts:167-196`

**Interfaces:**

- Consumes: `NormalizedSession[]` (existing input; sessions are in chronological order).
- Produces: `buildSessionBreakdowns(sessions)` returns objects each now carrying `game_occurrence: number` in addition to the existing `session_id`, `date`, `game_name`, `players`. `game_occurrence` is 1-based, incremented per distinct `game_id` in input order.

- [ ] **Step 1: Write the failing test**

Add this test inside the existing `describe('buildSessionBreakdowns', ...)` block in `tests-unit/routes/(authed)/seasons/[seasonId=uuid]/stats/utils.server.test.ts` (after the existing `it('formats the date ...')` test, before the closing `})` at line 196):

```ts
it('numbers sessions per game in chronological order', () => {
  const sessions = [
    makeSession({ session_id: 's-1', game_id: 'g-a', game_name: 'Game A', player_sessions: [] }),
    makeSession({ session_id: 's-2', game_id: 'g-b', game_name: 'Game B', player_sessions: [] }),
    makeSession({ session_id: 's-3', game_id: 'g-a', game_name: 'Game A', player_sessions: [] }),
    makeSession({ session_id: 's-4', game_id: 'g-a', game_name: 'Game A', player_sessions: [] }),
    makeSession({ session_id: 's-5', game_id: 'g-b', game_name: 'Game B', player_sessions: [] }),
  ]
  const occurrences = buildSessionBreakdowns(sessions).map((b) => b.game_occurrence)
  expect(occurrences).toEqual([1, 1, 2, 3, 2])
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- utils.server.test`
Expected: FAIL — the new test errors/does not match because `game_occurrence` is `undefined` (received `[undefined, undefined, ...]`).

- [ ] **Step 3: Write minimal implementation**

Replace the existing `buildSessionBreakdowns` (currently lines 172-183 of `src/routes/(authed)/seasons/[seasonId=uuid]/stats/utils.server.ts`) with:

```ts
export function buildSessionBreakdowns(sessions: NormalizedSession[]) {
  const gameCounts = new Map<string, number>()
  return sessions.map((s) => {
    const occurrence = (gameCounts.get(s.game_id) ?? 0) + 1
    gameCounts.set(s.game_id, occurrence)
    return {
      session_id: s.session_id,
      game_occurrence: occurrence,
      date: new Date(s.session_date_played).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      game_name: s.game_name,
      players: [...s.player_sessions].sort((a, b) => a.position - b.position),
    }
  })
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- utils.server.test`
Expected: PASS — all `buildSessionBreakdowns` tests pass (new numbering test plus the existing sort/name/date tests).

- [ ] **Step 5: Commit**

```bash
git add "src/routes/(authed)/seasons/[seasonId=uuid]/stats/utils.server.ts" "tests-unit/routes/(authed)/seasons/[seasonId=uuid]/stats/utils.server.test.ts"
git commit -m "fix: number Scores per Session tabs per-game, not globally"
```

---

### Task 2: Consume `game_occurrence` in the stats page

**Files:**

- Modify: `src/routes/(authed)/seasons/[seasonId=uuid]/stats/+page.svelte:19-24` (mobile `sessionItems`)
- Modify: `src/routes/(authed)/seasons/[seasonId=uuid]/stats/+page.svelte:119-127` (desktop tabs)

**Interfaces:**

- Consumes: `data.sessionBreakdowns[]` items, each now with `game_occurrence: number` (from Task 1).
- Produces: rendered tab/dropdown labels of the form `<game_name> <game_occurrence>`.

> Note: this task changes template rendering only; it is verified by the browser/component
> project (not run in the deploy gate) and by manual check, so it has no separate node unit
> test. It is a distinct reviewable deliverable from the pure-logic change in Task 1.

- [ ] **Step 1: Update the mobile `sessionItems` label**

In `src/routes/(authed)/seasons/[seasonId=uuid]/stats/+page.svelte`, change the `sessionItems` derived (currently lines 19-24) from:

```svelte
  const sessionItems = $derived(
    data.sessionBreakdowns.map((s: { session_id: string; game_name: string }, i: number) => ({
      value: s.session_id,
      label: `${s.game_name} ${i + 1}`,
    })),
  )
```

to:

```svelte
  const sessionItems = $derived(
    data.sessionBreakdowns.map(
      (s: { session_id: string; game_name: string; game_occurrence: number }) => ({
        value: s.session_id,
        label: `${s.game_name} ${s.game_occurrence}`,
      }),
    ),
  )
```

- [ ] **Step 2: Update the desktop tab label**

In the same file, change the desktop tab trigger (currently lines 119-127) from:

```svelte
{#each data.sessionBreakdowns as session, i (session.session_id)}
  <Tabs.Trigger
    value={session.session_id}
    class="data-[state='active']:text-primary-foreground data-[state=active]:bg-primary"
  >
    {session.game_name}
    {i + 1}
  </Tabs.Trigger>
{/each}
```

to:

```svelte
{#each data.sessionBreakdowns as session (session.session_id)}
  <Tabs.Trigger
    value={session.session_id}
    class="data-[state='active']:text-primary-foreground data-[state=active]:bg-primary"
  >
    {session.game_name}
    {session.game_occurrence}
  </Tabs.Trigger>
{/each}
```

- [ ] **Step 3: Type-check and lint**

Run: `npm run check && npm run lint`
Expected: PASS — no type errors (the `i` binding is no longer referenced) and no Prettier/ESLint violations.

- [ ] **Step 4: Manual verification**

Run: `npm run dev`, open a season stats page with an interleaved game history (e.g. Brass, Galactic Cruise, Brass, Brass, Brass, Root). Confirm the tabs read `Brass: Birmingham 1`, `Galactic Cruise 1`, `Brass: Birmingham 2`, `Brass: Birmingham 3`, `Brass: Birmingham 4`, `Root 1` on desktop, and the mobile dropdown shows the same labels.
Expected: per-game numbering as above.

- [ ] **Step 5: Commit**

```bash
git add "src/routes/(authed)/seasons/[seasonId=uuid]/stats/+page.svelte"
git commit -m "fix: render per-game session number in Scores per Session tabs"
```

---

## Self-Review

- **Spec coverage:** Change 1 (util `game_occurrence`) → Task 1. Change 2 (component labels, both desktop + mobile) → Task 2. Testing requirement (interleaved-games unit test) → Task 1 Step 1. All spec sections covered.
- **Placeholder scan:** No TBD/TODO/vague steps; every code step shows full code.
- **Type consistency:** `game_occurrence: number` is produced in Task 1 and consumed with the same name/type in Task 2's inline object types.
