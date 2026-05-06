import type { TopReviewsDTO } from '@movie-sentiment/shared'
import { ReviewCard } from './ReviewCard'

interface TopReviewsPanelProps {
  topReviews: TopReviewsDTO
}

export function TopReviewsPanel({ topReviews }: TopReviewsPanelProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
      {/* Positive column */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 bg-green" />
          <span className="font-mono text-green text-meta-sm tracking-[1.5px] uppercase">
            Top Positive Reviews
          </span>
        </div>
        <div className="flex flex-col gap-3.5">
          {topReviews.topPositive.length === 0 ? (
            <p className="font-serif italic text-ink-soft text-sm">No positive reviews found</p>
          ) : (
            topReviews.topPositive.map((r) => (
              <ReviewCard key={r.id} review={r} variant="positive" />
            ))
          )}
        </div>
      </div>

      {/* Negative column */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 bg-red" />
          <span className="font-mono text-red text-meta-sm tracking-[1.5px] uppercase">
            Top Negative Reviews
          </span>
        </div>
        <div className="flex flex-col gap-3.5">
          {topReviews.topNegative.length === 0 ? (
            <p className="font-serif italic text-ink-soft text-sm">No negative reviews found</p>
          ) : (
            topReviews.topNegative.map((r) => (
              <ReviewCard key={r.id} review={r} variant="negative" />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
