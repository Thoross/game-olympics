/**
 * Returns the multiplier for the nth play of a game within a season.
 *
 * @param multipliers - The season's multiplier schedule, or null if no schedule exists
 * @param n - The nth time this game has been played in the season (1-indexed)
 * @returns The multiplier value (defaults to 1 when no schedule or empty schedule)
 */
export function getMultiplier(multipliers: number[] | null, n: number): number {
  if (!multipliers || multipliers.length === 0) return 1
  return multipliers[Math.min(n - 1, multipliers.length - 1)]
}

export function positionToPoints(position: number): number {
  const points: Record<number, number> = { 1: 4, 2: 3, 3: 2, 4: 1 }
  return points[position] ?? 0
}
