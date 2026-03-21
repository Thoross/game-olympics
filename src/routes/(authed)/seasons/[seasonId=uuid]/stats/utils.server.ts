export type NormalizedPlayerSession = {
  player_id: string
  player_name: string
  score: number
  position: number
  standings_points: number
}

export type NormalizedSession = {
  session_id: string
  created_at: string
  game_id: string
  game_name: string
  player_sessions: NormalizedPlayerSession[]
}

export type Player = { player_id: string; player_name: string }

export function positionToPoints(position: number): number {
  const points: Record<number, number> = { 1: 4, 2: 3, 3: 2, 4: 1 }
  return points[position] ?? 0
}

export function buildGameStats(sessions: NormalizedSession[]) {
  const gameMap = new Map<string, { game_id: string; game_name: string; times_played: number }>()
  for (const s of sessions) {
    if (!s.game_id) continue
    const existing = gameMap.get(s.game_id)
    if (existing) existing.times_played++
    else gameMap.set(s.game_id, { game_id: s.game_id, game_name: s.game_name, times_played: 1 })
  }
  return Array.from(gameMap.values()).sort((a, b) => b.times_played - a.times_played)
}

export function buildPlayers(sessions: NormalizedSession[]): Player[] {
  const playerMap = new Map<string, string>()
  for (const s of sessions) {
    for (const ps of s.player_sessions) {
      if (ps.player_id) playerMap.set(ps.player_id, ps.player_name)
    }
  }
  return Array.from(playerMap.entries()).map(([player_id, player_name]) => ({
    player_id,
    player_name,
  }))
}

export function buildSessionBreakdowns(sessions: NormalizedSession[]) {
  return sessions.map((s) => ({
    session_id: s.session_id,
    date: new Date(s.created_at).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    game_name: s.game_name,
    players: [...s.player_sessions].sort((a, b) => a.position - b.position),
  }))
}

export function buildStandingsOverTime(sessions: NormalizedSession[], players: Player[]) {
  const cumulativePoints = new Map<string, number>(players.map((p) => [p.player_id, 0]))
  return sessions.map((s, i) => {
    for (const ps of s.player_sessions) {
      if (ps.player_id)
        cumulativePoints.set(
          ps.player_id,
          (cumulativePoints.get(ps.player_id) ?? 0) + ps.standings_points,
        )
    }
    const snapshot: Record<string, number | string> = { label: `Game ${i + 1}` }
    for (const [pid, pts] of cumulativePoints) snapshot[pid] = pts
    return snapshot
  })
}

export function buildScoresByGame(sessions: NormalizedSession[]) {
  const gameScoresMap = new Map<
    string,
    {
      game_id: string
      game_name: string
      plays: Array<{ scores: Record<string, number> }>
      playerIds: Set<string>
    }
  >()

  for (const s of sessions) {
    if (!s.game_id) continue
    const scores: Record<string, number> = {}
    for (const ps of s.player_sessions) {
      if (ps.player_id) scores[ps.player_id] = ps.score
    }
    const existing = gameScoresMap.get(s.game_id)
    if (existing) {
      existing.plays.push({ scores })
      for (const pid of Object.keys(scores)) existing.playerIds.add(pid)
    } else {
      gameScoresMap.set(s.game_id, {
        game_id: s.game_id,
        game_name: s.game_name,
        plays: [{ scores }],
        playerIds: new Set(Object.keys(scores)),
      })
    }
  }

  return Array.from(gameScoresMap.values()).map((g) => ({
    game_id: g.game_id,
    game_name: g.game_name,
    playerIds: Array.from(g.playerIds),
    sessions: g.plays.map((play, i) => ({
      label: `Play ${i + 1}`,
      ...play.scores,
    })) as Record<string, number | string>[],
  }))
}
