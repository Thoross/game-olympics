import type { ServerLoad } from '@sveltejs/kit'
import { getMultiplier, positionToPoints } from '$lib/server/utils.server.js'
import {
  buildGameStats,
  buildPlayers,
  buildSessionBreakdowns,
  buildStandingsOverTime,
  buildScoresByGame,
} from './utils.server.js'

export const load: ServerLoad = async ({ params, locals, parent }) => {
  const { multipliers } = await parent()

  const { data, error } = await locals.supabase
    .from('sessions')
    .select(
      `
      session_id,
      session_date_played,
      games ( game_id, game_name ),
      player_sessions (
        player_session_score,
        player_session_position,
        player ( player_id, player_name )
      )
    `,
    )
    .eq('season_id', params.seasonId!)
    .order('session_date_played', { ascending: true })
    .order('session_id', { ascending: true })

  if (error) throw new Error(error.message)

  const rawSessions = data ?? []

  // Per-game play counter for multiplier assignment (D-05)
  const playCountByGame = new Map<string, number>()

  const sessions = rawSessions.map((s) => {
    const game = Array.isArray(s.games) ? s.games[0] : s.games
    const gameId = game?.game_id ?? ''

    // Increment play count for this game
    const playCount = (playCountByGame.get(gameId) ?? 0) + 1
    playCountByGame.set(gameId, playCount)

    const multiplier = getMultiplier(multipliers, playCount)

    return {
      session_id: s.session_id,
      session_date_played: s.session_date_played,
      game_id: gameId,
      game_name: game?.game_name ?? '',
      player_sessions: (s.player_sessions ?? []).map((ps) => {
        const p = Array.isArray(ps.player) ? ps.player[0] : ps.player
        return {
          player_id: p?.player_id ?? '',
          player_name: p?.player_name ?? '',
          score: ps.player_session_score ?? 0,
          position: ps.player_session_position ?? 0,
          standings_points: positionToPoints(ps.player_session_position ?? 0) * multiplier,
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
