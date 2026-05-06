import type { SentimentLabel } from './constants'

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

// --- Analytics types ---

export interface TopWord {
  word: string
  count: number
  /** 0–100, relative to the most frequent word in its group */
  relativeWeight: number
}

export interface TopWordsDTO {
  positive: TopWord[]
  negative: TopWord[]
  movieId?: string
}

export interface ClassMetrics {
  /** String label so the same DTO can carry binary or multi-class metrics */
  label: string
  precision: number
  recall: number
  f1: number
  /** Number of ground-truth samples for this class */
  support: number
}

export interface ConfusionMatrixDTO {
  /** Row = actual label, Col = predicted label */
  matrix: number[][]
  labels: string[]
}

export interface ModelTrainingInfo {
  base: string
  trainedOn: string
  numLabels: number
  labels: string[]
  maxLength: number
  epochs: number
  batchSize: number
  learningRate: number
  trainedAt: string
  trainingTimeSeconds: number
}

export interface ModelMetricsDTO {
  classMetrics: ClassMetrics[]
  weightedF1: number
  accuracy: number
  confusionMatrix: ConfusionMatrixDTO
  /** Reviews / samples evaluated on */
  sampleSize: number
  totalReviews: number
  /** Optional training metadata, present when metrics come from a trained model */
  modelInfo?: ModelTrainingInfo
}
