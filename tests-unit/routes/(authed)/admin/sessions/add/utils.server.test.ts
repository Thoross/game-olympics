import { describe, it, expect } from 'vitest'
import { rankPlayers, collectTraitInserts } from '$routes/(authed)/admin/sessions/add/utils.server'

// ─── rankPlayers ─────────────────────────────────────────────────────────────

describe('rankPlayers', () => {
  it('returns empty array for no players', () => {
    expect(rankPlayers([])).toEqual([])
  })

  it('ranks a single player as 1st', () => {
    const result = rankPlayers([{ player_id: 'p-alice', score: 10 }])
    expect(result).toHaveLength(1)
    expect(result[0].player_session_position).toBe(1)
    expect(result[0].player_session_score).toBe(10)
  })

  it('ranks players by score descending with no ties', () => {
    const result = rankPlayers([
      { player_id: 'p-alice', score: 10 },
      { player_id: 'p-bob', score: 8 },
      { player_id: 'p-carol', score: 5 },
    ])
    expect(result[0]).toMatchObject({ player_id: 'p-alice', player_session_position: 1 })
    expect(result[1]).toMatchObject({ player_id: 'p-bob', player_session_position: 2 })
    expect(result[2]).toMatchObject({ player_id: 'p-carol', player_session_position: 3 })
  })

  it('assigns the same position to tied players', () => {
    const result = rankPlayers([
      { player_id: 'p-alice', score: 10 },
      { player_id: 'p-bob', score: 10 },
    ])
    expect(result[0].player_session_position).toBe(1)
    expect(result[1].player_session_position).toBe(1)
  })

  it('skips positions after a tie (dense ranking: 1,1,3 not 1,1,2)', () => {
    const result = rankPlayers([
      { player_id: 'p-alice', score: 10 },
      { player_id: 'p-bob', score: 10 },
      { player_id: 'p-carol', score: 5 },
    ])
    expect(result[0].player_session_position).toBe(1)
    expect(result[1].player_session_position).toBe(1)
    expect(result[2].player_session_position).toBe(3)
  })

  it('handles all players tied', () => {
    const result = rankPlayers([
      { player_id: 'p-alice', score: 7 },
      { player_id: 'p-bob', score: 7 },
      { player_id: 'p-carol', score: 7 },
    ])
    for (const r of result) {
      expect(r.player_session_position).toBe(1)
    }
  })

  it('handles a 4-player mixed tie scenario (1,2,2,4)', () => {
    const result = rankPlayers([
      { player_id: 'p-alice', score: 100 },
      { player_id: 'p-bob', score: 90 },
      { player_id: 'p-carol', score: 90 },
      { player_id: 'p-dave', score: 80 },
    ])
    expect(result[0].player_session_position).toBe(1)
    expect(result[1].player_session_position).toBe(2)
    expect(result[2].player_session_position).toBe(2)
    expect(result[3].player_session_position).toBe(4)
  })

  it('does not mutate the input array', () => {
    const input = [
      { player_id: 'p-alice', score: 5 },
      { player_id: 'p-bob', score: 10 },
    ]
    const originalOrder = input.map((e) => e.player_id)
    rankPlayers(input)
    expect(input.map((e) => e.player_id)).toEqual(originalOrder)
  })

  it('preserves player_id on each ranked entry', () => {
    const result = rankPlayers([
      { player_id: 'p-alice', score: 10 },
      { player_id: 'p-bob', score: 8 },
    ])
    expect(result.map((r) => r.player_id)).toEqual(expect.arrayContaining(['p-alice', 'p-bob']))
  })
})

// ─── collectTraitInserts ─────────────────────────────────────────────────────

describe('collectTraitInserts', () => {
  it('builds one row per non-empty trait value', () => {
    const result = collectTraitInserts([
      {
        player_session_id: 'ps1',
        traitValues: [
          { trait_id: 't1', trait_value: 'Brute' },
          { trait_id: 't2', trait_value: '' },
        ],
      },
      {
        player_session_id: 'ps2',
        traitValues: [{ trait_id: 't1', trait_value: '  Spellweaver ' }],
      },
    ])
    expect(result).toEqual([
      { player_session_id: 'ps1', field_id: 't1', value: 'Brute' },
      { player_session_id: 'ps2', field_id: 't1', value: 'Spellweaver' },
    ])
  })

  it('returns an empty array when all trait values are blank', () => {
    expect(
      collectTraitInserts([
        { player_session_id: 'ps1', traitValues: [{ trait_id: 't1', trait_value: '   ' }] },
      ]),
    ).toEqual([])
  })
})
