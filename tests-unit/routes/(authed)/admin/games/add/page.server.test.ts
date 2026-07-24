import { describe, it, expect } from 'vitest'
import { actions } from '$routes/(authed)/admin/games/add/+page.server'
import {
  createMockSupabase,
  formRequest,
  adminLocals,
  playerLocals,
} from '../../../../../helpers/mockSupabase'

describe('admin/games/add default action', () => {
  it('rejects non-admins with 403', async () => {
    expect.assertions(1)
    const { supabase } = createMockSupabase()
    await expect(
      actions.default({
        request: formRequest({ gameName: 'x', gameBggUrl: '' }),
        locals: playerLocals(supabase),
      } as never),
    ).rejects.toMatchObject({ status: 403 })
  })

  it('returns a 400 with field errors on invalid input', async () => {
    expect.assertions(2)
    const { supabase } = createMockSupabase()
    const result = (await actions.default({
      request: formRequest({ gameName: '', gameBggUrl: '' }),
      locals: adminLocals(supabase),
    } as never)) as { status: number; data: { errors: Record<string, string> } }
    expect(result.status).toBe(400)
    expect(result.data.errors.gameName).toBe('Game name is required')
  })

  it('inserts and redirects to /games on success', async () => {
    expect.assertions(2)
    const { supabase, calls } = createMockSupabase({ games: { data: null, error: null } })
    await expect(
      actions.default({
        request: formRequest({ gameName: 'Catan', gameBggUrl: '' }),
        locals: adminLocals(supabase),
      } as never),
    ).rejects.toMatchObject({ status: 303, location: '/games' })
    expect(calls.some((c) => c.table === 'games' && c.method === 'insert')).toBe(true)
  })

  it('returns 500 when the insert errors', async () => {
    expect.assertions(1)
    const { supabase } = createMockSupabase({ games: { data: null, error: { message: 'boom' } } })
    const result = (await actions.default({
      request: formRequest({ gameName: 'Catan', gameBggUrl: '' }),
      locals: adminLocals(supabase),
    } as never)) as { status: number }
    expect(result.status).toBe(500)
  })
})
