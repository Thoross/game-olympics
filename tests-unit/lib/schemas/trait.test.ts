import { describe, it, expect } from 'vitest'
import { traitSchema, traitValueSchema } from '$lib/schemas/trait'

describe('traitSchema', () => {
  it('accepts a valid trimmed name', () => {
    const result = traitSchema.parse({ trait_name: '  Class  ' })
    expect(result.trait_name).toBe('Class')
  })

  it('rejects an empty name', () => {
    expect(() => traitSchema.parse({ trait_name: '   ' })).toThrow()
  })

  it('rejects a name longer than 50 chars', () => {
    expect(() => traitSchema.parse({ trait_name: 'x'.repeat(51) })).toThrow()
  })
})

describe('traitValueSchema', () => {
  it('trims values', () => {
    expect(traitValueSchema.parse('  Brute  ')).toBe('Brute')
  })

  it('rejects values longer than 100 chars', () => {
    expect(() => traitValueSchema.parse('x'.repeat(101))).toThrow()
  })
})
