export type NormalizedPlayerSession = {
  player_id: string
  player_name: string
  score: number
  position: number
  standings_points: number
}

export type NormalizedSession = {
  session_id: string
  session_date_played: string
  game_id: string
  game_name: string
  player_sessions: NormalizedPlayerSession[]
}

export type Player = { player_id: string; player_name: string }

export type SeasonAverageRow = {
  player_id: string
  player_name: string
  avg_score: number
  avg_position: number
}

/**
 * Per-player averages across ALL of a player's sessions this season.
 * Sorted by avg_score desc, tiebreak avg_position asc.
 */
export function buildSeasonAverages(sessions: NormalizedSession[]): SeasonAverageRow[] {
  const map = new Map<
    string,
    {
      player_id: string
      player_name: string
      total_score: number
      total_position: number
      count: number
    }
  >()
  for (const s of sessions) {
    for (const ps of s.player_sessions) {
      if (!ps.player_id) continue
      const existing = map.get(ps.player_id)
      if (existing) {
        existing.total_score += ps.score
        existing.total_position += ps.position
        existing.count++
      } else {
        map.set(ps.player_id, {
          player_id: ps.player_id,
          player_name: ps.player_name,
          total_score: ps.score,
          total_position: ps.position,
          count: 1,
        })
      }
    }
  }
  return Array.from(map.values())
    .map((p) => ({
      player_id: p.player_id,
      player_name: p.player_name,
      avg_score: p.total_score / p.count,
      avg_position: p.total_position / p.count,
    }))
    .sort((a, b) => b.avg_score - a.avg_score || a.avg_position - b.avg_position)
}

export type GameAverageRow = SeasonAverageRow & { total_score: number }

export type GameAverages = {
  game_id: string
  game_name: string
  rows: GameAverageRow[]
}

/**
 * Per-game, per-player averages (that game's sessions only), plus each player's
 * total score in the game. Games ordered most-played first (matching buildGameStats);
 * rows within a game sorted by avg_score desc, tiebreak avg_position asc.
 * Only players who actually played the game appear.
 */
export function buildGameAverages(sessions: NormalizedSession[]): GameAverages[] {
  const gameMap = new Map<
    string,
    {
      game_id: string
      game_name: string
      times_played: number
      players: Map<
        string,
        {
          player_id: string
          player_name: string
          total_score: number
          total_position: number
          count: number
        }
      >
    }
  >()

  for (const s of sessions) {
    if (!s.game_id) continue
    let game = gameMap.get(s.game_id)
    if (!game) {
      game = { game_id: s.game_id, game_name: s.game_name, times_played: 0, players: new Map() }
      gameMap.set(s.game_id, game)
    }
    game.times_played++
    for (const ps of s.player_sessions) {
      if (!ps.player_id) continue
      const existing = game.players.get(ps.player_id)
      if (existing) {
        existing.total_score += ps.score
        existing.total_position += ps.position
        existing.count++
      } else {
        game.players.set(ps.player_id, {
          player_id: ps.player_id,
          player_name: ps.player_name,
          total_score: ps.score,
          total_position: ps.position,
          count: 1,
        })
      }
    }
  }

  return Array.from(gameMap.values())
    .sort((a, b) => b.times_played - a.times_played)
    .map((g) => ({
      game_id: g.game_id,
      game_name: g.game_name,
      rows: Array.from(g.players.values())
        .map((p) => ({
          player_id: p.player_id,
          player_name: p.player_name,
          avg_score: p.total_score / p.count,
          avg_position: p.total_position / p.count,
          total_score: p.total_score,
        }))
        .sort((a, b) => b.avg_score - a.avg_score || a.avg_position - b.avg_position),
    }))
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
    date: new Date(s.session_date_played).toLocaleDateString('en-US', {
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
    const snapshot: Record<string, number | string> = { label: `Session #${i + 1}` }
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
      label: `Session #${i + 1}`,
      ...play.scores,
    })) as Record<string, number | string>[],
  }))
}

export type MetadataEntry = { field_name: string; value: string }

export type MetadataBreakdownInput = {
  game_id: string
  game_name: string
  player_sessions: { score: number; metadata: MetadataEntry[] }[]
}

export type MetadataBreakdownRow = { value: string; play_count: number; avg_score: number }

export type MetadataFieldBreakdown = {
  game_id: string
  game_name: string
  field_name: string
  rows: MetadataBreakdownRow[]
}

export function buildMetadataBreakdowns(
  sessions: MetadataBreakdownInput[],
): MetadataFieldBreakdown[] {
  // key: `${game_id} ${field_name} ${value}` → running totals
  const agg = new Map<
    string,
    {
      game_id: string
      game_name: string
      field_name: string
      value: string
      total: number
      count: number
    }
  >()

  for (const s of sessions) {
    for (const ps of s.player_sessions) {
      for (const m of ps.metadata) {
        const key = `${s.game_id} ${m.field_name} ${m.value}`
        const existing = agg.get(key)
        if (existing) {
          existing.total += ps.score
          existing.count += 1
        } else {
          agg.set(key, {
            game_id: s.game_id,
            game_name: s.game_name,
            field_name: m.field_name,
            value: m.value,
            total: ps.score,
            count: 1,
          })
        }
      }
    }
  }

  // Group into game+field buckets.
  const buckets = new Map<string, MetadataFieldBreakdown>()
  for (const a of agg.values()) {
    const bucketKey = `${a.game_id} ${a.field_name}`
    const bucket =
      buckets.get(bucketKey) ??
      buckets
        .set(bucketKey, {
          game_id: a.game_id,
          game_name: a.game_name,
          field_name: a.field_name,
          rows: [],
        })
        .get(bucketKey)!
    bucket.rows.push({
      value: a.value,
      play_count: a.count,
      avg_score: Number((a.total / a.count).toFixed(1)),
    })
  }

  const result = [...buckets.values()]
  for (const b of result) {
    b.rows.sort((x, y) => y.play_count - x.play_count || x.value.localeCompare(y.value))
  }
  result.sort(
    (a, b) => a.game_name.localeCompare(b.game_name) || a.field_name.localeCompare(b.field_name),
  )
  return result
}
