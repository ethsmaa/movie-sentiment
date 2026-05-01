import { describe, it, expect } from 'vitest'
import { analyzeSentiment } from '../bert-simulator.js'
import { SentimentLabel } from '@movie-sentiment/shared'

describe('analyzeSentiment', () => {
  it('returns positive label for clearly positive text', () => {
    const result = analyzeSentiment('This is an absolutely amazing and fantastic masterpiece!')
    expect(result.label).toBe(SentimentLabel.positive)
    expect(result.confidenceScore).toBeGreaterThanOrEqual(0.5)
  })

  it('returns negative label for clearly negative text', () => {
    const result = analyzeSentiment('This is terrible and horrible. Worst movie ever. I hate it.')
    expect(result.label).toBe(SentimentLabel.negative)
    expect(result.confidenceScore).toBeGreaterThanOrEqual(0.5)
  })

  it('gives confidence boost for extreme ratings (>= 9.0)', () => {
    const withRating = analyzeSentiment('Amazing movie I loved it', 9.5)
    const withoutRating = analyzeSentiment('Amazing movie I loved it')
    expect(withRating.confidenceScore).toBeGreaterThanOrEqual(withoutRating.confidenceScore)
  })

  it('gives confidence boost for extreme ratings (<= 2.0)', () => {
    const withRating = analyzeSentiment('Terrible boring waste of time', 1.5)
    const withoutRating = analyzeSentiment('Terrible boring waste of time')
    expect(withRating.confidenceScore).toBeGreaterThanOrEqual(withoutRating.confidenceScore)
  })

  it('handles negation correctly', () => {
    const positive = analyzeSentiment('This is amazing')
    const negated = analyzeSentiment('This is not amazing')
    expect(positive.label).toBe(SentimentLabel.positive)
    expect(negated.label).not.toBe(SentimentLabel.positive)
  })

  it('is deterministic - same input produces same output', () => {
    const text = 'Great film with excellent performances'
    const result1 = analyzeSentiment(text, 8)
    const result2 = analyzeSentiment(text, 8)
    expect(result1).toEqual(result2)
  })

  it('confidence score is always between 0.5 and 0.99', () => {
    const texts = [
      'good',
      'bad',
      '',
      'amazing fantastic wonderful brilliant',
      'terrible horrible disgusting awful',
    ]
    texts.forEach((text) => {
      const result = analyzeSentiment(text)
      expect(result.confidenceScore).toBeGreaterThanOrEqual(0.5)
      expect(result.confidenceScore).toBeLessThanOrEqual(0.99)
    })
  })

  it('probabilities sum to approximately 1', () => {
    const result = analyzeSentiment('This movie is quite good overall')
    const sum = result.positiveProb + result.negativeProb + result.neutralProb
    expect(sum).toBeCloseTo(1, 5)
  })

  it('returns correct model version', () => {
    const result = analyzeSentiment('test')
    expect(result.modelVersion).toBe('bert-sim-v1')
  })
})
