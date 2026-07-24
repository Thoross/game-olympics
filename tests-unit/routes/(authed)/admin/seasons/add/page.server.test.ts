import { describe, it, expect } from 'vitest'
import { actions } from '$routes/(authed)/admin/seasons/add/+page.server'
import {
  createMockSupabase,
  formRequest,
  adminLocals,
  playerLocals,
} from '../../../../../helpers/mockSupabase'

describe('admin/seasons/add default action', () => {
  it('rejects non-admins with 403', async () => {
    expect.assertions(1)
    const { supabase } = createMockSupabase()
    await expect(
      actions.default({
        request: formRequest({ seasonName: 'S', seasonDescription: '', seasonStatus: 'UPCOMING' }),
        locals: playerLocals(supabase),
      } as never),
    ).rejects.toMatchObject({ status: 403 })
  })

  it('returns 400 with field errors on invalid status', async () => {
    expect.assertions(1)
    const { supabase } = createMockSupabase()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: any = await actions.default({
      request: formRequest({ seasonName: 'S', seasonDescription: '', seasonStatus: 'NOPE' }),
      locals: adminLocals(supabase),
    } as never)
    expect(result.status).toBe(400)
  })

  it('creates a season and redirects to its edit page', async () => {
    expect.assertions(1)
    const { supabase } = createMockSupabase({
      seasons: { data: { season_id: 'new1' }, error: null },
    })
    await expect(
      actions.default({
        request: formRequest({ seasonName: 'S', seasonDescription: '', seasonStatus: 'UPCOMING' }),
        locals: adminLocals(supabase),
      } as never),
    ).rejects.toMatchObject({ status: 303, location: '/admin/seasons/new1' })
  })

  it('returns 500 when the insert errors', async () => {
    expect.assertions(1)
    const { supabase } = createMockSupabase({ seasons: { data: null, error: { message: 'boom' } } })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: any = await actions.default({
      request: formRequest({ seasonName: 'S', seasonDescription: '', seasonStatus: 'UPCOMING' }),
      locals: adminLocals(supabase),
    } as never)
    expect(result.status).toBe(500)
  })
})
