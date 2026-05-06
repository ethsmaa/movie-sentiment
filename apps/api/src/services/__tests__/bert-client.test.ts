import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { SentimentLabel } from '@movie-sentiment/shared'
import {
  predict,
  predictBatch,
  health,
  _clearCacheForTests,
} from '../bert-client.js'

interface RemotePrediction {
  label: 'positive' | 'negative'
  confidence: number
  p_positive: number
  p_negative: number
}

function mockBatchResponse(predictions: RemotePrediction[]): Response {
  return new Response(JSON.stringify({ predictions }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

function mockHealthResponse(payload: object): Response {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('bert-client', () => {
  const fetchMock = vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>()
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    _clearCacheForTests()
    fetchMock.mockReset()
    globalThis.fetch = fetchMock as unknown as typeof fetch
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  // Local alias for readability — tests below were written against `fetchSpy`.
  const fetchSpy = fetchMock

  describe('threshold mapping (binary → 3-class)', () => {
    it('maps p_positive >= 0.65 to positive', async () => {
      fetchSpy.mockResolvedValue(
        mockBatchResponse([
          { label: 'positive', confidence: 0.9, p_positive: 0.9, p_negative: 0.1 },
        ]),
      )
      const result = await predict('great movie')
      expect(result.label).toBe(SentimentLabel.positive)
      expect(result.confidenceScore).toBe(0.9)
      expect(result.neutralProb).toBe(0)
    })

    it('maps p_positive <= 0.35 to negative', async () => {
      fetchSpy.mockResolvedValue(
        mockBatchResponse([
          { label: 'negative', confidence: 0.95, p_positive: 0.05, p_negative: 0.95 },
        ]),
      )
      const result = await predict('terrible')
      expect(result.label).toBe(SentimentLabel.negative)
      expect(result.confidenceScore).toBe(0.95)
      expect(result.neutralProb).toBe(0)
    })

    it('maps p_positive between 0.35 and 0.65 to neutral', async () => {
      fetchSpy.mockResolvedValue(
        mockBatchResponse([
          { label: 'positive', confidence: 0.5, p_positive: 0.5, p_negative: 0.5 },
        ]),
      )
      const result = await predict('mixed feelings')
      expect(result.label).toBe(SentimentLabel.neutral)
      // Confidence peaks at p_positive=0.5
      expect(result.confidenceScore).toBeCloseTo(1.0, 5)
      expect(result.neutralProb).toBeCloseTo(1.0, 5)
    })

    it('respects exact threshold boundary (>= 0.65)', async () => {
      fetchSpy.mockResolvedValue(
        mockBatchResponse([
          { label: 'positive', confidence: 0.65, p_positive: 0.65, p_negative: 0.35 },
        ]),
      )
      const result = await predict('borderline')
      expect(result.label).toBe(SentimentLabel.positive)
    })

    it('respects exact threshold boundary (<= 0.35)', async () => {
      fetchSpy.mockResolvedValue(
        mockBatchResponse([
          { label: 'negative', confidence: 0.65, p_positive: 0.35, p_negative: 0.65 },
        ]),
      )
      const result = await predict('borderline')
      expect(result.label).toBe(SentimentLabel.negative)
    })
  })

  describe('caching', () => {
    it('returns cached predictions without re-hitting the service', async () => {
      fetchSpy.mockResolvedValue(
        mockBatchResponse([
          { label: 'positive', confidence: 0.9, p_positive: 0.9, p_negative: 0.1 },
        ]),
      )
      await predict('great movie')
      await predict('great movie')
      expect(fetchSpy).toHaveBeenCalledTimes(1)
    })

    it('only fetches missing items in a batch request', async () => {
      fetchSpy.mockResolvedValueOnce(
        mockBatchResponse([
          { label: 'positive', confidence: 0.9, p_positive: 0.9, p_negative: 0.1 },
        ]),
      )
      await predict('great')

      fetchSpy.mockResolvedValueOnce(
        mockBatchResponse([
          { label: 'negative', confidence: 0.9, p_positive: 0.1, p_negative: 0.9 },
        ]),
      )
      const results = await predictBatch(['great', 'awful'])
      expect(results).toHaveLength(2)
      expect(results[0]?.label).toBe(SentimentLabel.positive)
      expect(results[1]?.label).toBe(SentimentLabel.negative)
      // Second call only requested the uncached "awful"
      const secondCall = fetchSpy.mock.calls[1]
      const secondCallBody = String(secondCall?.[1]?.body ?? '')
      expect(JSON.parse(secondCallBody)).toEqual({ texts: ['awful'] })
    })
  })

  describe('error handling', () => {
    it('throws on non-2xx responses', async () => {
      fetchSpy.mockResolvedValue(
        new Response('boom', { status: 503, statusText: 'Service Unavailable' }),
      )
      await expect(predict('anything')).rejects.toThrow(/503/)
    })

    it('throws on malformed batch response', async () => {
      fetchSpy.mockResolvedValue(
        new Response(JSON.stringify({ predictions: [] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      await expect(predict('anything')).rejects.toThrow(/malformed/)
    })

    it('propagates network errors', async () => {
      fetchSpy.mockRejectedValue(new Error('ECONNREFUSED'))
      await expect(predict('anything')).rejects.toThrow(/ECONNREFUSED/)
    })
  })

  describe('health()', () => {
    it('returns parsed JSON on 200', async () => {
      fetchSpy.mockResolvedValue(
        mockHealthResponse({ status: 'ok', model_loaded: true }),
      )
      const result = await health()
      expect(result.status).toBe('ok')
      expect(result.model_loaded).toBe(true)
    })

    it('throws on non-2xx', async () => {
      fetchSpy.mockResolvedValue(new Response('', { status: 500 }))
      await expect(health()).rejects.toThrow(/500/)
    })
  })

  describe('chunking', () => {
    it('splits batches larger than the service limit into multiple requests', async () => {
      // Build 130 unique texts so the cache misses all of them, forcing two requests of 64 + 64 + 2.
      const texts = Array.from({ length: 130 }, (_, i) => `unique-text-${i}`)
      fetchMock.mockImplementation(async (_url, init) => {
        const body = String(init?.body ?? '')
        const parsed = JSON.parse(body) as { texts: string[] }
        return mockBatchResponse(
          parsed.texts.map(() => ({
            label: 'positive' as const,
            confidence: 0.9,
            p_positive: 0.9,
            p_negative: 0.1,
          })),
        )
      })

      const results = await predictBatch(texts)
      expect(results).toHaveLength(130)
      expect(fetchSpy).toHaveBeenCalledTimes(3)
    })
  })
})
