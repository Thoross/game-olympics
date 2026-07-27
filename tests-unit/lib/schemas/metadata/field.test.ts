import { describe, it, expect } from 'vitest'
import { metadataFieldSchema, metadataValueSchema } from '$lib/schemas/metadata/field'

describe('metadataFieldSchema', () => {
  it('accepts a valid trimmed name', () => {
    const result = metadataFieldSchema.parse({ field_name: '  Class  ' })
    expect(result.field_name).toBe('Class')
  })

  it('rejects an empty name', () => {
    expect(() => metadataFieldSchema.parse({ field_name: '   ' })).toThrow()
  })

  it('rejects a name longer than 50 chars', () => {
    expect(() => metadataFieldSchema.parse({ field_name: 'x'.repeat(51) })).toThrow()
  })
})

describe('metadataValueSchema', () => {
  it('trims values', () => {
    expect(metadataValueSchema.parse('  Brute  ')).toBe('Brute')
  })

  it('rejects values longer than 100 chars', () => {
    expect(() => metadataValueSchema.parse('x'.repeat(101))).toThrow()
  })
})
