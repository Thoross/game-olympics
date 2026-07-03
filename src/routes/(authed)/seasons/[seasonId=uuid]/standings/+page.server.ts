import type { ServerLoad } from '@sveltejs/kit'
import { buildStandings, countGamesChosen } from './utils.server.js'

export const load: ServerLoad = async ({ params, locals, parent }) => {
  const { multipliers } = await parent()

  const [sessionsResult, duesResult, seasonGamesResult] = await Promise.all([
    locals.supabase
      .from('sessions')
      .select(
        `
        session_id,
        session_date_played,
        games ( game_id ),
        player_sessions (
          player_session_score,
          player_session_position,
          player ( player_id, player_name )
        )
      `,
      )
      .eq('season_id', params.seasonId!)
      .order('session_date_played', { ascending: true })
      .order('session_id', { ascending: true }),
    locals.supabase
      .from('season_players')
      .select('player_id, date_paid')
      .eq('season_id', params.seasonId!),
    locals.supabase.from('season_games').select('chosen_by').eq('season_id', params.seasonId!),
  ])

  if (sessionsResult.error) {
    throw new Error(sessionsResult.error.message)
  }

  const sessions = (sessionsResult.data ?? []).map((s) => {
    const game = Array.isArray(s.games) ? s.games[0] : s.games
    return {
      session_id: s.session_id,
      game_id: game?.game_id ?? '',
      session_date_played: s.session_date_played,
      player_sessions: s.player_sessions,
    }
  })

  const duesByPlayer = new Map<string, string | null>(
    (duesResult.data ?? []).map((r) => [r.player_id, r.date_paid]),
  )
  const gamesChosen = countGamesChosen(seasonGamesResult.data ?? [])

  const standings = buildStandings(sessions, multipliers).map((s) => ({
    ...s,
    date_paid: duesByPlayer.get(s.player_id) ?? null,
    games_chosen: gamesChosen.get(s.player_id) ?? 0,
  }))

  return { standings }
}
