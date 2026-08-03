import { fail, redirect, error } from '@sveltejs/kit'
import type { Actions, ServerLoad } from '@sveltejs/kit'
import { requireAdmin } from '$lib/server/authorization'
import { traitValueSchema } from '$lib/schemas/trait'
import { rankPlayers, collectTraitInserts } from '../../add/utils.server.js'
import { reconcilePlayerSessions } from './utils.server.js'

export const load: ServerLoad = async ({ params, locals }) => {
  requireAdmin(locals.user)
  const sessionId = params.sessionId!

  const { data: session, error: sessionError } = await locals.supabase
    .from('sessions')
    .select(
      `
      session_id,
      season_id,
      game_id,
      session_date_played,
      seasons ( season_name ),
      player_sessions (
        player_id,
        player_session_score,
        player_session_position,
        player ( player_id, player_name ),
        player_session_metadata ( field_id, value )
      )
    `,
    )
    .eq('session_id', sessionId)
    .single()

  if (sessionError || !session) {
    error(404, 'Session not found')
  }

  const [gamesResult, rosterResult] = await Promise.all([
    locals.supabase.from('games').select('game_id, game_name').order('game_name'),
    locals.supabase
      .from('season_players')
      .select('player ( player_id, player_name )')
      .eq('season_id', session.season_id),
  ])

  const roster: { player_id: string; player_name: string }[] = []
  for (const row of rosterResult.data ?? []) {
    const p = Array.isArray(row.player) ? row.player[0] : row.player
    if (!p) continue
    roster.push({ player_id: p.player_id, player_name: p.player_name })
  }

  const seasonRow = Array.isArray(session.seasons) ? session.seasons[0] : session.seasons

  const players = (session.player_sessions ?? [])
    .slice()
    .sort((a, b) => (a.player_session_position ?? 0) - (b.player_session_position ?? 0))
    .map((ps) => {
      const p = Array.isArray(ps.player) ? ps.player[0] : ps.player
      return {
        player_id: p?.player_id ?? ps.player_id,
        player_name: p?.player_name ?? ps.player_id,
        score: ps.player_session_score,
        traits: Object.fromEntries(
          (ps.player_session_metadata ?? []).map((m) => [m.field_id, m.value]),
        ) as Record<string, string>,
      }
    })

  // DB names stop at the query boundary — these rows are traits and trait values
  // in the application layer (ADR-0002).
  const { data: traitRows } = await locals.supabase
    .from('game_metadata_fields')
    .select('field_id, game_id, field_name, display_order')
    .order('display_order', { ascending: true })

  const { data: valueRows } = await locals.supabase
    .from('player_session_metadata')
    .select('field_id, value')

  const traitsByGame: Record<string, { trait_id: string; trait_name: string }[]> = {}
  for (const t of traitRows ?? []) {
    ;(traitsByGame[t.game_id] ??= []).push({ trait_id: t.field_id, trait_name: t.field_name })
  }

  const valuesByTrait: Record<string, string[]> = {}
  for (const v of valueRows ?? []) {
    const set = (valuesByTrait[v.field_id] ??= [])
    if (!set.includes(v.value)) set.push(v.value)
  }

  return {
    session: {
      session_id: session.session_id,
      season_id: session.season_id,
      season_name: seasonRow?.season_name ?? '—',
      game_id: session.game_id,
      session_date_played: session.session_date_played,
      players,
    },
    games: gamesResult.data ?? [],
    roster,
    traitsByGame,
    valuesByTrait,
  }
}

export const actions: Actions = {
  updateSession: async ({ params, request, locals }) => {
    requireAdmin(locals.user)
    const sessionId = params.sessionId!
    const formData = await request.formData()

    const game_id = formData.get('game_id') as string
    const date_played = formData.get('date_played') as string | null
    const player_count = parseInt(formData.get('player_count') as string, 10)

    if (!game_id) {
      return fail(400, { message: 'Game is required.' })
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

    const { data: session, error: sessionError } = await locals.supabase
      .from('sessions')
      .select('season_id')
      .eq('session_id', sessionId)
      .single()

    if (sessionError || !session) {
      return fail(404, { message: 'Session not found.' })
    }
    const season_id = session.season_id

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

    const { error: updateError } = await locals.supabase
      .from('sessions')
      .update({ game_id, ...(date_played ? { session_date_played: date_played } : {}) })
      .eq('session_id', sessionId)

    if (updateError) {
      return fail(500, { message: 'Failed to update session.' })
    }

    const { data: existingPS } = await locals.supabase
      .from('player_sessions')
      .select('player_session_id, player_id')
      .eq('session_id', sessionId)

    const existing = (existingPS ?? []).map((r) => ({
      player_session_id: r.player_session_id,
      player_id: r.player_id ?? '',
    }))

    const plan = reconcilePlayerSessions(existing, rankPlayers(playerEntries))

    if (plan.deleteIds.length > 0) {
      const { error: delError } = await locals.supabase
        .from('player_sessions')
        .delete()
        .in('player_session_id', plan.deleteIds)
      if (delError) return fail(500, { message: 'Failed to update player results.' })
    }

    for (const u of plan.updates) {
      const { error: upErr } = await locals.supabase
        .from('player_sessions')
        .update({
          player_session_score: u.player_session_score,
          player_session_position: u.player_session_position,
        })
        .eq('player_session_id', u.player_session_id)
      if (upErr) return fail(500, { message: 'Failed to update player results.' })
    }

    let insertedRows: { player_session_id: string; player_id: string | null }[] = []
    if (plan.inserts.length > 0) {
      const { data: newRows, error: insErr } = await locals.supabase
        .from('player_sessions')
        .insert(plan.inserts.map((r) => ({ session_id: sessionId, ...r })))
        .select('player_session_id, player_id')
      if (insErr || !newRows) return fail(500, { message: 'Failed to save player results.' })
      insertedRows = newRows
    }

    // Map every current player_id → its stable player_session_id.
    const psIdByPlayer = new Map<string, string>()
    for (const u of plan.updates) {
      const match = existing.find((e) => e.player_session_id === u.player_session_id)
      if (match) psIdByPlayer.set(match.player_id, u.player_session_id)
    }
    for (const row of insertedRows) {
      if (row.player_id) psIdByPlayer.set(row.player_id, row.player_session_id)
    }

    const validTraitIds = new Set(
      (
        await locals.supabase.from('game_metadata_fields').select('field_id').eq('game_id', game_id)
      ).data?.map((t) => t.field_id) ?? [],
    )

    // Rewrite trait values for all current player-sessions: delete then re-insert
    // the non-empty submitted values (keyed by stable player_session_id).
    const currentPsIds = [...psIdByPlayer.values()]
    if (currentPsIds.length > 0) {
      await locals.supabase
        .from('player_session_metadata')
        .delete()
        .in('player_session_id', currentPsIds)
    }

    const traitRows = []
    for (let i = 0; i < player_count; i++) {
      const player_session_id = psIdByPlayer.get(playerEntries[i].player_id)
      if (!player_session_id) continue
      const traitValues: { trait_id: string; trait_value: string }[] = []
      for (const trait_id of validTraitIds) {
        const raw = formData.get(`trait_${i}_${trait_id}`)
        if (raw == null) continue
        const parsed = traitValueSchema.safeParse(raw)
        if (!parsed.success) {
          return fail(400, { message: `Trait value for player ${i + 1} is too long.` })
        }
        traitValues.push({ trait_id, trait_value: parsed.data })
      }
      traitRows.push({ player_session_id, traitValues })
    }

    const traitInserts = collectTraitInserts(traitRows)
    if (traitInserts.length > 0) {
      const { error: traitError } = await locals.supabase
        .from('player_session_metadata')
        .insert(traitInserts)
      if (traitError) return fail(500, { message: 'Failed to save player traits.' })
    }

    redirect(303, `/seasons/${season_id}/sessions`)
  },

  deleteSession: async ({ params, request, locals }) => {
    requireAdmin(locals.user)
    const sessionId = params.sessionId!
    const formData = await request.formData()

    let season_id = formData.get('season_id') as string | null
    if (!season_id) {
      const { data: session } = await locals.supabase
        .from('sessions')
        .select('season_id')
        .eq('session_id', sessionId)
        .single()
      season_id = session?.season_id ?? null
    }

    const { error: psError } = await locals.supabase
      .from('player_sessions')
      .delete()
      .eq('session_id', sessionId)
    if (psError) {
      return fail(500, { message: 'Failed to delete player results.' })
    }

    const { error: sessionError } = await locals.supabase
      .from('sessions')
      .delete()
      .eq('session_id', sessionId)
    if (sessionError) {
      return fail(500, { message: 'Failed to delete session.' })
    }

    redirect(303, season_id ? `/seasons/${season_id}/sessions` : '/')
  },
}
