import { describe, it, expect } from 'vitest'
import { GET, PUT, DELETE } from '$routes/api/player/[id]/+server'
import {
  createMockSupabase,
  jsonRequest,
  adminLocals,
  anonLocals,
} from '../../../../helpers/mockSupabase'

describe('GET /api/player/[id]', () => {
  it('returns 404 when the player is missing', async () => {
    expect.assertions(1)
    const { supabase } = createMockSupabase({ player: { data: null, error: null } })
    const res = await GET({ locals: anonLocals(supabase), params: { id: 'nope' } } as never)
    expect(res.status).toBe(404)
  })
  it('returns 200 with the player', async () => {
    expect.assertions(1)
    const { supabase } = createMockSupabase({ player: { data: { player_id: 'p1' }, error: null } })
    const res = await GET({ locals: anonLocals(supabase), params: { id: 'p1' } } as never)
    expect(res.status).toBe(200)
  })
})

describe('PUT /api/player/[id]', () => {
  it('forbids updating another player when not admin', async () => {
    expect.assertions(1)
    const { supabase } = createMockSupabase()
    const locals = { supabase, user: { player_role: 'PLAYER', player_id: 'me' } }
    await expect(
      PUT({ request: jsonRequest({ player_name: 'x' }), params: { id: 'other' }, locals } as never),
    ).rejects.toMatchObject({ status: 403 })
  })
  it('allows self-update and returns 200', async () => {
    expect.assertions(1)
    const { supabase } = createMockSupabase({ player: { data: { player_id: 'me' }, error: null } })
    const locals = { supabase, user: { player_role: 'PLAYER', player_id: 'me' } }
    const res = await PUT({
      request: jsonRequest({ player_name: 'x' }),
      params: { id: 'me' },
      locals,
    } as never)
    expect(res.status).toBe(200)
  })
})

describe('DELETE /api/player/[id]', () => {
  it('rejects non-admins with 403', async () => {
    expect.assertions(1)
    const { supabase } = createMockSupabase()
    await expect(
      DELETE({ params: { id: 'p1' }, locals: anonLocals(supabase) } as never),
    ).rejects.toMatchObject({ status: 403 })
  })
  it('returns 200 on successful delete for admins', async () => {
    expect.assertions(1)
    const { supabase } = createMockSupabase({ player: { data: { player_id: 'p1' }, error: null } })
    const res = await DELETE({ params: { id: 'p1' }, locals: adminLocals(supabase) } as never)
    expect(res.status).toBe(200)
  })
})
