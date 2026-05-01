import { SentimentLabel } from './constants'

export interface MovieDTO {
  id: string
  externalId: string
  title: string
  originalTitle?: string
  year: number
  posterUrl: string
  backdropUrl?: string
  overview: string
  genres: string[]
  language: string
  runtime?: number
  voteAverage?: number
}

export interface ReviewDTO {
  id: string
  externalId: string
  movieId: string
  author: string
  text: string
  rating?: number
  createdAt: string
}

export interface SentimentAnalysisDTO {
  id: string
  reviewId: string
  label: SentimentLabel
  confidenceScore: number
  positiveProb: number
  negativeProb: number
  neutralProb: number
  modelVersion: string
}

export interface MovieSentimentSummaryDTO {
  movieId: string
  totalReviews: number
  positiveCount: number
  negativeCount: number
  neutralCount: number
  averageConfidence: number
  hypeScore: number
  computedAt: string
}

export interface ReviewWithSentimentDTO extends ReviewDTO {
  analysis: SentimentAnalysisDTO | null
}

export interface TopReviewsDTO {
  topPositive: ReviewWithSentimentDTO[]
  topNegative: ReviewWithSentimentDTO[]
}

export interface DistributionBucket {
  label: SentimentLabel
  count: number
  percentage: number
}

export interface DistributionDTO {
  buckets: DistributionBucket[]
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
}
