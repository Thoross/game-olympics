import { describe, it, expect } from 'vitest'
import { GET } from '$routes/auth/callback/+server'
import { createMockSupabase } from '../../../helpers/mockSupabase'

const event = (query: string, supabase: unknown) =>
  ({ url: new URL(`http://localhost/auth/callback${query}`), locals: { supabase } }) as never

describe('GET /auth/callback', () => {
  it('verifies an OTP token and redirects to next on success', async () => {
    expect.assertions(1)
    const { supabase } = createMockSupabase({ __auth__: { error: null } })
    await expect(
      GET(event('?token_hash=abc&type=email&next=/games', supabase)),
    ).rejects.toMatchObject({ status: 303, location: '/games' })
  })

  it('redirects to the signin error page when OTP verification fails', async () => {
    expect.assertions(1)
    const { supabase } = createMockSupabase({ __auth__: { error: { message: 'bad' } } })
    await expect(GET(event('?token_hash=abc&type=email', supabase))).rejects.toMatchObject({
      status: 303,
      location: '/auth/signin?error=invalid_link',
    })
  })

  it('redirects to the signin error page when no token or code is present', async () => {
    expect.assertions(1)
    const { supabase } = createMockSupabase()
    await expect(GET(event('', supabase))).rejects.toMatchObject({
      status: 303,
      location: '/auth/signin?error=invalid_link',
    })
  })
})
