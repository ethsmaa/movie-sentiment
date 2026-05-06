import type { ClassMetrics } from '@movie-sentiment/shared'

interface ClassMetricsCardProps {
  metrics: ClassMetrics
}

const CLASS_COLORS: Record<string, string> = {
  positive: '#3d6b3a',
  negative: '#9b2614',
  neutral:  '#8a6a3a',
}

function MetricRow({ label, value, color }: { label: string; value: number; color: string }) {
  const pct = Math.round(value * 100)
  return (
    <div className="mb-2.5">
      <div className="flex justify-between font-mono text-meta-sm text-ink-soft mb-1 tracking-[0.5px]">
        <span>{label}</span>
        <span className="text-ink font-bold">{pct}%</span>
      </div>
      <div className="h-2 border border-ink bg-ink/10">
        <div className="h-full transition-all duration-260" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}

export function ClassMetricsCard({ metrics }: ClassMetricsCardProps) {
  const color = CLASS_COLORS[metrics.label] ?? '#1b1612'
  const f1Pct = Math.round(metrics.f1 * 100)

  return (
    <div className="border border-ink bg-paper-2">
      {/* Header strip */}
      <div
        className="flex justify-between items-center text-paper"
        style={{ background: color, padding: '8px 14px' }}
      >
        <span className="font-display uppercase text-[22px] leading-none tracking-[1px]">
          {metrics.label}
        </span>
        <span className="font-mono text-meta-sm tracking-[1px]">n = {metrics.support}</span>
      </div>

      {/* Metrics */}
      <div style={{ padding: 14 }}>
        <MetricRow label="Precision" value={metrics.precision} color={color} />
        <MetricRow label="Recall" value={metrics.recall} color={color} />
        <MetricRow label="F1-Score" value={metrics.f1} color={color} />

        {/* F1 callout */}
        <div className="flex justify-between items-center bg-ink text-paper mt-3.5" style={{ padding: '8px 12px' }}>
          <span className="font-mono text-meta-sm tracking-[2px]">F1</span>
          <span className="font-display text-[24px] leading-none" style={{ color }}>
            {f1Pct}%
          </span>
        </div>
      </div>
    </div>
  )
}
