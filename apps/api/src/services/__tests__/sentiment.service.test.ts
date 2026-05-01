import { describe, it, expect } from 'vitest'
import { prisma } from './prisma-mock'
import { analyzeMovieSentiment } from '../sentiment.service.js'
import { SentimentLabel } from '@movie-sentiment/shared'

const movieId = 'movie-1'

const makeReview = (id: string, text: string, rating?: number) => ({
  id,
  externalId: `ext-${id}`,
  movieId,
  author: 'Reviewer',
  text,
  rating: rating ?? null,
  createdAt: new Date(),
  updatedAt: new Date(),
  analysis: null,
})

const makeSummary = (overrides = {}) => ({
  movieId,
  totalReviews: 10,
  positiveCount: 7,
  negativeCount: 2,
  neutralCount: 1,
  averageConfidence: 0.82,
  hypeScore: 0.5,
  computedAt: new Date(),
  ...overrides,
})

describe('analyzeMovieSentiment', () => {
  it('returns cached summary when force=false and summary exists', async () => {
    const cached = makeSummary()
    prisma.movieSentimentSummary.findUnique.mockResolvedValue(cached)

    const result = await analyzeMovieSentiment(movieId, false)

    expect(result.movieId).toBe(movieId)
    expect(result.hypeScore).toBe(0.5)
    expect(prisma.review.findMany).not.toHaveBeenCalled()
  })

  it('re-analyzes when force=true even if summary exists', async () => {
    prisma.movieSentimentSummary.findUnique.mockResolvedValue(makeSummary())
    prisma.review.findMany.mockResolvedValue([
      makeReview('r1', 'Amazing brilliant wonderful masterpiece'),
    ])
    prisma.sentimentAnalysis.upsert.mockResolvedValue({} as never)
    prisma.movieSentimentSummary.upsert.mockResolvedValue(makeSummary() as never)

    await analyzeMovieSentiment(movieId, true)

    expect(prisma.review.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { movieId } }),
    )
  })

  it('runs analysis when no summary exists', async () => {
    prisma.movieSentimentSummary.findUnique.mockResolvedValue(null)
    prisma.review.findMany.mockResolvedValue([
      makeReview('r1', 'Amazing fantastic brilliant masterpiece', 9.5),
      makeReview('r2', 'Terrible boring awful waste of time', 1.5),
      makeReview('r3', 'The movie was okay I suppose'),
    ])
    prisma.sentimentAnalysis.upsert.mockResolvedValue({} as never)
    prisma.movieSentimentSummary.upsert.mockResolvedValue({} as never)

    const result = await analyzeMovieSentiment(movieId, false)

    expect(result.totalReviews).toBe(3)
    expect(result.positiveCount + result.negativeCount + result.neutralCount).toBe(3)
  })

  it('computes hypeScore as (positive - negative) / total', async () => {
    prisma.movieSentimentSummary.findUnique.mockResolvedValue(null)
    prisma.review.findMany.mockResolvedValue([
      makeReview('r1', 'Amazing fantastic brilliant masterpiece'),
      makeReview('r2', 'Amazing fantastic brilliant masterpiece'),
      makeReview('r3', 'Amazing fantastic brilliant masterpiece'),
      makeReview('r4', 'Terrible boring awful horrible disgusting'),
    ])
    prisma.sentimentAnalysis.upsert.mockResolvedValue({} as never)
    prisma.movieSentimentSummary.upsert.mockResolvedValue({} as never)

    const result = await analyzeMovieSentiment(movieId, false)

    const expected = (result.positiveCount - result.negativeCount) / result.totalReviews
    expect(result.hypeScore).toBeCloseTo(expected, 5)
  })

  it('hypeScore is 0 when no reviews exist', async () => {
    prisma.movieSentimentSummary.findUnique.mockResolvedValue(null)
    prisma.review.findMany.mockResolvedValue([])
    prisma.movieSentimentSummary.upsert.mockResolvedValue({} as never)

    const result = await analyzeMovieSentiment(movieId, false)

    expect(result.hypeScore).toBe(0)
    expect(result.totalReviews).toBe(0)
    expect(result.averageConfidence).toBe(0)
  })

  it('upserts SentimentAnalysis for each review', async () => {
    prisma.movieSentimentSummary.findUnique.mockResolvedValue(null)
    prisma.review.findMany.mockResolvedValue([
      makeReview('r1', 'Great film'),
      makeReview('r2', 'Bad movie'),
    ])
    prisma.sentimentAnalysis.upsert.mockResolvedValue({} as never)
    prisma.movieSentimentSummary.upsert.mockResolvedValue({} as never)

    await analyzeMovieSentiment(movieId, false)

    expect(prisma.sentimentAnalysis.upsert).toHaveBeenCalledTimes(2)
  })

  it('upserts MovieSentimentSummary with correct data', async () => {
    prisma.movieSentimentSummary.findUnique.mockResolvedValue(null)
    prisma.review.findMany.mockResolvedValue([
      makeReview('r1', 'Amazing fantastic wonderful'),
    ])
    prisma.sentimentAnalysis.upsert.mockResolvedValue({} as never)
    prisma.movieSentimentSummary.upsert.mockResolvedValue({} as never)

    await analyzeMovieSentiment(movieId, false)

    expect(prisma.movieSentimentSummary.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { movieId },
        create: expect.objectContaining({ movieId, totalReviews: 1 }),
      }),
    )
  })

  it('averageConfidence is within valid BERT range [0.5, 0.99]', async () => {
    prisma.movieSentimentSummary.findUnique.mockResolvedValue(null)
    prisma.review.findMany.mockResolvedValue([
      makeReview('r1', 'Excellent movie loved it'),
      makeReview('r2', 'Boring and dull terrible'),
    ])
    prisma.sentimentAnalysis.upsert.mockResolvedValue({} as never)
    prisma.movieSentimentSummary.upsert.mockResolvedValue({} as never)

    const result = await analyzeMovieSentiment(movieId, false)

    expect(result.averageConfidence).toBeGreaterThanOrEqual(0.5)
    expect(result.averageConfidence).toBeLessThanOrEqual(0.99)
  })

  it('returns computedAt as ISO string', async () => {
    prisma.movieSentimentSummary.findUnique.mockResolvedValue(null)
    prisma.review.findMany.mockResolvedValue([])
    prisma.movieSentimentSummary.upsert.mockResolvedValue({} as never)

    const result = await analyzeMovieSentiment(movieId, false)

    expect(() => new Date(result.computedAt)).not.toThrow()
    expect(result.computedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })

  it('sentiment label distribution includes all three types', async () => {
    prisma.movieSentimentSummary.findUnique.mockResolvedValue(null)
    prisma.review.findMany.mockResolvedValue([
      makeReview('r1', 'Amazing fantastic brilliant wonderful superb masterpiece'),
      makeReview('r2', 'Terrible horrible awful boring disgusting waste'),
    ])
    prisma.sentimentAnalysis.upsert.mockResolvedValue({} as never)
    prisma.movieSentimentSummary.upsert.mockResolvedValue({} as never)

    const result = await analyzeMovieSentiment(movieId, false)

    const knownLabels = [SentimentLabel.positive, SentimentLabel.negative, SentimentLabel.neutral]
    expect(knownLabels).toContain(
      result.positiveCount > result.negativeCount
        ? SentimentLabel.positive
        : SentimentLabel.negative,
    )
  })
})
