import { describe, it, expect } from 'vitest'
import { resolveHomeRedirect } from '$routes/utils.server'

describe('resolveHomeRedirect', () => {
  it('redirects to the full seasons list when there are no in-progress seasons', () => {
    expect(resolveHomeRedirect([])).toBe('/seasons')
  })

  it('redirects to the single in-progress season', () => {
    expect(resolveHomeRedirect(['abc'])).toBe('/seasons/abc')
  })

  it('redirects to the filtered list when there are multiple in-progress seasons', () => {
    expect(resolveHomeRedirect(['abc', 'def'])).toBe('/seasons?season-status=IN_PROGRESS')
  })
})
