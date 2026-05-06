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

export const TopWordsInputSchema = z.object({
  movieId: z.string().min(1).optional(),
  limit: z.number().int().min(1).max(30).default(10),
})

export const ModelMetricsInputSchema = z.object({})

export const AnalyzeTextInputSchema = z.object({
  text: z.string().min(1).max(10_000),
})
