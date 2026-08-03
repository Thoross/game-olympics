# Game Olympics

A group of players competes across seasons of board games. Each season records the games
played, who played them, and how they finished — producing standings and per-game analysis.

## Language

**Season**:
A bounded competition between a fixed roster of players, made up of sessions.
_Avoid_: League, tournament

**Session**:
One recorded playing of one game, on one date, by a set of players.
_Avoid_: Match, game (when you mean the occasion rather than the title)

**Game**:
A board game title that can be played in a session.
_Avoid_: Title, boardgame

**Play**:
A session counted in sequence within its game — a game's 1st play, 2nd play, and so on.
_Avoid_: Playthrough, occurrence

**Position**:
Where a player finished in a session. Players with equal scores share a position.
_Avoid_: Rank, place, finish

**Win**:
Holding position 1 in a session. Tied players each hold a win.
_Avoid_: Victory, first place

**Standings Points**:
Points a player earns from a session's position, scaled by the season's multiplier schedule.
_Avoid_: Points (unqualified), score

**Multiplier Schedule**:
A season's list of multipliers, where the nth entry scales standings points for a game's nth play.
_Avoid_: Scoring config, weights

**Cooperative Game**:
A game whose players win or lose together, so relative position carries no meaning.
_Avoid_: Co-op, team game

## Traits

**Trait**:
A per-game characteristic recorded about a player in a session, such as Class or Faction.
_Avoid_: Metadata field, attribute, property

**Trait Value**:
One recorded setting of a trait, such as Brute or Soviets.
_Avoid_: Metadata value, option, choice

**Outing**:
One player's play of a given trait value in a session. Two players on the same trait value in
one session are two outings. A trait value's evidence is its outings.
_Avoid_: Appearance, instance

**Trait Win Rate**:
Across a game's sessions, the share of a trait value's outings that were wins.
_Avoid_: Class win rate, win percentage
