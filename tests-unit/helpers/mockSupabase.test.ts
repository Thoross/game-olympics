import { describe, it, expect } from 'vitest'
import { createMockSupabase, formRequest, jsonRequest } from '../helpers/mockSupabase'

describe('createMockSupabase', () => {
  it('resolves a chained query with the configured result', async () => {
    expect.assertions(2)
    const { supabase } = createMockSupabase({ games: { data: [{ game_id: 'g1' }], error: null } })
    const { data, error } = await supabase.from('games').select('*').order('game_name')
    expect(error).toBeNull()
    expect(data).toEqual([{ game_id: 'g1' }])
  })

  it('resolves .single() with the configured result', async () => {
    expect.assertions(1)
    const { supabase } = createMockSupabase({
      sessions: { data: { session_id: 's1' }, error: null },
    })
    const { data } = await supabase.from('sessions').insert({}).select('session_id').single()
    expect(data).toEqual({ session_id: 's1' })
  })

  it('returns queued results in order for repeated calls to the same table', async () => {
    expect.assertions(2)
    const { supabase } = createMockSupabase({
      season_players: [
        { data: [{ player_id: 'a' }], error: null },
        { data: [{ player_id: 'b' }], error: null },
      ],
    })
    const first = await supabase.from('season_players').select('*')
    const second = await supabase.from('season_players').select('*')
    expect(first.data).toEqual([{ player_id: 'a' }])
    expect(second.data).toEqual([{ player_id: 'b' }])
  })

  it('records calls with table, method, and args', async () => {
    expect.assertions(1)
    const { supabase, calls } = createMockSupabase({ games: { data: [], error: null } })
    await supabase.from('games').select('*').ilike('game_name', '%x%')
    expect(calls).toEqual(
      expect.arrayContaining([{ table: 'games', method: 'ilike', args: ['game_name', '%x%'] }]),
    )
  })

  it('reuses a single-object handler across repeated calls to the same table', async () => {
    expect.assertions(3)
    const { supabase } = createMockSupabase({
      games: { data: [{ game_id: 'g1' }], error: null },
    })
    const first = await supabase.from('games').select('*')
    const second = await supabase.from('games').select('*')
    const third = await supabase.from('games').select('*')
    expect(first.data).toEqual([{ game_id: 'g1' }])
    expect(second.data).toEqual([{ game_id: 'g1' }])
    expect(third.data).toEqual([{ game_id: 'g1' }])
  })

  it('drains a 2-element array in order then falls through to the default', async () => {
    expect.assertions(3)
    const { supabase } = createMockSupabase({
      season_players: [
        { data: [{ player_id: 'a' }], error: null },
        { data: [{ player_id: 'b' }], error: null },
      ],
    })
    const first = await supabase.from('season_players').select('*')
    const second = await supabase.from('season_players').select('*')
    const third = await supabase.from('season_players').select('*')
    expect(first.data).toEqual([{ player_id: 'a' }])
    expect(second.data).toEqual([{ player_id: 'b' }])
    expect(third).toEqual({ data: null, error: null })
  })

  it('drains a 1-element array once then falls through to the default', async () => {
    expect.assertions(2)
    const { supabase } = createMockSupabase({
      games: [{ data: [{ game_id: 'g1' }], error: null }],
    })
    const first = await supabase.from('games').select('*')
    const second = await supabase.from('games').select('*')
    expect(first.data).toEqual([{ game_id: 'g1' }])
    expect(second).toEqual({ data: null, error: null })
  })

  it('formRequest exposes formData() and jsonRequest exposes json()', async () => {
    expect.assertions(2)
    const fr = formRequest({ a: '1' })
    const jr = jsonRequest({ b: 2 })
    expect((await fr.formData()).get('a')).toBe('1')
    expect(await jr.json()).toEqual({ b: 2 })
  })
})
