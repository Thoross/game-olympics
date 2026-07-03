import { fail, redirect } from '@sveltejs/kit'
import type { Actions, ServerLoad } from '@sveltejs/kit'
import { requireAdmin } from '$lib/server/authorization'
import { rankPlayers } from './utils.server.js'

export const load: ServerLoad = async ({ locals }) => {
  requireAdmin(locals.user)
  const [gamesResult, seasonsResult] = await Promise.all([
    locals.supabase.from('games').select('game_id, game_name').order('game_name'),
    locals.supabase
      .from('seasons')
      .select('season_id, season_name')
      .in('season_status', ['UPCOMING', 'IN_PROGRESS'])
      .order('season_name'),
  ])

  const seasons = seasonsResult.data ?? []

  const seasonPlayersResult = await locals.supabase
    .from('season_players')
    .select('season_id, player ( player_id, player_name )')
    .in(
      'season_id',
      seasons.map((s) => s.season_id),
    )

  const playersBySeason: Record<string, { player_id: string; player_name: string }[]> = {}
  for (const row of seasonPlayersResult.data ?? []) {
    const p = Array.isArray(row.player) ? row.player[0] : row.player
    if (!p) continue
    ;(playersBySeason[row.season_id] ??= []).push({
      player_id: p.player_id,
      player_name: p.player_name,
    })
  }

  return {
    games: gamesResult.data ?? [],
    seasons,
    playersBySeason,
  }
}

export const actions: Actions = {
  default: async ({ request, locals }) => {
    requireAdmin(locals.user)
    const formData = await request.formData()

    const season_id = formData.get('season_id') as string
    const game_id = formData.get('game_id') as string
    const date_played = formData.get('date_played') as string | null
    const player_count = parseInt(formData.get('player_count') as string, 10)

    if (!season_id || !game_id) {
      return fail(400, { message: 'Season and game are required.' })
    }
    if (isNaN(player_count) || player_count < 1) {
      return fail(400, { message: 'At least one player is required.' })
    }

    const playerEntries: { player_id: string; score: number }[] = []
    for (let i = 0; i < player_count; i++) {
      const player_id = formData.get(`player_id_${i}`) as string
      const score = parseInt(formData.get(`score_${i}`) as string, 10)
      if (!player_id) {
        return fail(400, { message: `Player ${i + 1} must be selected.` })
      }
      if (isNaN(score)) {
        return fail(400, { message: `Score for player ${i + 1} is invalid.` })
      }
      playerEntries.push({ player_id, score })
    }

    const uniqueIds = new Set(playerEntries.map((e) => e.player_id))
    if (uniqueIds.size !== playerEntries.length) {
      return fail(400, { message: 'Each player can only appear once per session.' })
    }

    const { data: rosterData } = await locals.supabase
      .from('season_players')
      .select('player_id')
      .eq('season_id', season_id)
    const rosterIds = new Set((rosterData ?? []).map((r) => r.player_id))
    for (const entry of playerEntries) {
      if (!rosterIds.has(entry.player_id)) {
        return fail(400, { message: 'Player not in this season.' })
      }
    }

    const { data: sessionData, error: sessionError } = await locals.supabase
      .from('sessions')
      .insert({
        game_id,
        season_id,
        ...(date_played ? { session_date_played: date_played } : {}),
      })
      .select('session_id')
      .single()

    if (sessionError || !sessionData) {
      return fail(500, { message: 'Failed to create session.' })
    }

    const inserts = rankPlayers(playerEntries).map((r) => ({
      session_id: sessionData.session_id,
      player_id: r.player_id,
      player_session_score: r.player_session_score,
      player_session_position: r.player_session_position,
    }))

    const { error: psError } = await locals.supabase.from('player_sessions').insert(inserts)
    if (psError) {
      return fail(500, { message: 'Failed to save player results.' })
    }

    redirect(303, `/seasons/${season_id}/sessions`)
  },
}
