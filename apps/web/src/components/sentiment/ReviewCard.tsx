import type { ReviewWithSentimentDTO } from '@movie-sentiment/shared'
import { SentimentLabelBadge } from './SentimentLabelBadge'
import { SENTIMENT_COLORS } from '@movie-sentiment/shared'
import { User } from 'lucide-react'

interface ReviewCardProps {
  review: ReviewWithSentimentDTO
}

export function ReviewCard({ review }: ReviewCardProps) {
  const label = review.analysis?.label
  const confidence = review.analysis?.confidenceScore
  const borderColor = label ? SENTIMENT_COLORS[label] : '#1E2440'

  return (
    <div
      className="flex flex-col gap-3 rounded-xl border bg-card/50 p-4 transition-all duration-200"
      style={{ borderColor: `${borderColor}40` }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-background">
            <User className="h-3.5 w-3.5 text-text-muted" />
          </div>
          <span className="text-sm font-medium text-text-primary">{review.author}</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {review.rating && (
            <span className="text-xs text-text-muted">{review.rating.toFixed(1)}/10</span>
          )}
          {label && <SentimentLabelBadge label={label} />}
        </div>
      </div>
      <p className="line-clamp-4 text-sm leading-relaxed text-text-muted">{review.text}</p>
      {confidence !== undefined && (
        <div className="flex items-center gap-2">
          <div className="h-1 flex-1 rounded-full bg-background overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.round(confidence * 100)}%`,
                backgroundColor: borderColor,
              }}
            />
          </div>
          <span className="text-xs text-text-muted">{Math.round(confidence * 100)}% conf.</span>
        </div>
      )}
    </div>
  )
}
