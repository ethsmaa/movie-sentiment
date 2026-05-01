import { hypeScoreToColor, hypeScoreToLabel } from '../../lib/utils'
import { TrendingUp } from 'lucide-react'

interface HypeMeterProps {
  hypeScore: number
}

export function HypeMeter({ hypeScore }: HypeMeterProps) {
  const color = hypeScoreToColor(hypeScore)
  const label = hypeScoreToLabel(hypeScore)
  const normalized = (hypeScore + 1) / 2
  const percentage = Math.round(normalized * 100)

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-text-muted" />
        <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
          Hype Meter
        </span>
      </div>
      <div className="flex items-end gap-3">
        <span className="text-4xl font-bold" style={{ color }}>
          {percentage}
        </span>
        <span className="mb-1 text-lg font-medium text-text-muted">/ 100</span>
      </div>
      <div className="relative h-3 overflow-hidden rounded-full bg-background">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </div>
      <p className="text-sm font-medium" style={{ color }}>
        {label}
      </p>
    </div>
  )
}
