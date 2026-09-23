# Which scoring shapes actually occur in the game library

Research for [#11](https://github.com/Thoross/game-olympics/issues/11), part of the
per-game scoring methods map ([#10](https://github.com/Thoross/game-olympics/issues/10)).

There is no existing convention for research notes in this repo (`docs/` holds only `adr/`,
`agents/`, and `superpowers/`), so this file establishes `docs/research/`.

---

## Survey results (run by an admin, 2026-09-23)

The per-game query below was run against the live database:

| Game (BGG id)              | Sessions | Player rows | Distinct scores | Min | Max | 0/1 rows |
| -------------------------- | -------- | ----------- | --------------- | --- | --- | -------- |
| Galactic Cruise (391137)   | 4        | 16          | 16              | 96  | 203 | 0        |
| Brass: Birmingham (224517) | 0        | 0           | 0               | —   | —   | 0        |
| Root (237182)              | 0        | 0           | 0               | —   | —   | 0        |

What this answers:

- **The library holds three games, and only one has ever been played.** Every recorded session is
  Galactic Cruise: shape 1 (cumulative VP), with 16 distinct scores across 16 rows, all between
  96 and 203.
- **No fabricated scores exist.** There are no 0/1 rows. The per-session check below was also run,
  and all four sessions (2026-06-24, 07-01, 07-08, 07-22) have 4 players with 4 distinct scores and
  4 distinct positions, so there are no ties and no all-equal sessions. The worry in "What the
  schema forces" is about what the schema _allows_, not about harm already done. The `NOT NULL` relaxation in #17 has **nothing to backfill**.
- **Brass: Birmingham is also cumulative VP** (shape 1). **Root is single winner** (shape 2) as this
  group plays it, but it has never been recorded, so no Root data needs cleaning up.
- **There are no team/side, elimination, ranked-without-points or semi-co-op games in the library.**
  Shapes 4–7 are hypothetical for this group today, so an enum of the two founding members is
  enough for the current library.
- Data quirk: the stored name is `"Brass:  Birmingham"`, with two spaces after the colon.

The rest of this document was written before database access was available and is kept as the
reasoning record.

## Original headline: the survey could not be performed at first

**I could not read a single row of `games`, `sessions`, or `player_sessions`.** Everything below
about the _library_ is therefore a statement about what the schema and code permit, not about what
the group has actually recorded.

### What I tried, and exactly why it failed

| Route                                     | Result                                                                                                                                                                                           |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Supabase MCP server                       | Not attached to this session. The only DB MCP present is Neon, which is a different product and a different project.                                                                             |
| `supabase` CLI                            | Not installed (`which supabase` → not found). `psql` likewise not installed.                                                                                                                     |
| Direct Postgres connection                | No connection string and no service-role key exists anywhere in the working tree. `.env` contains exactly three keys: `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `BGG_API_TOKEN`. |
| PostgREST with the publishable (anon) key | Reachable, but returns `[]` for every table.                                                                                                                                                     |

The anon-key result is a _policy_ refusal, not an empty database. Every read policy in
`supabase/migrations/20260701000000_baseline.sql` is granted `TO "authenticated"`:

```sql
CREATE POLICY "games_select" ON "public"."games" FOR SELECT TO "authenticated" USING (true);
CREATE POLICY "player_sessions_select" ON "public"."player_sessions" FOR SELECT TO "authenticated" USING (true);
```

`anon` has table `GRANT`s but no matching policy, so RLS filters every row away and PostgREST
returns `200 []`. The tables themselves plainly exist — asking for a table that does not
(`/rest/v1/not_a_table`) returns `PGRST205 "Could not find the table ... in the schema cache"`,
while `games`, `sessions`, `player_sessions`, `seasons`, and `player` all return `200 []`.

Getting past this needs one of: the service-role key, a DB connection string, a Supabase MCP
server, or a signed-in session for a real player account. None was available and none should be
manufactured. **Someone with admin access should re-run the per-game survey before #12 fixes the
enum's contents.**

### The query to run when access exists

```sql
select g.game_name,
       g.game_bgg_id,
       count(distinct s.session_id)                              as sessions,
       count(ps.player_session_id)                               as player_rows,
       count(distinct ps.player_session_score)                   as distinct_scores,
       min(ps.player_session_score)                              as min_score,
       max(ps.player_session_score)                              as max_score,
       count(*) filter (where ps.player_session_score in (0, 1)) as zero_or_one_rows
from games g
left join sessions s        on s.game_id = g.game_id
left join player_sessions ps on ps.session_id = s.session_id
group by g.game_id, g.game_name, g.game_bgg_id
order by sessions desc, g.game_name;
```

Plus a per-session shape check, which is where the interesting cases hide:

```sql
select g.game_name, s.session_id, s.session_date_played,
       count(*)                                  as players,
       count(distinct ps.player_session_score)   as distinct_scores,
       count(distinct ps.player_session_position) as distinct_positions,
       array_agg(ps.player_session_score order by ps.player_session_position) as scores
from sessions s
join games g on g.game_id = s.game_id
join player_sessions ps on ps.session_id = s.session_id
group by g.game_id, g.game_name, s.session_id, s.session_date_played
order by g.game_name, s.session_date_played;
```

The two signatures worth counting: `distinct_scores = 1` (all-equal — a cooperative or
scoreless game recorded as a tie) and `max_score = 1 and min_score = 0` (a winner flag entered
into a numeric column).

---

## What the schema forces, which is the real finding

`player_sessions` (baseline migration, lines 169–178) declares:

```sql
"player_session_position" integer NOT NULL,
"player_session_score" bigint NOT NULL,
```

**Both are `NOT NULL`.** `src/lib/database.types.ts:151` agrees — `player_session_score: number`,
not `number | null`. This contradicts the claim in `CLAUDE.md` ("`player_sessions` stores nullable
`player_session_score` and `player_session_position`") and the same claim in the map's notes
on #10. It matters a lot: **a scoreless game cannot be recorded today without inventing a number.**

The write path enforces the same thing independently. `src/routes/(authed)/admin/sessions/add/+page.server.ts:89-95`
does `parseInt` on each score field and fails the whole action on `NaN`, so a blank score box is
rejected before it reaches Postgres. `rankPlayers()`
(`src/routes/(authed)/admin/sessions/add/utils.server.ts:8`) then derives position purely by sorting
that number descending.

The consequence is a data-integrity conclusion I _can_ state confidently without seeing a row: **any
scoreless-by-nature game already in the library must have been recorded with a fabricated score** —
almost certainly `1`/`0` for winner/loser, or all-equal values for a cooperative play. Those
fabricated numbers are not inert. They flow into:

- `avg_score`, the standings tiebreaker (`seasons/[seasonId=uuid]/standings/utils.server.ts:62`,
  sorted `standings_points desc → avg_score desc`)
- the score-per-game line chart and per-session score tables (`stats/+page.server.ts:63,87`)
- the game detail page's score display (`games/[gameId]/+page.server.ts:98`)

So a Root session recorded as 1/0/0/0 currently drags four players' `avg_score` toward zero and
plots a meaningless flat line — and it does so _silently_. This is worth stating as motivation in
the spec: the feature is not only about points derivation, it is about stopping fake scores from
polluting the score-based stats. Note the defensive `?? 0` at those three call sites, which implies
someone already expected nulls the schema does not currently allow.

`positionToPoints()` (`src/lib/server/utils.server.ts:13`) reads only position, and `getMultiplier()`
scales the result. Any method that produces standings points _without_ producing a position has no
seam to attach to today.

---

## Scoring shapes: what the model has to be able to express

I can enumerate the _shapes_ from first principles and from BGG's own mechanic vocabulary (below).
I cannot tell you which of them this group's library actually contains. Treating them as a checklist
for the admin survey:

1. **Cumulative victory points.** Every player carries a distinct, meaningful number; position falls
   out of sorting it. This is what the app assumes universally today. Galactic Cruise.
2. **Single winner, no runner-up.** One player wins; the rest are undifferentiated. There is no
   runner-up to award 3 points to, so `positionToPoints`'s 4/3/2/1 ladder is meaningless past
   position 1. Root, as this group plays it.
3. **Cooperative win/lose.** All players share one outcome. Already modelled as a separate boolean
   per ADR-0003, deliberately _not_ folded into the method (map, "already settled"). Worth noting
   ADR-0003's reasoning cuts both ways: it rejected inferring co-op from "everyone shares position 1"
   because the inference is unreliable — the same argument says the scoring method must be
   admin-entered rather than derived from score patterns.
4. **Team / side games.** Two or more players share one outcome, but not all of them. Neither
   bucket. This breaks an assumption deeper than scoring: `rankPlayers` has no concept of a group,
   and `player_sessions` has no team column. If the library contains one of these, it is a schema
   question, not an enum question.
5. **Elimination order.** Position is real and fully ordered, but there is no score at all — last
   player standing, then reverse order of death. Ranked-without-points. This one is _nearly_ free:
   position is the thing `positionToPoints` already wants, so the method only needs to let an admin
   enter positions directly instead of deriving them from scores.
6. **Ranked without points, non-elimination.** Same as above but by agreement or a race finish
   order. Mechanically identical to 5 from the app's side.
7. **Semi-cooperative / traitor.** A shared outcome plus one dissenting player. Exists in BGG's
   vocabulary; likely out of scope, but it is the shape most likely to be discovered later and to
   not fit whatever enum ships.

Shapes 4–7 are the answer to the ticket's "any shape fitting neither bucket" question, and **none of
them are represented by the two examples the enum was about to be drawn from.** Shapes 5 and 6
collapse into one enum member ("positions entered directly, no score"), which is a cheap third
member that covers a real gap. Shape 4 is the one I would flag to the map as unanticipated: it is
not a scoring method at all, it is a missing entity, and the enum cannot absorb it.

---

## BGG: is there a scoring-type signal?

**No. There is no scoring-type, win-condition, or "has victory points" field anywhere in the XML
API v2 `thing` response.** This is a direct observation, not a recollection — I fetched live
responses using the repo's own `BGG_API_TOKEN` (the API now rejects unauthenticated requests with
`Unauthorized. See https://boardgamegeek.com/using_the_xml_api`, which is itself worth knowing:
`fetchBggGame` in `src/lib/server/bgg.server.ts` degrades to `null` silently if that token ever
lapses).

The complete element inventory of a `thing?id=…&stats=1` response (Root, id 237182):
`thumbnail`, `image`, `name`, `description`, `yearpublished`, `minplayers`, `maxplayers`,
`playingtime`, `minplaytime`, `maxplaytime`, `minage`, `poll`, `poll-summary`, `link`, and
`statistics` (`usersrated`, `average`, `bayesaverage`, `ranks`, `stddev`, `median`, `owned`,
`trading`, `wanting`, `wishing`, `numcomments`, `numweights`, `averageweight`). The three polls are
`suggested_numplayers`, `suggested_playerage`, and `language_dependence`. Nothing about scoring.

`parseBggThing` currently extracts `image`, `yearpublished`, `description`, and `average` only — it
does not parse `<link>` elements at all, so **nothing on `games` today carries any scoring signal**
(`game_bgg_id`, `game_bgg_url`, `game_image_url`, `game_description`, `game_year_published`,
`game_bgg_rating`, `game_bgg_synced_at` — migration `20260704000000`).

The closest thing BGG has is `<link type="boardgamemechanic">`. Live samples:

| Game (BGG id)            | Mechanics relevant to scoring shape                                               |
| ------------------------ | --------------------------------------------------------------------------------- |
| Pandemic (30549)         | `Cooperative Game`, `Solo / Solitaire Game`                                       |
| Codenames (178900)       | `Team-Based Game`                                                                 |
| Risk (181)               | `Player Elimination`                                                              |
| Galactic Cruise (391137) | `Victory Points as a Resource`                                                    |
| Root (237182)            | _(none)_ — Action Points, Area Majority / Influence, Race, Sudden Death Ending, … |

So the vocabulary does contain `Cooperative Game`, `Team-Based Game`, and `Player Elimination`,
which look tempting. **They are not sufficient, and the two games this feature was designed around
prove it:**

- **Root has no mechanic that reveals its scoring shape.** Nothing in its mechanic list distinguishes
  it from a points game. (Root does in fact have victory points in the published rules — 30 VP to
  win — and this group simply records it as a single winner. That is a _house-rule_ fact about how
  they play, which no external database can ever know.)
- **`Victory Points as a Resource` is the wrong predicate.** It means VP can be _spent_, not that the
  game has VP. Plenty of pure point-salad games lack it, so its presence on Galactic Cruise and
  absence on Root is coincidence, not signal.
- `Player Elimination` describes a mechanic that may occur, not that final standings are an
  elimination order.
- `Cooperative Game` genuinely correlates, but ADR-0003 already decided co-op is explicitly flagged
  rather than inferred, and BGG mechanics on games with co-op _modes_ would produce false positives.

**Conclusion: the scoring method must be admin-entered.** A dropdown, as the map already settled.
BGG mechanics could at most seed a _suggested_ default in the add-game form, and I would not build
even that — the mapping is wrong often enough (Root) that a wrong pre-filled default is worse than
an empty required field, because a pre-filled default gets accepted without thought.

---

## For the map

- Correct the "nullable `player_session_score`" note on #10 — both score columns are `NOT NULL`, in
  the migration and in the generated types. The migration in #17 has to relax them (or introduce a
  separate representation). The survey shows every existing row is a real VP score, so no backfill
  is needed.
- #12 (enum contents) can now proceed: the library contains only cumulative-VP games (Galactic
  Cruise, Brass: Birmingham) and one single-winner game (Root).
- A third enum member for **positions entered directly, with no score** would cover elimination
  order and ranked-without-points. No game in the library needs it today, so it is optional.
- **Team/side games: the library has none.** Scope them out explicitly. They cannot be an enum
  member anyway, because what's missing is a grouping on `player_sessions`, not a points formula.
- #15: no fabricated scores exist yet, but the schema would force one the first time Root is
  recorded, and it would flow into `avg_score`, the standings tiebreaker. The feature should ship
  before the first Root session is recorded.

## Sources

- `supabase/migrations/20260701000000_baseline.sql` — table definitions, RLS policies
- `supabase/migrations/20260704000000_add_game_bgg_metadata.sql` — BGG columns on `games`
- `src/lib/database.types.ts:151` — generated types confirming non-null score
- `src/lib/server/bgg.server.ts` — what the sync actually parses
- `src/lib/server/utils.server.ts` — `positionToPoints`, `getMultiplier`
- `src/routes/(authed)/admin/sessions/add/+page.server.ts`, `.../utils.server.ts` — write path, `rankPlayers`
- `src/routes/(authed)/seasons/[seasonId=uuid]/standings/utils.server.ts`, `.../stats/+page.server.ts`,
  `src/routes/(authed)/games/[gameId]/+page.server.ts` — score consumers
- `docs/adr/0003-cooperative-games-are-flagged-explicitly.md`
- Live BGG XML API v2 `thing` responses for ids 237182, 391137, 30549, 178900, 181
  (`https://boardgamegeek.com/xmlapi2/thing?id=…&stats=1`), fetched 2026-08-31
