import { describe, it, expect } from 'vitest'
import { load, actions } from '$routes/(authed)/admin/scoring/+page.server'
import {
  createMockSupabase,
  formRequest,
  adminLocals,
  playerLocals,
} from '../../../../helpers/mockSupabase'

const urlEvent = (supabase: unknown, user: unknown, season?: string) =>
  ({
    locals: { supabase, user },
    url: new URL(`http://x/admin/scoring${season ? `?season=${season}` : ''}`),
  }) as never

describe('admin/scoring load', () => {
  it('throws 403 for non-admins', async () => {
    expect.assertions(1)
    const { supabase } = createMockSupabase()
    await expect(load(urlEvent(supabase, { player_role: 'PLAYER' }))).rejects.toMatchObject({
      status: 403,
    })
  })

  it('merges each season with its schedule and exposes focusSeasonId', async () => {
    expect.assertions(2)
    const { supabase } = createMockSupabase({
      seasons: {
        data: [{ season_id: 's1', season_name: 'One', season_status: 'IN_PROGRESS' }],
        error: null,
      },
      season_scoring_schedules: { data: [{ season_id: 's1', multipliers: [1, 2] }], error: null },
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: any = await load(urlEvent(supabase, { player_role: 'ADMIN' }, 's1'))
    expect(result.seasons[0].multipliers).toEqual([1, 2])
    expect(result.focusSeasonId).toBe('s1')
  })
})

describe('admin/scoring upsertSchedule action', () => {
  it('returns 400 when season_id is missing', async () => {
    expect.assertions(1)
    const { supabase } = createMockSupabase()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: any = await actions.upsertSchedule({
      request: formRequest({ multipliers: ['1', '2'] }),
      locals: adminLocals(supabase),
    } as never)
    expect(result.status).toBe(400)
  })

  it('returns 400 for an empty schedule', async () => {
    expect.assertions(1)
    const { supabase } = createMockSupabase()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: any = await actions.upsertSchedule({
      request: formRequest({ season_id: 's1', multipliers: [] }),
      locals: adminLocals(supabase),
    } as never)
    expect(result.status).toBe(400)
  })

  it('upserts and returns success for a valid schedule', async () => {
    expect.assertions(2)
    const { supabase, calls } = createMockSupabase({ season_scoring_schedules: { error: null } })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: any = await actions.upsertSchedule({
      request: formRequest({ season_id: 's1', multipliers: ['1', '2', '3'] }),
      locals: adminLocals(supabase),
    } as never)
    expect(result).toEqual({ upsertSuccess: true, season_id: 's1' })
    expect(calls.some((c) => c.table === 'season_scoring_schedules' && c.method === 'upsert')).toBe(
      true,
    )
  })

  it('rejects non-admins with 403', async () => {
    expect.assertions(1)
    const { supabase } = createMockSupabase()
    await expect(
      actions.upsertSchedule({
        request: formRequest({ season_id: 's1', multipliers: ['1'] }),
        locals: playerLocals(supabase),
      } as never),
    ).rejects.toMatchObject({ status: 403 })
  })
})
