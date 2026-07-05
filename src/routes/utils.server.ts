export const resolveHomeRedirect = (inProgressSeasonIds: string[]): string => {
  if (inProgressSeasonIds.length === 1) return `/seasons/${inProgressSeasonIds[0]}`
  if (inProgressSeasonIds.length > 1) return '/seasons?season-status=IN_PROGRESS'
  return '/seasons'
}
