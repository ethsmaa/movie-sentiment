import { useEffect, useRef } from 'react'
import type { DistributionDTO } from '@movie-sentiment/shared'
import type { SentimentLabel } from '@movie-sentiment/shared'

interface DistributionChartProps {
  distribution: DistributionDTO
}

const SENTIMENT_META: Record<SentimentLabel, { label: string; color: string; shortLabel: string }> = {
  positive: { label: 'Positive', shortLabel: 'POS', color: '#3d6b3a' },
  negative: { label: 'Negative', shortLabel: 'NEG', color: '#9b2614' },
  neutral:  { label: 'Neutral',  shortLabel: 'NEU', color: '#8a6a3a' },
}

function AnimatedBar({ percentage, color }: { percentage: number; color: string }) {
  const barRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const bar = barRef.current
    if (!bar) return
    bar.style.width = '0%'
    const raf = requestAnimationFrame(() => {
      bar.style.transition = 'width 260ms cubic-bezier(0.2, 0.8, 0.2, 1)'
      bar.style.width = `${percentage}%`
    })
    return () => cancelAnimationFrame(raf)
  }, [percentage])

  return (
    <div className="flex-1 h-3 bg-ink/10">
      <div ref={barRef} className="h-full" style={{ backgroundColor: color, width: 0 }} />
    </div>
  )
}

export function DistributionChart({ distribution }: DistributionChartProps) {
  const buckets = distribution.buckets.map((b) => ({
    ...b,
    meta: SENTIMENT_META[b.label as SentimentLabel],
  }))

  return (
    <div className="bg-paper-2 border border-ink" style={{ padding: 16 }}>
      <div className="font-mono text-ink text-meta-xs tracking-[2px] uppercase">Sentiment Split</div>
      <div className="flex flex-col gap-2 mt-2.5">
        {buckets.map((b) => (
          <div key={b.label} className="flex items-center gap-2 font-mono text-meta-sm">
            <span className="w-7 text-ink-soft tracking-[1px]">{b.meta.shortLabel}</span>
            <AnimatedBar percentage={b.percentage} color={b.meta.color} />
            <span className="text-ink font-bold w-4 text-right">{b.count}</span>
            <span className="text-ink-soft w-8 text-right">{b.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}
