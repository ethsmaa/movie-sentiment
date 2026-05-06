/**
 * Reads the training-time metrics produced by the Phase 1 notebook.
 *
 * The source of truth for model accuracy / F1 / confusion matrix / corpus
 * top-words is `ml/metrics.json` at the repo root. That file is committed,
 * regenerated whenever the model is retrained, and shaped to match the
 * existing ModelMetricsDTO so the frontend doesn't need to fork.
 *
 * Read once at module load; the file is only ~4 KB.
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type {
  ClassMetrics,
  ConfusionMatrixDTO,
  ModelMetricsDTO,
  ModelTrainingInfo,
  TopWord,
  TopWordsDTO,
} from '@movie-sentiment/shared'

interface RawMetricsFile {
  model: {
    base: string
    trained_on: string
    num_labels: number
    labels: string[]
    max_length: number
    epochs: number
    batch_size: number
    learning_rate: number
    trained_at: string
    training_time_seconds: number
  }
  eval: {
    accuracy: number
    weightedF1: number
    weightedPrecision: number
    weightedRecall: number
    sampleSize: number
    totalReviews: number
    classMetrics: ClassMetrics[]
    confusionMatrix: ConfusionMatrixDTO
  }
  topWords: {
    positive: Array<{ word: string; score: number }>
    negative: Array<{ word: string; score: number }>
  }
}

const here = path.dirname(fileURLToPath(import.meta.url))
const METRICS_JSON_PATH = path.resolve(here, '../../../../ml/metrics.json')

let cached: RawMetricsFile | null = null

function loadRaw(): RawMetricsFile {
  if (cached) return cached
  const raw = readFileSync(METRICS_JSON_PATH, 'utf-8')
  cached = JSON.parse(raw) as RawMetricsFile
  return cached
}

function toTopWords(input: Array<{ word: string; score: number }>, limit: number): TopWord[] {
  const top = input.slice(0, limit)
  const max = top[0]?.score ?? 1
  return top.map(({ word, score }) => ({
    word,
    count: 0,
    relativeWeight: max > 0 ? Math.round((score / max) * 100) : 0,
  }))
}

function toModelInfo(model: RawMetricsFile['model']): ModelTrainingInfo {
  return {
    base: model.base,
    trainedOn: model.trained_on,
    numLabels: model.num_labels,
    labels: model.labels,
    maxLength: model.max_length,
    epochs: model.epochs,
    batchSize: model.batch_size,
    learningRate: model.learning_rate,
    trainedAt: model.trained_at,
    trainingTimeSeconds: model.training_time_seconds,
  }
}

export function getTrainedModelMetrics(): ModelMetricsDTO {
  const raw = loadRaw()
  return {
    classMetrics: raw.eval.classMetrics,
    weightedF1: raw.eval.weightedF1,
    accuracy: raw.eval.accuracy,
    confusionMatrix: raw.eval.confusionMatrix,
    sampleSize: raw.eval.sampleSize,
    totalReviews: raw.eval.totalReviews,
    modelInfo: toModelInfo(raw.model),
  }
}

export function getCorpusTopWords(limit = 10): TopWordsDTO {
  const raw = loadRaw()
  return {
    positive: toTopWords(raw.topWords.positive, limit),
    negative: toTopWords(raw.topWords.negative, limit),
  }
}
