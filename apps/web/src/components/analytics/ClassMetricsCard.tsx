import type { ClassMetrics } from '@movie-sentiment/shared'
import { SENTIMENT_COLORS } from '@movie-sentiment/shared'

interface ClassMetricsCardProps {
  metrics: ClassMetrics
}

function MetricBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-background">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${Math.round(value * 100)}%`, backgroundColor: color }}
        />
      </div>
      <span className="w-10 text-right text-xs font-mono text-text-primary">
        {(value * 100).toFixed(1)}%
      </span>
    </div>
  )
}

export function ClassMetricsCard({ metrics }: ClassMetricsCardProps) {
  const color = SENTIMENT_COLORS[metrics.label]

  return (
    <div
      className="rounded-xl border bg-card/50 p-4 flex flex-col gap-3"
      style={{ borderColor: `${color}30` }}
    >
      <div className="flex items-center justify-between">
        <span
          className="text-sm font-bold capitalize px-2.5 py-0.5 rounded-full"
          style={{ color, background: `${color}18` }}
        >
          {metrics.label}
        </span>
        <span className="text-xs text-text-muted">
          n = <span className="font-medium text-text-primary">{metrics.support}</span>
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-text-muted">Precision</span>
          <MetricBar value={metrics.precision} color={color} />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-text-muted">Recall</span>
          <MetricBar value={metrics.recall} color={color} />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-text-muted">F1-Score</span>
          <MetricBar value={metrics.f1} color={color} />
        </div>
      </div>

      <div
        className="mt-1 rounded-lg px-3 py-2 text-center"
        style={{ background: `${color}10` }}
      >
        <span className="text-xs text-text-muted">F1</span>
        <span className="ml-2 text-lg font-bold" style={{ color }}>
          {(metrics.f1 * 100).toFixed(1)}
        </span>
        <span className="text-xs text-text-muted">%</span>
      </div>
    </div>
  )
}
