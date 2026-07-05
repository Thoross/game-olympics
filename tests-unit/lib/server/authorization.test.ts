import { describe, it, expect } from 'vitest'
import { requireAdmin, isAdmin } from '$lib/server/authorization'

describe('requireAdmin', () => {
  it('throws for PLAYER role', () => {
    expect.assertions(1)
    expect(() => requireAdmin({ player_role: 'PLAYER' })).toThrow()
  })

  it('throws for null user', () => {
    expect.assertions(1)
    expect(() => requireAdmin(null)).toThrow()
  })

  it('throws for undefined role', () => {
    expect.assertions(1)
    expect(() => requireAdmin({})).toThrow()
  })

  it('does not throw for ADMIN role', () => {
    expect.assertions(1)
    expect(() => requireAdmin({ player_role: 'ADMIN' })).not.toThrow()
  })
})

describe('isAdmin', () => {
  it('returns true for ADMIN', () => {
    expect.assertions(1)
    expect(isAdmin({ player_role: 'ADMIN' })).toBe(true)
  })

  it('returns false for PLAYER', () => {
    expect.assertions(1)
    expect(isAdmin({ player_role: 'PLAYER' })).toBe(false)
  })

  it('returns false for null user', () => {
    expect.assertions(1)
    expect(isAdmin(null)).toBe(false)
  })
})
