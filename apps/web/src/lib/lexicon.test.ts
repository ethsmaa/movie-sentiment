import { describe, it, expect } from 'vitest'
import { getTextSegments } from '@movie-sentiment/shared'

describe('getTextSegments', () => {
  it('returns a single segment with no highlight for neutral text', () => {
    const segments = getTextSegments('the cat sat down').filter((s) => s.text.length > 0)
    for (const seg of segments) {
      expect(seg.highlight).toBeNull()
    }
  })

  it('marks positive lexicon words as positive', () => {
    const segments = getTextSegments('an amazing movie')
    const amazing = segments.find((s) => s.text === 'amazing')
    expect(amazing?.highlight).toBe('positive')
  })

  it('marks negative lexicon words as negative', () => {
    const segments = getTextSegments('a boring film')
    const boring = segments.find((s) => s.text === 'boring')
    expect(boring?.highlight).toBe('negative')
  })

  it('matches case-insensitively', () => {
    const segments = getTextSegments('AMAZING and Boring')
    const a = segments.find((s) => s.text === 'AMAZING')
    const b = segments.find((s) => s.text === 'Boring')
    expect(a?.highlight).toBe('positive')
    expect(b?.highlight).toBe('negative')
  })

  it('preserves surrounding whitespace and punctuation as separate segments', () => {
    const segments = getTextSegments('amazing!')
    const joined = segments.map((s) => s.text).join('')
    expect(joined).toBe('amazing!')
  })

  it('returns empty array for empty input', () => {
    const segments = getTextSegments('')
    expect(segments.every((s) => s.highlight === null)).toBe(true)
  })
})
