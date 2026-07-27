import { describe, it, expect } from 'vitest'
import { load, actions } from '$routes/(authed)/admin/sessions/add/+page.server'
import {
  createMockSupabase,
  formRequest,
  adminLocals,
  playerLocals,
} from '../../../../../helpers/mockSupabase'

describe('admin/sessions/add load', () => {
  it('throws 403 for non-admins', async () => {
    expect.assertions(1)
    const { supabase } = createMockSupabase()
    await expect(load({ locals: playerLocals(supabase) } as never)).rejects.toMatchObject({
      status: 403,
    })
  })

  it('groups season players by season for admins', async () => {
    expect.assertions(1)
    const { supabase } = createMockSupabase({
      games: { data: [{ game_id: 'g1', game_name: 'Catan' }], error: null },
      seasons: { data: [{ season_id: 's1', season_name: 'One' }], error: null },
      season_players: {
        data: [{ season_id: 's1', player: { player_id: 'p1', player_name: 'Ann' } }],
        error: null,
      },
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: any = await load({ locals: adminLocals(supabase) } as never)
    expect(result.playersBySeason).toEqual({ s1: [{ player_id: 'p1', player_name: 'Ann' }] })
  })
})

describe('admin/sessions/add default action', () => {
  it('returns 400 when season or game is missing', async () => {
    expect.assertions(1)
    const { supabase } = createMockSupabase()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: any = await actions.default({
      request: formRequest({ season_id: '', game_id: '', player_count: '1' }),
      locals: adminLocals(supabase),
    } as never)
    expect(result.status).toBe(400)
  })

  it('returns 400 when a player is not on the season roster', async () => {
    expect.assertions(1)
    const { supabase } = createMockSupabase({
      season_players: { data: [{ player_id: 'someone-else' }], error: null },
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: any = await actions.default({
      request: formRequest({
        season_id: 's1',
        game_id: 'g1',
        player_count: '1',
        player_id_0: 'p1',
        score_0: '10',
      }),
      locals: adminLocals(supabase),
    } as never)
    expect(result.status).toBe(400)
  })

  it('inserts session + player_sessions and redirects on success', async () => {
    expect.assertions(2)
    const { supabase, calls } = createMockSupabase({
      season_players: { data: [{ player_id: 'p1' }, { player_id: 'p2' }], error: null },
      sessions: { data: { session_id: 'sess1' }, error: null },
      player_sessions: {
        data: [
          { player_session_id: 'ps1', player_id: 'p1' },
          { player_session_id: 'ps2', player_id: 'p2' },
        ],
        error: null,
      },
    })
    await expect(
      actions.default({
        request: formRequest({
          season_id: 's1',
          game_id: 'g1',
          player_count: '2',
          player_id_0: 'p1',
          score_0: '10',
          player_id_1: 'p2',
          score_1: '8',
        }),
        locals: adminLocals(supabase),
      } as never),
    ).rejects.toMatchObject({ status: 303, location: '/seasons/s1/sessions' })
    expect(calls.some((c) => c.table === 'player_sessions' && c.method === 'insert')).toBe(true)
  })
})
