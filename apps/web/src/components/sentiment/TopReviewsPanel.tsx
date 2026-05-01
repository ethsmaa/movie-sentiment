import type { TopReviewsDTO } from '@movie-sentiment/shared'
import { ReviewCard } from './ReviewCard'
import { ThumbsUp, ThumbsDown } from 'lucide-react'

interface TopReviewsPanelProps {
  topReviews: TopReviewsDTO
}

export function TopReviewsPanel({ topReviews }: TopReviewsPanelProps) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <ThumbsUp className="h-4 w-4 text-positive" />
          <h3 className="text-sm font-semibold uppercase tracking-wide text-positive">
            Top Positive Reviews
          </h3>
        </div>
        <div className="flex flex-col gap-3">
          {topReviews.topPositive.length === 0 ? (
            <p className="text-sm italic text-text-muted">No positive reviews found</p>
          ) : (
            topReviews.topPositive.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <ThumbsDown className="h-4 w-4 text-negative" />
          <h3 className="text-sm font-semibold uppercase tracking-wide text-negative">
            Top Negative Reviews
          </h3>
        </div>
        <div className="flex flex-col gap-3">
          {topReviews.topNegative.length === 0 ? (
            <p className="text-sm italic text-text-muted">No negative reviews found</p>
          ) : (
            topReviews.topNegative.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
