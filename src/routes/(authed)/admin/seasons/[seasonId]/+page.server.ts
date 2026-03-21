import { fail, error } from '@sveltejs/kit'
import type { Actions, ServerLoad } from '@sveltejs/kit'

export const load: ServerLoad = async ({ params, locals }) => {
  const seasonId = params.seasonId!

  const [seasonResult, seasonPlayersResult, allPlayersResult] = await Promise.all([
    locals.supabase
      .from('seasons')
      .select('season_id, season_name, season_description, season_status')
      .eq('season_id', seasonId)
      .single(),
    locals.supabase
      .from('season_players')
      .select('season_players_id, player ( player_id, player_name )')
      .eq('season_id', seasonId),
    locals.supabase.from('player').select('player_id, player_name').order('player_name'),
  ])

  if (seasonResult.error || !seasonResult.data) {
    error(404, 'Season not found')
  }

  const seasonPlayerIds = new Set(
    (seasonPlayersResult.data ?? []).map((sp) => {
      const p = Array.isArray(sp.player) ? sp.player[0] : sp.player
      return p?.player_id
    }),
  )

  return {
    season: seasonResult.data,
    seasonPlayers: (seasonPlayersResult.data ?? []).map((sp) => ({
      season_players_id: sp.season_players_id,
      player: Array.isArray(sp.player) ? sp.player[0] : sp.player,
    })),
    availablePlayers: (allPlayersResult.data ?? []).filter(
      (p) => !seasonPlayerIds.has(p.player_id),
    ),
  }
}

export const actions: Actions = {
  updateDetails: async ({ params, request, locals }) => {
    const seasonId = params.seasonId!
    const formData = await request.formData()

    const season_name = (formData.get('season_name') as string)?.trim()
    const season_description = (formData.get('season_description') as string)?.trim() || null
    const season_status = formData.get('season_status') as
      | 'UPCOMING'
      | 'IN_PROGRESS'
      | 'SUSPENDED'
      | 'COMPLETED'

    if (!season_name) {
      return fail(400, { updateError: 'Season name is required.' })
    }

    const { error: updateError } = await locals.supabase
      .from('seasons')
      .update({ season_name, season_description, season_status })
      .eq('season_id', seasonId)

    if (updateError) {
      return fail(500, { updateError: 'Failed to update season.' })
    }

    return { updateSuccess: true }
  },

  addPlayer: async ({ params, request, locals }) => {
    const seasonId = params.seasonId!
    const formData = await request.formData()
    const player_id = formData.get('player_id') as string

    if (!player_id) {
      return fail(400, { addPlayerError: 'No player selected.' })
    }

    const { error: insertError } = await locals.supabase
      .from('season_players')
      .insert({ season_id: seasonId, player_id })

    if (insertError) {
      return fail(500, { addPlayerError: 'Failed to add player.' })
    }

    return { addPlayerSuccess: true }
  },

  removePlayer: async ({ request, locals }) => {
    const formData = await request.formData()
    const season_players_id = formData.get('season_players_id') as string

    if (!season_players_id) {
      return fail(400, { removePlayerError: 'Missing ID.' })
    }

    const { error: deleteError } = await locals.supabase
      .from('season_players')
      .delete()
      .eq('season_players_id', season_players_id)

    if (deleteError) {
      return fail(500, { removePlayerError: 'Failed to remove player.' })
    }

    return { removePlayerSuccess: true }
  },
}
