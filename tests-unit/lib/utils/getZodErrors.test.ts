import { describe, it, expect } from 'vitest'
import { getZodErrors } from '$lib/utils/getZodErrors'
import { addGameSchema } from '$lib/schemas/game/add'

describe('getZodErrors', () => {
  it('maps the first path segment of each issue to its message', () => {
    expect.assertions(1)
    const result = addGameSchema.safeParse({ gameName: '', gameBggUrl: 'not-a-url' })
    if (result.success) throw new Error('expected parse to fail')
    expect(getZodErrors(result.error)).toEqual({
      errors: { gameName: 'Game name is required', gameBggUrl: 'Must be a valid URL' },
    })
  })
})
