import { trpc } from '../../lib/trpc'
import { HypeMeter } from './HypeMeter'
import { ConfidenceGauge } from './ConfidenceGauge'
import { DistributionChart } from './DistributionChart'
import { TopReviewsPanel } from './TopReviewsPanel'
import { TopWordsPanel } from '../analytics/TopWordsPanel'

interface SentimentDashboardProps {
  movieId: string
}

export function SentimentDashboard({ movieId }: SentimentDashboardProps) {
  const summaryQ = trpc.sentiment.summary.useQuery({ movieId })
  const distributionQ = trpc.sentiment.distribution.useQuery({ movieId })
  const topReviewsQ = trpc.sentiment.topReviews.useQuery({ movieId, limit: 5 })
  const topWordsQ = trpc.sentiment.topWords.useQuery({ movieId, limit: 8 })

  const isLoading = summaryQ.isLoading || distributionQ.isLoading || topReviewsQ.isLoading

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3.5">
        {/* Metric cards skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="bg-paper-dark border border-ink animate-pulse" style={{ height: 120 }} />
          ))}
        </div>
        {/* Stat strip skeleton */}
        <div className="bg-paper-dark border border-ink animate-pulse" style={{ height: 72 }} />
      </div>
    )
  }

  if (!summaryQ.data || !distributionQ.data) {
    return (
      <div className="bg-paper-2 border border-ink text-center" style={{ padding: 32 }}>
        <div className="font-display text-ink text-d-xs uppercase">REEL JAMMED</div>
        <p className="font-body text-ink-soft mt-2 text-[14px]">
          Could not load sentiment data.
        </p>
      </div>
    )
  }

  const summary = summaryQ.data
  const distribution = distributionQ.data
  const topReviews = topReviewsQ.data

  return (
    <div className="flex flex-col gap-4">
      {/* 3 metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <HypeMeter hypeScore={summary.hypeScore} />
        <ConfidenceGauge confidence={summary.averageConfidence} />
        <DistributionChart distribution={distribution} />
      </div>

      {/* Big stat strip */}
      <div
        className="grid bg-ink border border-ink"
        style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}
      >
        {[
          { n: summary.totalReviews,  label: 'REVIEWS ANALYZED', color: '#efe5cd' },
          { n: summary.positiveCount, label: 'POSITIVE SIGNAL',  color: '#3d6b3a' },
          { n: summary.negativeCount, label: 'NEGATIVE SIGNAL',  color: '#9b2614' },
        ].map(({ n, label, color }, i) => (
          <div
            key={label}
            className="text-center"
            style={{
              padding: 16,
              borderRight: i < 2 ? '1px solid rgba(239,229,205,0.2)' : 'none',
            }}
          >
            <div className="font-display" style={{ fontSize: 48, lineHeight: 1, color }}>
              {n}
            </div>
            <div
              className="font-mono text-paper text-meta-xs tracking-[1.5px] mt-1"
            >
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* Featured reviews */}
      {topReviews && (topReviews.topPositive.length > 0 || topReviews.topNegative.length > 0) && (
        <section>
          <div className="flex items-baseline gap-3 mb-4">
            <div className="font-display text-ink text-[32px] leading-none tracking-[0.5px] uppercase">
              FEATURED REVIEWS
            </div>
            <div className="flex-1 h-px bg-ink opacity-30" />
            <div className="font-mono text-ink-soft text-meta-sm tracking-[1px]">
              HIGHLIGHTED · BERT EXTRACTED
            </div>
          </div>
          <TopReviewsPanel topReviews={topReviews} />
        </section>
      )}

      {/* Key signal words */}
      {topWordsQ.data &&
        (topWordsQ.data.positive.length > 0 || topWordsQ.data.negative.length > 0) && (
          <section>
            <div className="flex items-baseline gap-3 mb-4">
              <div className="font-display text-ink text-[24px] leading-none tracking-[0.5px] uppercase">
                KEY SIGNAL WORDS
              </div>
              <div className="flex-1 h-px bg-ink opacity-30" />
            </div>
            <TopWordsPanel data={topWordsQ.data} />
          </section>
        )}
    </div>
  )
}
