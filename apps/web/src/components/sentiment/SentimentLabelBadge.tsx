import { SentimentLabel, SENTIMENT_COLORS } from '@movie-sentiment/shared'
import { cn } from '../../lib/utils'

interface SentimentLabelBadgeProps {
  label: SentimentLabel
  className?: string
}

const labelText: Record<SentimentLabel, string> = {
  [SentimentLabel.positive]: 'Positive',
  [SentimentLabel.negative]: 'Negative',
  [SentimentLabel.neutral]: 'Neutral',
}

export function SentimentLabelBadge({ label, className }: SentimentLabelBadgeProps) {
  const color = SENTIMENT_COLORS[label]
  return (
    <span
      className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold', className)}
      style={{ backgroundColor: `${color}20`, color }}
    >
      {labelText[label]}
    </span>
  )
}
