# Trait win-rate charts use a per-trait x-axis

Trait win-rate charts plot each trait value against **its own outing number** — x=3 is that trait
value's third outing, which may be the game's 5th play for one trait value and its 9th for another.
The lines therefore do not share a timeline: crossings and vertical comparisons at a given x carry
no meaning, and the chart should be read one line at a time as a trajectory.

## Considered Options

Indexing every line by the game's play number was the alternative, and it makes lines directly
comparable because a given x is the same real event for all of them. It was rejected because a
trait value appears in only a fraction of a game's sessions, so every line would be mostly gaps —
at our play volume the chart would be more absence than data. The per-trait axis trades
cross-line comparability for dense, readable lines, and answers the question we actually care
about: does a trait value's win rate move as the group logs more outings with it?

## Consequences

Anything built on this chart inherits the constraint. Do not add a shared vertical marker, a
"same session" tooltip, or any affordance implying the lines are synchronised.
