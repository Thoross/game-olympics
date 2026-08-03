import { error, fail } from '@sveltejs/kit'
import { z } from 'zod'
import { isAdmin, requireAdmin } from '$lib/server/authorization'
import { extractBggId, fetchBggGame } from '$lib/server/bgg.server'
import { traitSchema } from '$lib/schemas/trait'
import {
  buildPlayerGameSeasonStats,
  buildTraitBreakdowns,
  nextDisplayOrder,
  type GameSessionRow,
} from './utils.server'
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

  // The `game_metadata_fields` / `player_session_metadata` tables hold traits and
  // trait values — the DB names stop here, at the query boundary (see ADR-0002).
  const { data: traitRows } = await locals.supabase
    .from('game_metadata_fields')
    .select('field_id, field_name, display_order')
    .eq('game_id', gameId)
    .order('display_order', { ascending: true })

  const traits = (traitRows ?? []).map((t) => ({
    trait_id: t.field_id,
    trait_name: t.field_name,
    display_order: t.display_order,
  }))

  const { data: valueRows } = await locals.supabase
    .from('player_session_metadata')
    .select('value, game_metadata_fields!inner ( field_name, game_id )')
    .eq('game_metadata_fields.game_id', gameId)

  const traitBreakdowns = buildTraitBreakdowns(
    (valueRows ?? []).map((r) => {
      const f = Array.isArray(r.game_metadata_fields)
        ? r.game_metadata_fields[0]
        : r.game_metadata_fields
      return { trait_name: f?.field_name ?? '', trait_value: r.value }
    }),
  )

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

  return {
    game,
    seasonStats,
    traits,
    traitBreakdowns,
    isAdmin: isAdmin(locals.user),
  }
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

  addTrait: async ({ params, request, locals }) => {
    requireAdmin(locals.user)
    const gameId = params.gameId!
    const formData = await request.formData()

    let trait_name: string
    try {
      ;({ trait_name } = traitSchema.parse({ trait_name: formData.get('trait_name') }))
    } catch (err) {
      if (err instanceof z.ZodError) {
        return fail(400, { traitError: err.issues[0]?.message ?? 'Invalid trait name.' })
      }
      return fail(500, { traitError: 'Something went wrong.' })
    }

    const { data: existing } = await locals.supabase
      .from('game_metadata_fields')
      .select('display_order')
      .eq('game_id', gameId)

    const { error: insertError } = await locals.supabase.from('game_metadata_fields').insert({
      game_id: gameId,
      field_name: trait_name,
      display_order: nextDisplayOrder(existing ?? []),
    })

    if (insertError) {
      // 23505 = unique_violation (duplicate trait name for this game)
      if (insertError.code === '23505') {
        return fail(400, { traitError: 'A trait with that name already exists for this game.' })
      }
      return fail(500, { traitError: 'Failed to add trait.' })
    }

    return { traitSuccess: true }
  },

  updateTrait: async ({ request, locals }) => {
    requireAdmin(locals.user)
    const formData = await request.formData()
    const trait_id = formData.get('trait_id') as string
    if (!trait_id) return fail(400, { traitError: 'Missing trait.' })

    let trait_name: string
    try {
      ;({ trait_name } = traitSchema.parse({ trait_name: formData.get('trait_name') }))
    } catch (err) {
      if (err instanceof z.ZodError) {
        return fail(400, { traitError: err.issues[0]?.message ?? 'Invalid trait name.' })
      }
      return fail(500, { traitError: 'Something went wrong.' })
    }

    const { error: updateError } = await locals.supabase
      .from('game_metadata_fields')
      .update({ field_name: trait_name })
      .eq('field_id', trait_id)

    if (updateError) {
      if (updateError.code === '23505') {
        return fail(400, { traitError: 'A trait with that name already exists for this game.' })
      }
      return fail(500, { traitError: 'Failed to rename trait.' })
    }

    return { traitSuccess: true }
  },

  removeTrait: async ({ request, locals }) => {
    requireAdmin(locals.user)
    const formData = await request.formData()
    const trait_id = formData.get('trait_id') as string
    if (!trait_id) return fail(400, { traitError: 'Missing trait.' })

    // Block deletion when recorded trait values exist — preserves history.
    const { count } = await locals.supabase
      .from('player_session_metadata')
      .select('id', { count: 'exact', head: true })
      .eq('field_id', trait_id)

    if ((count ?? 0) > 0) {
      return fail(400, {
        traitError: 'This trait has recorded values and can’t be deleted. Rename it instead.',
      })
    }

    const { error: deleteError } = await locals.supabase
      .from('game_metadata_fields')
      .delete()
      .eq('field_id', trait_id)

    if (deleteError) {
      return fail(500, { traitError: 'Failed to delete trait.' })
    }

    return { traitSuccess: true }
  },
}
