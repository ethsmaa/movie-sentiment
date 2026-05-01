import { z } from 'zod'

export const SentimentSummaryInputSchema = z.object({
  movieId: z.string().min(1),
})

export const SentimentAnalyzeInputSchema = z.object({
  movieId: z.string().min(1),
  force: z.boolean().default(false),
})

export const TopReviewsInputSchema = z.object({
  movieId: z.string().min(1),
  limit: z.number().int().min(1).max(20).default(5),
})

export const DistributionInputSchema = z.object({
  movieId: z.string().min(1),
})
