import crypto from 'node:crypto'
import { SentimentLabel } from '@movie-sentiment/shared'
import {
  SENTIMENT_SERVICE_URL,
  SENTIMENT_BATCH_MAX,
  SENTIMENT_CACHE_MAX,
  POSITIVE_THRESHOLD,
  NEGATIVE_THRESHOLD,
} from '../lib/constants.js'

const MODEL_VERSION = 'distilbert-imdb-v1'

export interface BertResult {
  label: SentimentLabel
  confidenceScore: number
  positiveProb: number
  negativeProb: number
  neutralProb: number
  modelVersion: string
}

interface RemotePrediction {
  label: 'positive' | 'negative'
  confidence: number
  p_positive: number
  p_negative: number
}

interface RemoteBatchResponse {
  predictions: RemotePrediction[]
}

interface RemoteHealth {
  status: string
  model_loaded: boolean
}

const cache = new Map<string, BertResult>()

function cacheKey(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex')
}

function rememberCached(key: string, value: BertResult): void {
  if (cache.size >= SENTIMENT_CACHE_MAX) {
    // Evict the oldest entry — Map iteration is insertion-ordered.
    const oldest = cache.keys().next().value
    if (oldest !== undefined) cache.delete(oldest)
  }
  cache.set(key, value)
}

function mapToThreeClass(remote: RemotePrediction): BertResult {
  if (remote.p_positive >= POSITIVE_THRESHOLD) {
    return {
      label: SentimentLabel.positive,
      confidenceScore: remote.p_positive,
      positiveProb: remote.p_positive,
      negativeProb: remote.p_negative,
      neutralProb: 0,
      modelVersion: MODEL_VERSION,
    }
  }
  if (remote.p_positive <= NEGATIVE_THRESHOLD) {
    return {
      label: SentimentLabel.negative,
      confidenceScore: remote.p_negative,
      positiveProb: remote.p_positive,
      negativeProb: remote.p_negative,
      neutralProb: 0,
      modelVersion: MODEL_VERSION,
    }
  }
  // Neutral band: confidence peaks at p_positive=0.5 and decays toward the thresholds.
  const distanceFromCenter = Math.abs(remote.p_positive - 0.5)
  const neutralConfidence = 1 - 2 * distanceFromCenter
  return {
    label: SentimentLabel.neutral,
    confidenceScore: neutralConfidence,
    positiveProb: remote.p_positive,
    negativeProb: remote.p_negative,
    neutralProb: neutralConfidence,
    modelVersion: MODEL_VERSION,
  }
}

async function fetchBatch(texts: string[]): Promise<RemotePrediction[]> {
  const response = await fetch(`${SENTIMENT_SERVICE_URL}/predict/batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ texts }),
  })

  if (!response.ok) {
    throw new Error(
      `Sentiment service returned ${response.status} ${response.statusText}`,
    )
  }

  const data = (await response.json()) as RemoteBatchResponse
  if (!Array.isArray(data.predictions) || data.predictions.length !== texts.length) {
    throw new Error('Sentiment service returned malformed batch response')
  }
  return data.predictions
}

/**
 * Predict sentiment for many texts in a single round trip. Cached entries are
 * returned without hitting the service. Throws if the service is unreachable
 * or returns an unexpected shape — callers decide whether to fall back.
 */
export async function predictBatch(texts: string[]): Promise<BertResult[]> {
  const results = new Array<BertResult>(texts.length)
  const missingIndices: number[] = []
  const missingTexts: string[] = []

  texts.forEach((text, index) => {
    const cached = cache.get(cacheKey(text))
    if (cached) {
      results[index] = cached
    } else {
      missingIndices.push(index)
      missingTexts.push(text)
    }
  })

  // Chunk by SENTIMENT_BATCH_MAX so callers can hand us arbitrarily long lists.
  for (let offset = 0; offset < missingTexts.length; offset += SENTIMENT_BATCH_MAX) {
    const chunkTexts = missingTexts.slice(offset, offset + SENTIMENT_BATCH_MAX)
    const remotePreds = await fetchBatch(chunkTexts)

    remotePreds.forEach((remote, j) => {
      const text = chunkTexts[j]
      if (text === undefined) return
      const mapped = mapToThreeClass(remote)
      const targetIndex = missingIndices[offset + j]
      if (targetIndex !== undefined) {
        results[targetIndex] = mapped
      }
      rememberCached(cacheKey(text), mapped)
    })
  }

  return results
}

export async function predict(text: string): Promise<BertResult> {
  const [result] = await predictBatch([text])
  if (!result) throw new Error('predictBatch returned no result')
  return result
}

export interface ProgressiveStep {
  step: number
  tokenIndex: number
  prefixText: string
  pPositive: number
  pNegative: number
  label: 'positive' | 'negative'
  confidence: number
}

export interface ProgressiveTrajectory {
  totalTokens: number
  maxInputTokens: number
  steps: ProgressiveStep[]
}

interface RawProgressiveStep {
  step: number
  token_index: number
  prefix_text: string
  p_positive: number
  p_negative: number
  label: 'positive' | 'negative'
  confidence: number
}

interface RawProgressiveResponse {
  total_tokens: number
  max_input_tokens: number
  steps: RawProgressiveStep[]
}

/**
 * Run prefix inference for visualization. Always hits the live service —
 * trajectories are larger than single predictions and rarely repeat, so we
 * skip the cache. Throws on transport errors so callers can surface a
 * graceful failure to the UI.
 */
export async function predictProgressive(text: string): Promise<ProgressiveTrajectory> {
  const response = await fetch(`${SENTIMENT_SERVICE_URL}/predict/progressive`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  })

  if (!response.ok) {
    throw new Error(
      `Sentiment service /predict/progressive returned ${response.status} ${response.statusText}`,
    )
  }

  const raw = (await response.json()) as RawProgressiveResponse
  return {
    totalTokens: raw.total_tokens,
    maxInputTokens: raw.max_input_tokens,
    steps: raw.steps.map((s) => ({
      step: s.step,
      tokenIndex: s.token_index,
      prefixText: s.prefix_text,
      pPositive: s.p_positive,
      pNegative: s.p_negative,
      label: s.label,
      confidence: s.confidence,
    })),
  }
}

export async function health(): Promise<RemoteHealth> {
  const response = await fetch(`${SENTIMENT_SERVICE_URL}/health`)
  if (!response.ok) {
    throw new Error(`Health check returned ${response.status}`)
  }
  return (await response.json()) as RemoteHealth
}

// Exposed for tests so they can clear state between cases.
export function _clearCacheForTests(): void {
  cache.clear()
}

export const _internal = { mapToThreeClass, MODEL_VERSION }
