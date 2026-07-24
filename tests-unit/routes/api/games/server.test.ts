import { describe, it, expect } from 'vitest'
import { PUT, POST } from '$routes/api/games/+server'
import {
  createMockSupabase,
  jsonRequest,
  adminLocals,
  anonLocals,
} from '../../../helpers/mockSupabase'

describe('PUT /api/games', () => {
  it('rejects non-admins with 403', async () => {
    expect.assertions(1)
    const { supabase } = createMockSupabase()
    await expect(
      PUT({ request: jsonRequest({ game_name: 'x' }), locals: anonLocals(supabase) } as never),
    ).rejects.toMatchObject({ status: 403 })
  })

  it('upserts and returns 201 with the inserted rows', async () => {
    expect.assertions(2)
    const { supabase, calls } = createMockSupabase({
      games: { data: [{ game_id: 'g1' }], error: null },
    })
    const res = await PUT({
      request: jsonRequest({ game_name: 'Catan' }),
      locals: adminLocals(supabase),
    } as never)
    expect(res.status).toBe(201)
    expect(calls).toEqual(
      expect.arrayContaining([
        { table: 'games', method: 'upsert', args: [[{ game_name: 'Catan' }]] },
      ]),
    )
  })

  it('returns 500 when Supabase errors', async () => {
    expect.assertions(2)
    const { supabase } = createMockSupabase({ games: { data: null, error: { message: 'boom' } } })
    const res = await PUT({
      request: jsonRequest({ game_name: 'x' }),
      locals: adminLocals(supabase),
    } as never)
    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({ error: 'boom' })
  })
})

describe('POST /api/games', () => {
  it('filters by name when provided and returns 201', async () => {
    expect.assertions(2)
    const { supabase, calls } = createMockSupabase({
      games: { data: [{ game_id: 'g1' }], error: null },
    })
    const res = await POST({
      request: jsonRequest({ name: 'cat' }),
      locals: adminLocals(supabase),
    } as never)
    expect(res.status).toBe(201)
    expect(calls).toEqual(
      expect.arrayContaining([{ table: 'games', method: 'ilike', args: ['game_name', '%cat%'] }]),
    )
  })
})
