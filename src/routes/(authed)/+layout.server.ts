import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = async ({ locals: { session, user, supabase }, cookies }) => {
  let inProgressSeasons: { season_id: string; season_name: string }[] = []

  if (user?.player_id) {
    const { data: memberships } = await supabase
      .from('season_players')
      .select('season_id')
      .eq('player_id', user.player_id)

    const seasonIds = (memberships ?? []).map((m) => m.season_id)
    if (seasonIds.length > 0) {
      const { data } = await supabase
        .from('seasons')
        .select('season_id, season_name')
        .in('season_id', seasonIds)
        .eq('season_status', 'IN_PROGRESS')
        .order('season_name', { ascending: true })
      inProgressSeasons = data ?? []
    }
  }

  return {
    session,
    user,
    cookies: cookies.getAll(),
    inProgressSeasons,
  }
}
