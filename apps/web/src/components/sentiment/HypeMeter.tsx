import { useEffect, useRef } from 'react'
import { hypePercentage, hypeLabel } from '../../lib/utils'

interface HypeMeterProps {
  hypeScore: number
}

export function HypeMeter({ hypeScore }: HypeMeterProps) {
  const barRef = useRef<HTMLDivElement>(null)
  const percentage = hypePercentage(hypeScore)
  const label = hypeLabel(percentage)

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
    <div className="bg-amber border border-ink relative" style={{ padding: 16 }}>
      <div className="font-mono text-ink text-meta-xs tracking-[2px] uppercase">Audience Hype</div>
      <div className="font-display text-ink mt-1" style={{ fontSize: 64, lineHeight: 1 }}>
        {percentage}
        <span className="font-display text-ink-soft" style={{ fontSize: 22 }}> /100</span>
      </div>
      {/* Progress track */}
      <div className="relative h-1.5 mt-2.5" style={{ background: 'rgba(27,22,18,0.25)' }}>
        <div ref={barRef} className="absolute inset-y-0 left-0 bg-ink" style={{ width: 0 }} />
      </div>
      <div className="font-mono text-ink text-meta-xs tracking-[1px] mt-1.5">{label}</div>
    </div>
  )
}
