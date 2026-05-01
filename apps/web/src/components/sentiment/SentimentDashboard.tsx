import { trpc } from '../../lib/trpc'
import { HypeMeter } from './HypeMeter'
import { ConfidenceGauge } from './ConfidenceGauge'
import { DistributionChart } from './DistributionChart'
import { TopReviewsPanel } from './TopReviewsPanel'
import { TopWordsPanel } from '../analytics/TopWordsPanel'
import { Loader2, AlertCircle } from 'lucide-react'

interface SentimentDashboardProps {
  movieId: string
}

export function SentimentDashboard({ movieId }: SentimentDashboardProps) {
  const summaryQuery = trpc.sentiment.summary.useQuery({ movieId })
  const distributionQuery = trpc.sentiment.distribution.useQuery({ movieId })
  const topReviewsQuery = trpc.sentiment.topReviews.useQuery({ movieId, limit: 5 })

  const isLoading =
    summaryQuery.isLoading || distributionQuery.isLoading || topReviewsQuery.isLoading
  const isError = summaryQuery.isError || distributionQuery.isError

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-3 py-16 text-text-muted">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span>Analyzing sentiment with BERT AI...</span>
      </div>
    )
  }

  if (isError || !summaryQuery.data || !distributionQuery.data) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-text-muted">
        <AlertCircle className="h-8 w-8 text-negative" />
        <p className="text-sm">Failed to load sentiment analysis.</p>
        <p className="text-xs text-text-muted/60">
          Make sure the movie has been analyzed first.
        </p>
      </div>
    )
  }

  const summary = summaryQuery.data
  const distribution = distributionQuery.data
  const topReviews = topReviewsQuery.data

  return (
    <div className="flex flex-col gap-6 animate-slide-up">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <HypeMeter hypeScore={summary.hypeScore} />
        <ConfidenceGauge confidence={summary.averageConfidence} />
        <DistributionChart distribution={distribution} />
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <div className="grid grid-cols-3">
          {[
            { label: 'Total Reviews', value: summary.totalReviews, color: 'text-text-primary' },
            { label: 'Positive', value: summary.positiveCount, color: 'text-positive' },
            { label: 'Negative', value: summary.negativeCount, color: 'text-negative' },
          ].map(({ label, value, color }, i) => (
            <div
              key={label}
              className={`flex flex-col items-center gap-1 bg-card p-4 ${i < 2 ? 'border-r border-border' : ''}`}
            >
              <span className={`text-2xl font-bold ${color}`}>{value}</span>
              <span className="text-xs text-text-muted">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {topReviews && (
        <div>
          <h2 className="mb-4 text-base font-semibold text-text-primary">Featured Reviews</h2>
          <TopReviewsPanel topReviews={topReviews} />
        </div>
      )}

      <TopWordsSectionForMovie movieId={movieId} />
    </div>
  )
}

function TopWordsSectionForMovie({ movieId }: { movieId: string }) {
  const topWordsQuery = trpc.sentiment.topWords.useQuery({ movieId, limit: 8 })
  if (!topWordsQuery.data) return null
  const { positive, negative } = topWordsQuery.data
  if (positive.length === 0 && negative.length === 0) return null
  return (
    <div>
      <h2 className="mb-4 text-base font-semibold text-text-primary">Key Sentiment Words</h2>
      <TopWordsPanel data={topWordsQuery.data} />
    </div>
  )
}
