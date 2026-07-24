import { describe, it, expect } from 'vitest'
import { GET, POST } from '$routes/api/player/+server'
import {
  createMockSupabase,
  jsonRequest,
  adminLocals,
  anonLocals,
} from '../../../helpers/mockSupabase'

describe('GET /api/player', () => {
  it('returns 200 with players', async () => {
    expect.assertions(2)
    const { supabase } = createMockSupabase({
      player: { data: [{ player_id: 'p1' }], error: null },
    })
    const res = await GET({ locals: anonLocals(supabase) } as never)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual([{ player_id: 'p1' }])
  })
  it('returns 500 on error', async () => {
    expect.assertions(1)
    const { supabase } = createMockSupabase({ player: { data: null, error: { message: 'db' } } })
    const res = await GET({ locals: anonLocals(supabase) } as never)
    expect(res.status).toBe(500)
  })
})

describe('POST /api/player', () => {
  it('rejects non-admins with 403', async () => {
    expect.assertions(1)
    const { supabase } = createMockSupabase()
    await expect(
      POST({ request: jsonRequest({ player_name: 'x' }), locals: anonLocals(supabase) } as never),
    ).rejects.toMatchObject({ status: 403 })
  })
  it('inserts and returns 201 for admins', async () => {
    expect.assertions(1)
    const { supabase } = createMockSupabase({
      player: { data: [{ player_id: 'p2' }], error: null },
    })
    const res = await POST({
      request: jsonRequest({ player_name: 'Ann' }),
      locals: adminLocals(supabase),
    } as never)
    expect(res.status).toBe(201)
  })
})
