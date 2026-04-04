import { describe, it, expect } from 'vitest'
import { getMultiplier, positionToPoints } from '$lib/server/utils.server'

describe('getMultiplier', () => {
  describe('null multipliers (no schedule row — legacy behaviour)', () => {
    it('returns 1 for n=1', () => {
      expect.assertions(1)
      expect(getMultiplier(null, 1)).toBe(1)
    })

    it('returns 1 for n=5', () => {
      expect.assertions(1)
      expect(getMultiplier(null, 5)).toBe(1)
    })
  })

  describe('empty array multipliers', () => {
    it('returns 1 for n=1', () => {
      expect.assertions(1)
      expect(getMultiplier([], 1)).toBe(1)
    })

    it('returns 1 for n=3', () => {
      expect.assertions(1)
      expect(getMultiplier([], 3)).toBe(1)
    })
  })

  describe('in-range lookup', () => {
    it('returns first element for n=1', () => {
      expect.assertions(1)
      expect(getMultiplier([1, 2, 3], 1)).toBe(1)
    })

    it('returns second element for n=2', () => {
      expect.assertions(1)
      expect(getMultiplier([1, 2, 3], 2)).toBe(2)
    })

    it('returns last element for n=3', () => {
      expect.assertions(1)
      expect(getMultiplier([1, 2, 3], 3)).toBe(3)
    })
  })

  describe('overflow (n > schedule length — repeat last)', () => {
    it('returns last element for n=4 with 3-element schedule', () => {
      expect.assertions(1)
      expect(getMultiplier([1, 2, 3], 4)).toBe(3)
    })

    it('returns last element for n=5 with 3-element schedule', () => {
      expect.assertions(1)
      expect(getMultiplier([1, 2, 3], 5)).toBe(3)
    })

    it('returns last element for n=100 with 3-element schedule', () => {
      expect.assertions(1)
      expect(getMultiplier([1, 2, 3], 100)).toBe(3)
    })
  })

  describe('single-element schedule', () => {
    it('returns the element for n=1', () => {
      expect.assertions(1)
      expect(getMultiplier([5], 1)).toBe(5)
    })

    it('returns the element for n=3 (overflow)', () => {
      expect.assertions(1)
      expect(getMultiplier([5], 3)).toBe(5)
    })
  })
})

describe('positionToPoints', () => {
  it('returns 4 for position 1', () => {
    expect.assertions(1)
    expect(positionToPoints(1)).toBe(4)
  })

  it('returns 3 for position 2', () => {
    expect.assertions(1)
    expect(positionToPoints(2)).toBe(3)
  })

  it('returns 2 for position 3', () => {
    expect.assertions(1)
    expect(positionToPoints(3)).toBe(2)
  })

  it('returns 1 for position 4', () => {
    expect.assertions(1)
    expect(positionToPoints(4)).toBe(1)
  })

  it('returns 0 for position 5 and beyond', () => {
    expect.assertions(1)
    expect(positionToPoints(5)).toBe(0)
  })

  it('returns 0 for position 0', () => {
    expect.assertions(1)
    expect(positionToPoints(0)).toBe(0)
  })
})
