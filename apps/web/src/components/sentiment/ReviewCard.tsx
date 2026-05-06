import type { ReviewWithSentimentDTO, SentimentLabel } from '@movie-sentiment/shared'
import { getTextSegments } from '@movie-sentiment/shared'

interface ReviewCardProps {
  review: ReviewWithSentimentDTO
  variant?: 'positive' | 'negative'
}

const LABEL_COLORS: Record<SentimentLabel, { bg: string; text: string; pill: string }> = {
  positive: { bg: '#3d6b3a', text: '#f7efd9', pill: 'bg-green text-paper-2' },
  negative: { bg: '#9b2614', text: '#f7efd9', pill: 'bg-red text-paper-2' },
  neutral:  { bg: '#8a6a3a', text: '#f7efd9', pill: 'bg-kraft text-paper-2' },
}

// Highlight color follows the *word's* lexicon polarity, not the review's
// overall class. So "stunning" stays green even in a negative review, and
// "boring" stays red even in a positive one — readers see per-word signal
// rather than a uniform tint.
const HIGHLIGHT_COLORS = {
  positive: '#3d6b3a',
  negative: '#9b2614',
} as const

function HighlightedText({ text }: { text: string }) {
  const segments = getTextSegments(text)

  return (
    <span>
      {segments.map((seg, i) => {
        if (seg.highlight) {
          return (
            <mark
              key={i}
              className="text-paper-2"
              style={{ background: HIGHLIGHT_COLORS[seg.highlight], padding: '0 4px' }}
            >
              {seg.text}
            </mark>
          )
        }
        return <span key={i}>{seg.text}</span>
      })}
    </span>
  )
}

export function ReviewCard({ review, variant }: ReviewCardProps) {
  const label = review.analysis?.label as SentimentLabel | undefined
  const conf = review.analysis?.confidenceScore
  const confPct = conf !== undefined ? Math.round(conf * 100) : null
  const meta = label ? LABEL_COLORS[label] : null

  return (
    <div className="bg-paper-2 border border-ink relative" style={{ padding: 16 }}>
      {/* Header row */}
      <div className="flex justify-between items-center mb-2 font-mono text-meta-sm">
        <span className="text-ink font-bold tracking-[0.8px]">
          {review.author}
          {review.rating && (
            <span className="text-ink-soft font-normal ml-2">
              {review.rating.toFixed(1)}/10
            </span>
          )}
        </span>
        {meta && label && (
          <span
            className={`${meta.pill} font-mono text-meta-xs tracking-[1.2px]`}
            style={{ padding: '2px 8px' }}
          >
            {label.toUpperCase()} · {confPct}%
          </span>
        )}
      </div>

      {/* Review body — Playfair serif with opening quote */}
      <p className="font-serif m-0" style={{ fontSize: 16, lineHeight: 1.5, color: '#1b1612' }}>
        <span
          className="font-serif text-red"
          style={{ fontSize: 32, lineHeight: 0.5, marginRight: 4, verticalAlign: '-0.3em' }}
        >
          "
        </span>
        <HighlightedText text={review.text} />
      </p>
    </div>
  )
}
