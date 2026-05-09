import { prisma } from '../lib/prisma.js'
import { analyzeSentiment } from './bert-simulator.js'
import { predictBatch, type BertResult } from './bert-client.js'
import { SentimentLabel, type MovieSentimentSummaryDTO } from '@movie-sentiment/shared'
import type { SentimentLabel as PrismaSentimentLabel } from '@prisma/client'

// Strict mode (default ON): if the FastAPI / DistilBERT sidecar is unreachable
// we refuse to fall back to the lexicon simulator and raise a loud error.
// This guarantees that every sentiment label stored in the database came from
// the real fine-tuned model — never the lexicon stand-in.
//
// Set BERT_STRICT=false (e.g. in tests) to re-enable the lexicon fallback.
const STRICT_BERT = process.env.BERT_STRICT !== 'false'

async function inferReviews(
  reviews: Array<{ text: string; rating: number | null }>,
): Promise<BertResult[]> {
  if (reviews.length === 0) return []
  try {
    return await predictBatch(reviews.map((r) => r.text))
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown error'
    if (STRICT_BERT) {
      throw new Error(
        `[sentiment] FastAPI sidecar unreachable (${message}). ` +
          `BERT_STRICT is on — refusing to fall back to the lexicon simulator. ` +
          `Start the sidecar (services/sentiment) or set BERT_STRICT=false to allow fallback.`,
      )
    }
    console.warn(
      `[sentiment] FastAPI sidecar unreachable (${message}); falling back to local simulator (BERT_STRICT=false)`,
    )
    return reviews.map((r) => analyzeSentiment(r.text, r.rating ?? undefined))
  }
}

export async function analyzeMovieSentiment(
  movieId: string,
  force: boolean,
): Promise<MovieSentimentSummaryDTO> {
  const existing = await prisma.movieSentimentSummary.findUnique({
    where: { movieId },
  })

  if (existing && !force) {
    return {
      movieId: existing.movieId,
      totalReviews: existing.totalReviews,
      positiveCount: existing.positiveCount,
      negativeCount: existing.negativeCount,
      neutralCount: existing.neutralCount,
      averageConfidence: existing.averageConfidence,
      hypeScore: existing.hypeScore,
      computedAt: existing.computedAt.toISOString(),
    }
  }

  const reviews = await prisma.review.findMany({
    where: { movieId },
    include: { analysis: true },
  })

  const inferenceResults = await inferReviews(reviews)

  const analysisResults = await Promise.all(
    reviews.map(async (review, index) => {
      const result = inferenceResults[index]
      if (!result) {
        throw new Error(`Missing inference for review ${review.id}`)
      }
      const prismaLabel = result.label as unknown as PrismaSentimentLabel

      await prisma.sentimentAnalysis.upsert({
        where: { reviewId: review.id },
        create: {
          reviewId: review.id,
          label: prismaLabel,
          confidenceScore: result.confidenceScore,
          positiveProb: result.positiveProb,
          negativeProb: result.negativeProb,
          neutralProb: result.neutralProb,
          modelVersion: result.modelVersion,
        },
        update: {
          label: prismaLabel,
          confidenceScore: result.confidenceScore,
          positiveProb: result.positiveProb,
          negativeProb: result.negativeProb,
          neutralProb: result.neutralProb,
          modelVersion: result.modelVersion,
        },
      })

      return result
    }),
  )

  const positiveCount = analysisResults.filter((r) => r.label === SentimentLabel.positive).length
  const negativeCount = analysisResults.filter((r) => r.label === SentimentLabel.negative).length
  const neutralCount = analysisResults.filter((r) => r.label === SentimentLabel.neutral).length
  const totalReviews = analysisResults.length
  const averageConfidence =
    totalReviews > 0
      ? analysisResults.reduce((sum, r) => sum + r.confidenceScore, 0) / totalReviews
      : 0
  const hypeScore =
    totalReviews > 0 ? (positiveCount - negativeCount) / totalReviews : 0

  const computedAt = new Date()

  await prisma.movieSentimentSummary.upsert({
    where: { movieId },
    create: {
      movieId,
      totalReviews,
      positiveCount,
      negativeCount,
      neutralCount,
      averageConfidence,
      hypeScore,
      computedAt,
    },
    update: {
      totalReviews,
      positiveCount,
      negativeCount,
      neutralCount,
      averageConfidence,
      hypeScore,
      computedAt,
    },
  })

  return {
    movieId,
    totalReviews,
    positiveCount,
    negativeCount,
    neutralCount,
    averageConfidence,
    hypeScore,
    computedAt: computedAt.toISOString(),
  }
}
