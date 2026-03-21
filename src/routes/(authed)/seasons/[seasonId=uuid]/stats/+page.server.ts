import type { ServerLoad } from '@sveltejs/kit'
import {
  positionToPoints,
  buildGameStats,
  buildPlayers,
  buildSessionBreakdowns,
  buildStandingsOverTime,
  buildScoresByGame,
} from './utils.server.js'

export const load: ServerLoad = async ({ params, locals }) => {
  const { data, error } = await locals.supabase
    .from('sessions')
    .select(
      `
      session_id,
      created_at,
      games ( game_id, game_name ),
      player_sessions (
        player_session_score,
        player_session_position,
        player ( player_id, player_name )
      )
    `,
    )
    .eq('season_id', params.seasonId!)
    .order('created_at', { ascending: true })

  if (error) throw new Error(error.message)

  const sessions = (data ?? []).map((s) => {
    const game = Array.isArray(s.games) ? s.games[0] : s.games
    return {
      session_id: s.session_id,
      created_at: s.created_at,
      game_id: game?.game_id ?? '',
      game_name: game?.game_name ?? '',
      player_sessions: (s.player_sessions ?? []).map((ps) => {
        const p = Array.isArray(ps.player) ? ps.player[0] : ps.player
        return {
          player_id: p?.player_id ?? '',
          player_name: p?.player_name ?? '',
          score: ps.player_session_score ?? 0,
          position: ps.player_session_position ?? 0,
          standings_points: positionToPoints(ps.player_session_position ?? 0),
        }
      }),
    }
  })

  const gameStats = buildGameStats(sessions)
  const players = buildPlayers(sessions)
  const sessionBreakdowns = buildSessionBreakdowns(sessions)
  const standingsOverTime = buildStandingsOverTime(sessions, players)
  const scoresByGame = buildScoresByGame(sessions)

  return { gameStats, sessionBreakdowns, standingsOverTime, scoresByGame, players }
}
