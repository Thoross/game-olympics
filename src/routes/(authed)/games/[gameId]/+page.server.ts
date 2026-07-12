import { error, fail } from '@sveltejs/kit'
import { isAdmin, requireAdmin } from '$lib/server/authorization'
import { extractBggId, fetchBggGame } from '$lib/server/bgg.server'
import { buildPlayerGameSeasonStats, type GameSessionRow } from './utils.server'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ params, locals }) => {
  const gameId = params.gameId!

  const { data: game, error: dbError } = await locals.supabase
    .from('games')
    .select(
      'game_id, game_name, game_bgg_url, game_bgg_id, game_image_url, game_description, game_year_published, game_bgg_rating',
    )
    .eq('game_id', gameId)
    .single()

  if (dbError || !game) {
    error(404, 'Game not found')
  }

  const playerId = locals.user?.player_id

  let seasonStats: ReturnType<typeof buildPlayerGameSeasonStats> = []

  if (playerId) {
    // Load every session of this game (across all players) so the per-season
    // multiplier play-count matches the standings pipeline.
    const { data: sessionRows } = await locals.supabase
      .from('sessions')
      .select(
        `
        season_id,
        session_date_played,
        seasons ( season_name ),
        player_sessions ( player_id, player_session_score, player_session_position )
        `,
      )
      .eq('game_id', gameId)
      .order('session_date_played', { ascending: true })
      .order('session_id', { ascending: true })

    const rows = sessionRows ?? []

    const seasonIds = [...new Set(rows.map((r) => r.season_id))]
    const multipliersBySeasonId = new Map<string, number[] | null>()
    if (seasonIds.length > 0) {
      const { data: schedules } = await locals.supabase
        .from('season_scoring_schedules')
        .select('season_id, multipliers')
        .in('season_id', seasonIds)
      for (const s of schedules ?? []) multipliersBySeasonId.set(s.season_id, s.multipliers)
    }

    const normalized: GameSessionRow[] = rows.map((r) => {
      const season = Array.isArray(r.seasons) ? r.seasons[0] : r.seasons
      return {
        season_id: r.season_id,
        season_name: season?.season_name ?? '',
        session_date_played: r.session_date_played,
        player_sessions: (r.player_sessions ?? []).map((ps) => ({
          player_id: ps.player_id,
          score: ps.player_session_score ?? 0,
          position: ps.player_session_position ?? 0,
        })),
      }
    })

    seasonStats = buildPlayerGameSeasonStats(normalized, multipliersBySeasonId, playerId)
  }

  return { game, seasonStats, isAdmin: isAdmin(locals.user) }
}

export const actions: Actions = {
  refreshBgg: async ({ params, locals }) => {
    requireAdmin(locals.user)
    const gameId = params.gameId!

    const { data: game } = await locals.supabase
      .from('games')
      .select('game_bgg_id, game_bgg_url')
      .eq('game_id', gameId)
      .single()

    const bggId = game?.game_bgg_id ?? extractBggId(game?.game_bgg_url)
    if (!bggId) {
      console.warn('refreshBgg: no BGG id for game', gameId)
      return fail(400, { message: 'This game has no BoardGameGeek URL to refresh from.' })
    }

    console.info('refreshBgg: fetching BGG data', { gameId, bggId })

    const bgg = await fetchBggGame(bggId)
    if (!bgg) {
      console.error('refreshBgg: BGG fetch failed', { gameId, bggId })
      return fail(502, { message: 'Could not fetch data from BoardGameGeek. Please try again.' })
    }

    const { error: updateError } = await locals.supabase
      .from('games')
      .update({
        game_bgg_id: bgg.bggId,
        game_image_url: bgg.imageUrl,
        game_description: bgg.description,
        game_year_published: bgg.yearPublished,
        game_bgg_rating: bgg.rating,
        game_bgg_synced_at: new Date().toISOString(),
      })
      .eq('game_id', gameId)

    if (updateError) {
      console.error('refreshBgg: update failed', updateError)
      return fail(500, { message: updateError.message })
    }

    console.info('refreshBgg: synced game', { gameId, bggId })
    return { success: true }
  },
}
