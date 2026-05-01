export enum SentimentLabel {
  positive = 'positive',
  negative = 'negative',
  neutral = 'neutral',
}

export const SENTIMENT_COLORS = {
  [SentimentLabel.positive]: '#3ECF8E',
  [SentimentLabel.negative]: '#E5484D',
  [SentimentLabel.neutral]: '#6B7280',
} as const

export const BERT_MODEL_VERSION = 'bert-sim-v1'
export const DEFAULT_PAGE_SIZE = 20
export const MAX_TOP_REVIEWS = 10
