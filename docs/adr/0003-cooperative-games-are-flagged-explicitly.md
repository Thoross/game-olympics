# Cooperative games are flagged explicitly

Games carry an explicit cooperative flag, and cooperative games are excluded from trait win-rate
charts. In a cooperative game players win or lose together, so position — and therefore win rate —
carries no information about which trait value is stronger. Without the flag those games would
produce confident, flat 100% charts.

## Considered Options

The cheap alternative was to detect the situation from the data: drop any session in which every
player shares position 1, requiring no schema change or admin input. It was rejected because it
only fires on exact ties — a cooperative game recorded with slightly different per-player scores
would slip through and produce a meaningless chart anyway. Cooperative is a genuine property of
the game, so the model records it rather than inferring it.
