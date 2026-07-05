import { redirect } from '@sveltejs/kit'
import type { ServerLoad } from '@sveltejs/kit'
import { resolveHomeRedirect } from './utils.server'

export const load: ServerLoad = async ({ locals }) => {
  const playerId = locals.user?.player_id
  if (!playerId) redirect(303, '/seasons')

  const { data: memberships } = await locals.supabase
    .from('season_players')
    .select('season_id')
    .eq('player_id', playerId)

  const seasonIds = (memberships ?? []).map((m) => m.season_id)
  if (seasonIds.length === 0) redirect(303, '/seasons')

  const { data: inProgress } = await locals.supabase
    .from('seasons')
    .select('season_id')
    .in('season_id', seasonIds)
    .eq('season_status', 'IN_PROGRESS')

  redirect(303, resolveHomeRedirect((inProgress ?? []).map((s) => s.season_id)))
}
