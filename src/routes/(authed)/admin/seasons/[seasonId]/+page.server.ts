import { fail, error } from '@sveltejs/kit'
import type { Actions, ServerLoad } from '@sveltejs/kit'
import { requireAdmin } from '$lib/server/authorization'
import { removeSeasonImageByUrl, uploadSeasonImage } from '$lib/server/seasonImages'

export const load: ServerLoad = async ({ params, locals }) => {
  requireAdmin(locals.user)
  const seasonId = params.seasonId!

  const [
    seasonResult,
    seasonPlayersResult,
    allPlayersResult,
    scheduleResult,
    sessionGamesResult,
    choosersResult,
  ] = await Promise.all([
    locals.supabase
      .from('seasons')
      .select(
        'season_id, season_name, season_description, season_status, season_logo_url, season_banner_url',
      )
      .eq('season_id', seasonId)
      .single(),
    locals.supabase
      .from('season_players')
      .select('season_players_id, date_paid, player ( player_id, player_name )')
      .eq('season_id', seasonId),
    locals.supabase.from('player').select('player_id, player_name').order('player_name'),
    locals.supabase
      .from('season_scoring_schedules')
      .select('multipliers')
      .eq('season_id', seasonId)
      .maybeSingle(),
    locals.supabase
      .from('sessions')
      .select('games ( game_id, game_name )')
      .eq('season_id', seasonId),
    locals.supabase.from('season_games').select('game_id, chosen_by').eq('season_id', seasonId),
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

  // Distinct games played in this season (a game appears once per session).
  const chooserByGame = new Map<string, string | null>(
    (choosersResult.data ?? []).map((r) => [r.game_id, r.chosen_by]),
  )
  const gamesById = new Map<string, string>()
  for (const row of sessionGamesResult.data ?? []) {
    const g = Array.isArray(row.games) ? row.games[0] : row.games
    if (g) gamesById.set(g.game_id, g.game_name)
  }
  const seasonGames = Array.from(gamesById, ([game_id, game_name]) => ({
    game_id,
    game_name,
    chosen_by: chooserByGame.get(game_id) ?? null,
  })).sort((a, b) => a.game_name.localeCompare(b.game_name))

  return {
    seasonGames,
    season: seasonResult.data,
    seasonPlayers: (seasonPlayersResult.data ?? []).map((sp) => ({
      season_players_id: sp.season_players_id,
      date_paid: sp.date_paid,
      player: Array.isArray(sp.player) ? sp.player[0] : sp.player,
    })),
    availablePlayers: (allPlayersResult.data ?? []).filter(
      (p) => !seasonPlayerIds.has(p.player_id),
    ),
    schedule: scheduleResult.data ?? null,
  }
}

export const actions: Actions = {
  updateDetails: async ({ params, request, locals }) => {
    requireAdmin(locals.user)
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

    const logo = formData.get('logo') as File | null
    const banner = formData.get('banner') as File | null
    const removeLogo = formData.get('remove_logo') === 'on'
    const removeBanner = formData.get('remove_banner') === 'on'

    // Load current URLs so replaced/removed objects can be best-effort deleted.
    const { data: current } = await locals.supabase
      .from('seasons')
      .select('season_logo_url, season_banner_url')
      .eq('season_id', seasonId)
      .single()

    const update: {
      season_name: string
      season_description: string | null
      season_status: typeof season_status
      season_logo_url?: string | null
      season_banner_url?: string | null
    } = { season_name, season_description, season_status }

    const cleanup: (string | null | undefined)[] = []

    if (logo && logo.size > 0) {
      const result = await uploadSeasonImage(locals.supabase, seasonId, 'logo', logo)
      if ('error' in result) return fail(400, { updateError: result.error })
      update.season_logo_url = result.url
      cleanup.push(current?.season_logo_url)
    } else if (removeLogo) {
      update.season_logo_url = null
      cleanup.push(current?.season_logo_url)
    }

    if (banner && banner.size > 0) {
      const result = await uploadSeasonImage(locals.supabase, seasonId, 'banner', banner)
      if ('error' in result) return fail(400, { updateError: result.error })
      update.season_banner_url = result.url
      cleanup.push(current?.season_banner_url)
    } else if (removeBanner) {
      update.season_banner_url = null
      cleanup.push(current?.season_banner_url)
    }

    const { error: updateError } = await locals.supabase
      .from('seasons')
      .update(update)
      .eq('season_id', seasonId)

    if (updateError) {
      return fail(500, { updateError: 'Failed to update season.' })
    }

    for (const url of cleanup) {
      await removeSeasonImageByUrl(locals.supabase, url)
    }

    return { updateSuccess: true }
  },

  addPlayer: async ({ params, request, locals }) => {
    requireAdmin(locals.user)
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

  setDuesPaid: async ({ request, locals }) => {
    requireAdmin(locals.user)
    const formData = await request.formData()
    const season_players_id = formData.get('season_players_id') as string
    const raw = (formData.get('date_paid') as string)?.trim()
    const date_paid = raw ? raw : null // '' → unpaid

    if (!season_players_id) {
      return fail(400, { duesError: 'Missing ID.' })
    }

    const { error: updateError } = await locals.supabase
      .from('season_players')
      .update({ date_paid })
      .eq('season_players_id', season_players_id)

    if (updateError) {
      return fail(500, { duesError: 'Failed to update dues.' })
    }

    return { duesSuccess: true }
  },

  setGameChooser: async ({ params, request, locals }) => {
    requireAdmin(locals.user)
    const seasonId = params.seasonId!
    const formData = await request.formData()
    const game_id = formData.get('game_id') as string
    const raw = (formData.get('chosen_by') as string)?.trim()
    const chosen_by = raw ? raw : null // '' → no chooser

    if (!game_id) {
      return fail(400, { gameChooserError: 'Missing game.' })
    }

    const { error: upsertError } = await locals.supabase
      .from('season_games')
      .upsert({ season_id: seasonId, game_id, chosen_by }, { onConflict: 'season_id,game_id' })

    if (upsertError) {
      return fail(500, { gameChooserError: 'Failed to update chooser.' })
    }

    return { gameChooserSuccess: true }
  },

  removePlayer: async ({ request, locals }) => {
    requireAdmin(locals.user)
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
