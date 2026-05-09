import { describe, it, expect } from 'vitest'
import {
  cn,
  formatRuntime,
  hypePercentage,
  hypeLabel,
  tapeColor,
  TAPE_COLORS,
} from './utils'

describe('cn', () => {
  it('merges tailwind class names without duplication', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4')
  })

  it('filters out falsy values', () => {
    expect(cn('a', false && 'b', null, undefined, 'c')).toBe('a c')
  })

  it('returns empty string for no input', () => {
    expect(cn()).toBe('')
  })
})

describe('formatRuntime', () => {
  it('formats hours and minutes when over 60 minutes', () => {
    expect(formatRuntime(125)).toBe('2h 5m')
  })

  it('formats minutes only when under an hour', () => {
    expect(formatRuntime(45)).toBe('45m')
  })

  it('formats exactly 60 minutes as 1h 0m', () => {
    expect(formatRuntime(60)).toBe('1h 0m')
  })

  it('handles zero runtime', () => {
    expect(formatRuntime(0)).toBe('0m')
  })
})

describe('hypePercentage', () => {
  it('maps a hype score of -1 to 0%', () => {
    expect(hypePercentage(-1)).toBe(0)
  })

  it('maps a hype score of 0 to 50%', () => {
    expect(hypePercentage(0)).toBe(50)
  })

  it('maps a hype score of 1 to 100%', () => {
    expect(hypePercentage(1)).toBe(100)
  })

  it('rounds intermediate values to integer percentages', () => {
    expect(hypePercentage(0.5)).toBe(75)
    expect(hypePercentage(-0.5)).toBe(25)
  })
})

describe('hypeLabel', () => {
  it.each([
    [95, 'OVERWHELMINGLY POSITIVE'],
    [80, 'OVERWHELMINGLY POSITIVE'],
    [70, 'MOSTLY POSITIVE'],
    [65, 'MOSTLY POSITIVE'],
    [55, 'SLIGHTLY POSITIVE'],
    [50, 'SLIGHTLY POSITIVE'],
    [40, 'MIXED SIGNALS'],
    [35, 'MIXED SIGNALS'],
    [25, 'MOSTLY NEGATIVE'],
    [20, 'MOSTLY NEGATIVE'],
    [10, 'OVERWHELMINGLY NEGATIVE'],
    [0, 'OVERWHELMINGLY NEGATIVE'],
  ])('labels %i percent as "%s"', (pct, expected) => {
    expect(hypeLabel(pct)).toBe(expected)
  })
})

describe('tapeColor', () => {
  it('returns the first color for index 0', () => {
    expect(tapeColor(0)).toBe(TAPE_COLORS[0])
  })

  it('cycles back to the first color after the last', () => {
    expect(tapeColor(TAPE_COLORS.length)).toBe(TAPE_COLORS[0])
  })

  it('returns a stable color for any non-negative index', () => {
    for (let i = 0; i < 20; i++) {
      expect(TAPE_COLORS).toContain(tapeColor(i))
    }
  })
})
