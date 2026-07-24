import { describe, it, expect } from 'vitest'
import { addGameSchema } from '$lib/schemas/game/add'
import { addSeasonSchema } from '$lib/schemas/season/add'
import { multiplierScheduleSchema } from '$lib/schemas/scoring/schedule'
import { registerSchema } from '$lib/schemas/user/registration'
import { signInSchema } from '$lib/schemas/user/signin'

describe('addGameSchema', () => {
  it('accepts a name with an empty bgg url', () => {
    expect.assertions(1)
    expect(addGameSchema.safeParse({ gameName: 'Catan', gameBggUrl: '' }).success).toBe(true)
  })
  it('rejects an empty name', () => {
    expect.assertions(1)
    expect(addGameSchema.safeParse({ gameName: '', gameBggUrl: '' }).success).toBe(false)
  })
})

describe('addSeasonSchema', () => {
  it('rejects an invalid status', () => {
    expect.assertions(1)
    const r = addSeasonSchema.safeParse({ seasonName: 'S1', seasonStatus: 'NOPE' })
    expect(r.success).toBe(false)
  })
  it('accepts a valid season', () => {
    expect.assertions(1)
    const r = addSeasonSchema.safeParse({ seasonName: 'S1', seasonStatus: 'UPCOMING' })
    expect(r.success).toBe(true)
  })
})

describe('multiplierScheduleSchema', () => {
  it('rejects an empty schedule', () => {
    expect.assertions(1)
    expect(multiplierScheduleSchema.safeParse({ multipliers: [] }).success).toBe(false)
  })
  it('rejects non-positive or non-integer values', () => {
    expect.assertions(2)
    expect(multiplierScheduleSchema.safeParse({ multipliers: [0] }).success).toBe(false)
    expect(multiplierScheduleSchema.safeParse({ multipliers: [1.5] }).success).toBe(false)
  })
  it('accepts a positive-integer schedule', () => {
    expect.assertions(1)
    expect(multiplierScheduleSchema.safeParse({ multipliers: [1, 2, 3] }).success).toBe(true)
  })
})

describe('registerSchema', () => {
  it('rejects mismatched passwords on the confirmPassword path', () => {
    expect.assertions(2)
    const r = registerSchema.safeParse({
      playerName: 'Bob',
      email: 'b@x.com',
      password: 'secret1',
      confirmPassword: 'secret2',
    })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.issues[0].path).toEqual(['confirmPassword'])
  })
})

describe('signInSchema', () => {
  it('rejects an invalid email', () => {
    expect.assertions(1)
    expect(signInSchema.safeParse({ email: 'nope', password: 'x' }).success).toBe(false)
  })
})
