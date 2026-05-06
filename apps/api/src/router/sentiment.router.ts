import { router, publicProcedure } from '../trpc.js'
import {
  SentimentSummaryInputSchema,
  SentimentAnalyzeInputSchema,
  TopReviewsInputSchema,
  DistributionInputSchema,
  TopWordsInputSchema,
  ModelMetricsInputSchema,
  AnalyzeTextInputSchema,
} from '../schemas/sentiment.schema.js'
import { analyzeMovieSentiment } from '../services/sentiment.service.js'
import {
  predict as predictText,
  predictProgressive,
} from '../services/bert-client.js'
import { analyzeSentiment as simulatorAnalyze } from '../services/bert-simulator.js'
import { getTopWords, getModelMetrics } from '../services/analytics.service.js'
import { prisma } from '../lib/prisma.js'
import {
  SentimentLabel,
  type TopReviewsDTO,
  type DistributionDTO,
  type ReviewWithSentimentDTO,
} from '@movie-sentiment/shared'

function toReviewWithSentiment(review: {
  id: string
  externalId: string
  movieId: string
  author: string
  text: string
  rating: number | null
  createdAt: Date
  analysis: {
    id: string
    reviewId: string
    label: string
    confidenceScore: number
    positiveProb: number
    negativeProb: number
    neutralProb: number
    modelVersion: string
    createdAt: Date
  } | null
}): ReviewWithSentimentDTO {
  return {
    id: review.id,
    externalId: review.externalId,
    movieId: review.movieId,
    author: review.author,
    text: review.text,
    ...(review.rating !== null ? { rating: review.rating } : {}),
    createdAt: review.createdAt.toISOString(),
    analysis: review.analysis
      ? {
          id: review.analysis.id,
          reviewId: review.analysis.reviewId,
          label: review.analysis.label as SentimentLabel,
          confidenceScore: review.analysis.confidenceScore,
          positiveProb: review.analysis.positiveProb,
          negativeProb: review.analysis.negativeProb,
          neutralProb: review.analysis.neutralProb,
          modelVersion: review.analysis.modelVersion,
        }
      : null,
  }
}

export const sentimentRouter = router({
  summary: publicProcedure.input(SentimentSummaryInputSchema).query(async ({ input }) => {
    const summary = await prisma.movieSentimentSummary.findUniqueOrThrow({
      where: { movieId: input.movieId },
    })
    return {
      movieId: summary.movieId,
      totalReviews: summary.totalReviews,
      positiveCount: summary.positiveCount,
      negativeCount: summary.negativeCount,
      neutralCount: summary.neutralCount,
      averageConfidence: summary.averageConfidence,
      hypeScore: summary.hypeScore,
      computedAt: summary.computedAt.toISOString(),
    }
  }),

  analyze: publicProcedure.input(SentimentAnalyzeInputSchema).mutation(async ({ input }) => {
    return analyzeMovieSentiment(input.movieId, input.force)
  }),

  analyzeText: publicProcedure
    .input(AnalyzeTextInputSchema)
    .mutation(async ({ input }) => {
      // Try the trained model first, fall back to the lexicon simulator if the
      // sidecar is unreachable so the analyzer never breaks for a demo viewer.
      try {
        return await predictText(input.text)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'unknown error'
        console.warn(
          `[sentiment] analyzeText falling back to simulator (${message})`,
        )
        return simulatorAnalyze(input.text)
      }
    }),

  // Prediction trajectory — runs prefix inference for visualization. No
  // simulator fallback because the trajectory only makes sense with the real
  // model; if the sidecar is down we surface the error to the UI so it can
  // hide the playback button.
  analyzeProgressive: publicProcedure
    .input(AnalyzeTextInputSchema)
    .mutation(async ({ input }) => {
      return predictProgressive(input.text)
    }),

  topReviews: publicProcedure
    .input(TopReviewsInputSchema)
    .query(async ({ input }): Promise<TopReviewsDTO> => {
      const reviews = await prisma.review.findMany({
        where: { movieId: input.movieId },
        include: { analysis: true },
      })

      const withAnalysis = reviews
        .filter((r) => r.analysis !== null)
        .map(toReviewWithSentiment)

      const positiveReviews = withAnalysis
        .filter((r) => r.analysis?.label === SentimentLabel.positive)
        .sort((a, b) => (b.analysis?.confidenceScore ?? 0) - (a.analysis?.confidenceScore ?? 0))
        .slice(0, input.limit)

      const negativeReviews = withAnalysis
        .filter((r) => r.analysis?.label === SentimentLabel.negative)
        .sort((a, b) => (b.analysis?.confidenceScore ?? 0) - (a.analysis?.confidenceScore ?? 0))
        .slice(0, input.limit)

      return {
        topPositive: positiveReviews,
        topNegative: negativeReviews,
      }
    }),

  distribution: publicProcedure
    .input(DistributionInputSchema)
    .query(async ({ input }): Promise<DistributionDTO> => {
      const summary = await prisma.movieSentimentSummary.findUniqueOrThrow({
        where: { movieId: input.movieId },
      })

      const total = summary.totalReviews || 1

      return {
        buckets: [
          {
            label: SentimentLabel.positive,
            count: summary.positiveCount,
            percentage: Math.round((summary.positiveCount / total) * 100),
          },
          {
            label: SentimentLabel.negative,
            count: summary.negativeCount,
            percentage: Math.round((summary.negativeCount / total) * 100),
          },
          {
            label: SentimentLabel.neutral,
            count: summary.neutralCount,
            percentage: Math.round((summary.neutralCount / total) * 100),
          },
        ],
      }
    }),

  topWords: publicProcedure.input(TopWordsInputSchema).query(async ({ input }) => {
    return getTopWords(input.movieId, input.limit)
  }),

  modelMetrics: publicProcedure.input(ModelMetricsInputSchema).query(async () => {
    return getModelMetrics()
  }),
})
