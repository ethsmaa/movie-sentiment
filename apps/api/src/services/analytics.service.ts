import type { ClassMetrics, ConfusionMatrixDTO, ModelMetricsDTO, TopWordsDTO } from '@movie-sentiment/shared'
import { NEGATIVE_WORDS, POSITIVE_WORDS, SentimentLabel } from '@movie-sentiment/shared'
import { prisma } from '../lib/prisma.js'

const LABELS = [SentimentLabel.positive, SentimentLabel.negative, SentimentLabel.neutral]
const POSITIVE_SET = new Set<string>(POSITIVE_WORDS)
const NEGATIVE_SET = new Set<string>(NEGATIVE_WORDS)

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s']/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 0)
}

function ratingToGroundTruth(rating: number): SentimentLabel {
  if (rating >= 7) return SentimentLabel.positive
  if (rating <= 3) return SentimentLabel.negative
  return SentimentLabel.neutral
}

export async function getTopWords(movieId?: string, limit = 10): Promise<TopWordsDTO> {
  const reviews = await prisma.review.findMany({
    ...(movieId ? { where: { movieId } } : {}),
    select: { text: true, analysis: { select: { label: true } } },
  })

  const positiveCounts = new Map<string, number>()
  const negativeCounts = new Map<string, number>()

  for (const review of reviews) {
    const label = review.analysis?.label as SentimentLabel | undefined
    if (!label) continue

    const tokens = tokenize(review.text)
    const seen = new Set<string>()

    for (const token of tokens) {
      if (seen.has(token)) continue
      seen.add(token)

      if (label === SentimentLabel.positive && POSITIVE_SET.has(token)) {
        positiveCounts.set(token, (positiveCounts.get(token) ?? 0) + 1)
      } else if (label === SentimentLabel.negative && NEGATIVE_SET.has(token)) {
        negativeCounts.set(token, (negativeCounts.get(token) ?? 0) + 1)
      }
    }
  }

  const toRanked = (map: Map<string, number>) => {
    const sorted = [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
    const max = sorted[0]?.[1] ?? 1
    return sorted.map(([word, count]) => ({
      word,
      count,
      relativeWeight: Math.round((count / max) * 100),
    }))
  }

  return {
    positive: toRanked(positiveCounts),
    negative: toRanked(negativeCounts),
    ...(movieId ? { movieId } : {}),
  }
}

export async function getModelMetrics(): Promise<ModelMetricsDTO> {
  const analyses = await prisma.sentimentAnalysis.findMany({
    include: { review: { select: { rating: true } } },
  })

  const withRating = analyses.filter((a) => a.review.rating !== null)
  const sampleSize = withRating.length
  const totalReviews = analyses.length

  // 3×3 confusion matrix: matrix[actualIdx][predictedIdx]
  const matrix: number[][] = LABELS.map(() => LABELS.map(() => 0))

  for (const analysis of withRating) {
    const rating = analysis.review.rating ?? 5
    const actual = ratingToGroundTruth(rating)
    const predicted = analysis.label as SentimentLabel

    const actualIdx = LABELS.indexOf(actual)
    const predictedIdx = LABELS.indexOf(predicted)
    if (actualIdx !== -1 && predictedIdx !== -1) {
      const row = matrix[actualIdx]
      if (row) {
        row[predictedIdx] = (row[predictedIdx] ?? 0) + 1
      }
    }
  }

  const classMetrics: ClassMetrics[] = LABELS.map((label, i) => {
    const tp = matrix[i]?.[i] ?? 0
    const fp = LABELS.reduce((sum, _, j) => (j !== i ? sum + (matrix[j]?.[i] ?? 0) : sum), 0)
    const fn = LABELS.reduce((sum, _, j) => (j !== i ? sum + (matrix[i]?.[j] ?? 0) : sum), 0)
    const support = (matrix[i] ?? []).reduce((a: number, b: number) => a + b, 0)

    const precision = tp + fp > 0 ? tp / (tp + fp) : 0
    const recall = tp + fn > 0 ? tp / (tp + fn) : 0
    const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0

    return { label, precision, recall, f1, support }
  })

  const totalSupport = classMetrics.reduce((s, m) => s + m.support, 0)
  const weightedF1 =
    totalSupport > 0
      ? classMetrics.reduce((s, m) => s + m.f1 * m.support, 0) / totalSupport
      : 0

  const correctPredictions = LABELS.reduce((s, _, i) => s + (matrix[i]?.[i] ?? 0), 0)
  const accuracy = sampleSize > 0 ? correctPredictions / sampleSize : 0

  const confusionMatrix: ConfusionMatrixDTO = { matrix, labels: LABELS }

  return {
    classMetrics,
    weightedF1,
    accuracy,
    confusionMatrix,
    sampleSize,
    totalReviews,
  }
}
