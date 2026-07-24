import { describe, it, expect } from 'vitest'
import { load } from '$routes/(authed)/admin/seasons/+page.server'
import { createMockSupabase, adminLocals, playerLocals } from '../../../../helpers/mockSupabase'

describe('admin/seasons load', () => {
  it('throws 403 for non-admins', async () => {
    expect.assertions(1)
    const { supabase } = createMockSupabase()
    await expect(load({ locals: playerLocals(supabase) } as never)).rejects.toMatchObject({
      status: 403,
    })
  })
  it('returns seasons for admins', async () => {
    expect.assertions(1)
    const { supabase } = createMockSupabase({
      seasons: { data: [{ season_id: 's1' }], error: null },
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: any = await load({ locals: adminLocals(supabase) } as never)
    expect(result.seasons).toEqual([{ season_id: 's1' }])
  })
  it('returns an empty list when the query errors', async () => {
    expect.assertions(1)
    const { supabase } = createMockSupabase({ seasons: { data: null, error: { message: 'x' } } })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: any = await load({ locals: adminLocals(supabase) } as never)
    expect(result.seasons).toEqual([])
  })
})
