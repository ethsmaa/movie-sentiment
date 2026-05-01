import { SentimentLabel } from '@movie-sentiment/shared'
import { POSITIVE_WORDS, NEGATIVE_WORDS, NEGATION_WORDS, NEGATION_WINDOW } from '../lib/constants.js'

const BERT_MODEL_VERSION_LOCAL = 'bert-sim-v1'

const POSITIVE_SET = new Set<string>(POSITIVE_WORDS)
const NEGATIVE_SET = new Set<string>(NEGATIVE_WORDS)
const NEGATION_SET = new Set<string>(NEGATION_WORDS)

export interface BertResult {
  label: SentimentLabel
  confidenceScore: number
  positiveProb: number
  negativeProb: number
  neutralProb: number
  modelVersion: string
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s']/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 0)
}

function softmax(scores: [number, number, number]): [number, number, number] {
  const max = Math.max(...scores)
  const exps = scores.map((s) => Math.exp(s - max)) as [number, number, number]
  const sum = exps.reduce((a, b) => a + b, 0)
  return exps.map((e) => e / sum) as [number, number, number]
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function analyzeSentiment(text: string, rating?: number): BertResult {
  const tokens = tokenize(text)
  let positiveScore = 0
  let negativeScore = 0

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]
    if (!token) continue

    const isNegated = tokens
      .slice(Math.max(0, i - NEGATION_WINDOW), i)
      .some((t) => NEGATION_SET.has(t))

    if (POSITIVE_SET.has(token)) {
      if (isNegated) {
        negativeScore += 1.5
      } else {
        positiveScore += 1.5
      }
    } else if (NEGATIVE_SET.has(token)) {
      if (isNegated) {
        positiveScore += 1.2
      } else {
        negativeScore += 1.5
      }
    }
  }

  // Base neutral score to prevent extreme distributions
  const neutralScore = 0.5 + tokens.length * 0.02

  const [positiveProb, negativeProb, neutralProb] = softmax([
    positiveScore,
    negativeScore,
    neutralScore,
  ])

  let label: SentimentLabel
  let confidenceScore: number

  if (positiveProb >= negativeProb && positiveProb >= neutralProb) {
    label = SentimentLabel.positive
    confidenceScore = positiveProb
  } else if (negativeProb >= positiveProb && negativeProb >= neutralProb) {
    label = SentimentLabel.negative
    confidenceScore = negativeProb
  } else {
    label = SentimentLabel.neutral
    confidenceScore = neutralProb
  }

  // Rating boost: extreme ratings increase confidence
  if (rating !== undefined) {
    if (rating <= 2.0 || rating >= 9.0) {
      confidenceScore = clamp(confidenceScore + 0.1, 0, 0.99)
    }
  }

  // Ensure confidence is within [0.50, 0.99]
  confidenceScore = clamp(confidenceScore, 0.5, 0.99)

  return {
    label,
    confidenceScore,
    positiveProb,
    negativeProb,
    neutralProb,
    modelVersion: BERT_MODEL_VERSION_LOCAL,
  }
}
