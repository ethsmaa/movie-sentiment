import { useEffect, useMemo, useRef, useState } from 'react'

interface ProgressiveStep {
  step: number
  tokenIndex: number
  prefixText: string
  pPositive: number
  pNegative: number
  label: 'positive' | 'negative'
  confidence: number
}

interface ReadingPlaybackProps {
  steps: ProgressiveStep[]
  totalTokens: number
}

const STEP_INTERVAL_MS = 320

export function ReadingPlayback({ steps, totalTokens }: ReadingPlaybackProps) {
  const [activeIdx, setActiveIdx] = useState(0)
  const [playing, setPlaying] = useState(false)
  const timerRef = useRef<number | null>(null)

  // Auto-play on mount.
  useEffect(() => {
    setActiveIdx(0)
    setPlaying(true)
  }, [steps])

  useEffect(() => {
    if (!playing) {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current)
      return
    }
    if (activeIdx >= steps.length - 1) {
      setPlaying(false)
      return
    }
    timerRef.current = window.setTimeout(() => {
      setActiveIdx((i) => Math.min(i + 1, steps.length - 1))
    }, STEP_INTERVAL_MS)
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    }
  }, [playing, activeIdx, steps.length])

  const current = steps[activeIdx] ?? steps[0]
  if (!current) return null

  const handlePlayPause = () => {
    if (activeIdx >= steps.length - 1) {
      setActiveIdx(0)
      setPlaying(true)
    } else {
      setPlaying((p) => !p)
    }
  }

  const handleRewind = () => {
    setActiveIdx(0)
    setPlaying(false)
  }

  return (
    <div className="bg-paper-2 border border-ink mt-4" style={{ padding: 18 }}>
      {/* Top status strip */}
      <div className="flex justify-between items-baseline mb-3 font-mono text-meta-sm tracking-[1.5px] uppercase">
        <span className="text-red">▸ NOW PLAYING · MODEL READING</span>
        <span className="text-ink-soft">
          STEP {activeIdx + 1} / {steps.length} · TOKEN {current.tokenIndex} / {totalTokens}
        </span>
      </div>

      <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
        {/* Gauge column */}
        <ConfidenceGauge step={current} />

        {/* Trajectory chart column */}
        <TrajectoryChart steps={steps} activeIdx={activeIdx} />
      </div>

      {/* Filmstrip */}
      <Filmstrip steps={steps} activeIdx={activeIdx} onSelect={(i) => { setActiveIdx(i); setPlaying(false) }} />

      {/* Prefix preview */}
      <div className="bg-paper border border-ink mt-3" style={{ padding: 12, minHeight: 64 }}>
        <div className="font-mono text-ink-soft text-meta-xs tracking-[1.5px] uppercase mb-1">
          PREFIX READ SO FAR
        </div>
        <p className="font-serif m-0 italic" style={{ fontSize: 14, lineHeight: 1.5 }}>
          {current.prefixText}
          <span className="font-display text-red ml-1" style={{ fontSize: 18 }}>▌</span>
        </p>
      </div>

      {/* Controls */}
      <div className="flex gap-2 mt-3">
        <button
          onClick={handleRewind}
          className="font-mono text-meta uppercase tracking-[1.4px] border border-ink text-ink hover:bg-paper-dark cursor-pointer bg-transparent"
          style={{ padding: '8px 14px' }}
        >
          ◂◂ REWIND
        </button>
        <button
          onClick={handlePlayPause}
          className="font-mono text-meta uppercase tracking-[1.4px] border border-ink bg-ink text-paper hover:bg-red cursor-pointer"
          style={{ padding: '8px 14px' }}
        >
          {activeIdx >= steps.length - 1 ? '↻ REPLAY' : playing ? '❚❚ PAUSE' : '▸ PLAY'}
        </button>
      </div>

      <div className="mt-3 font-mono text-ink-soft text-meta-xs tracking-[1.5px] leading-relaxed">
        ⚠ THIS IS A PREDICTION TRAJECTORY · NOT REAL ATTENTION ·
        EACH FRAME RUNS THE MODEL ON A PREFIX OF THE TEXT
      </div>
    </div>
  )
}

function ConfidenceGauge({ step }: { step: ProgressiveStep }) {
  // Center the needle: -1 = pure negative (left), +1 = pure positive (right), 0 = neutral
  const signed = step.pPositive - step.pNegative
  // Map to angle: -90deg (full negative) … +90deg (full positive)
  const angleDeg = signed * 90

  const arcRadius = 80
  const cx = 100
  const cy = 100
  const labelText = step.label.toUpperCase()
  const labelColor = step.label === 'positive' ? '#3d6b3a' : '#9b2614'

  return (
    <div className="bg-paper border border-ink relative overflow-hidden" style={{ padding: 14 }}>
      <div className="font-mono text-ink-soft text-meta-xs tracking-[1.5px] uppercase mb-1">
        Live confidence
      </div>
      <svg viewBox="0 0 200 120" width="100%" style={{ display: 'block' }}>
        {/* Background arc */}
        <path
          d={`M 20 100 A ${arcRadius} ${arcRadius} 0 0 1 180 100`}
          fill="none"
          stroke="#e5d9be"
          strokeWidth="14"
        />
        {/* Negative half */}
        <path
          d={`M 20 100 A ${arcRadius} ${arcRadius} 0 0 1 100 20`}
          fill="none"
          stroke="#9b2614"
          strokeWidth="3"
        />
        {/* Positive half */}
        <path
          d={`M 100 20 A ${arcRadius} ${arcRadius} 0 0 1 180 100`}
          fill="none"
          stroke="#3d6b3a"
          strokeWidth="3"
        />
        {/* Tick marks */}
        {[-90, -45, 0, 45, 90].map((deg) => {
          const rad = (deg - 90) * (Math.PI / 180)
          const x1 = cx + Math.cos(rad) * (arcRadius - 8)
          const y1 = cy + Math.sin(rad) * (arcRadius - 8)
          const x2 = cx + Math.cos(rad) * (arcRadius + 4)
          const y2 = cy + Math.sin(rad) * (arcRadius + 4)
          return <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#1b1612" strokeWidth="1.5" />
        })}
        {/* Needle */}
        <g
          style={{
            transform: `rotate(${angleDeg}deg)`,
            transformOrigin: `${cx}px ${cy}px`,
            transition: 'transform 240ms cubic-bezier(0.2, 0.8, 0.2, 1)',
          }}
        >
          <line x1={cx} y1={cy} x2={cx} y2={cy - arcRadius + 6} stroke="#1b1612" strokeWidth="3" strokeLinecap="round" />
          <circle cx={cx} cy={cy} r="6" fill="#1b1612" />
        </g>
        {/* Side labels */}
        <text x="20" y="115" fontFamily="JetBrains Mono" fontSize="10" fill="#9b2614" letterSpacing="1.5">NEG</text>
        <text x="180" y="115" fontFamily="JetBrains Mono" fontSize="10" fill="#3d6b3a" letterSpacing="1.5" textAnchor="end">POS</text>
      </svg>
      <div className="flex items-baseline justify-between mt-1">
        <div
          className="font-display uppercase"
          style={{ fontSize: 28, lineHeight: 1, color: labelColor }}
        >
          {labelText}
        </div>
        <div className="font-mono text-ink text-meta-sm tracking-[1px]">
          P_POS={(step.pPositive * 100).toFixed(1)}%
        </div>
      </div>
    </div>
  )
}

function TrajectoryChart({
  steps,
  activeIdx,
}: {
  steps: ProgressiveStep[]
  activeIdx: number
}) {
  const width = 360
  const height = 120
  const padX = 12
  const padY = 14
  const innerW = width - padX * 2
  const innerH = height - padY * 2

  const pathD = useMemo(() => {
    if (steps.length === 0) return ''
    return steps
      .map((s, i) => {
        const x = padX + (i / Math.max(1, steps.length - 1)) * innerW
        const y = padY + (1 - s.pPositive) * innerH
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
      })
      .join(' ')
  }, [steps, innerW, innerH])

  const activeX = padX + (activeIdx / Math.max(1, steps.length - 1)) * innerW
  const activeY = padY + (1 - (steps[activeIdx]?.pPositive ?? 0)) * innerH
  const midY = padY + innerH / 2

  return (
    <div className="bg-paper border border-ink relative" style={{ padding: 14 }}>
      <div className="font-mono text-ink-soft text-meta-xs tracking-[1.5px] uppercase mb-1">
        Trajectory · p_positive over time
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" style={{ display: 'block' }}>
        {/* Bands */}
        <rect x={padX} y={padY} width={innerW} height={innerH * 0.35} fill="#3d6b3a" opacity="0.08" />
        <rect x={padX} y={padY + innerH * 0.65} width={innerW} height={innerH * 0.35} fill="#9b2614" opacity="0.08" />
        {/* Threshold guides at 0.65 (positive) and 0.35 (negative) */}
        <line
          x1={padX} y1={padY + innerH * 0.35} x2={padX + innerW} y2={padY + innerH * 0.35}
          stroke="#3d6b3a" strokeWidth="1" strokeDasharray="3 3"
        />
        <line
          x1={padX} y1={padY + innerH * 0.65} x2={padX + innerW} y2={padY + innerH * 0.65}
          stroke="#9b2614" strokeWidth="1" strokeDasharray="3 3"
        />
        <line x1={padX} y1={midY} x2={padX + innerW} y2={midY} stroke="#1b1612" strokeWidth="0.5" opacity="0.3" />
        {/* Path */}
        <path d={pathD} fill="none" stroke="#1b1612" strokeWidth="1.5" />
        {/* Past points (filled) */}
        {steps.slice(0, activeIdx + 1).map((s, i) => {
          const x = padX + (i / Math.max(1, steps.length - 1)) * innerW
          const y = padY + (1 - s.pPositive) * innerH
          return <circle key={i} cx={x} cy={y} r="2" fill="#1b1612" />
        })}
        {/* Active point */}
        <circle cx={activeX} cy={activeY} r="5" fill="#e8a23a" stroke="#1b1612" strokeWidth="1.5" />
      </svg>
      <div className="flex justify-between font-mono text-ink-soft text-meta-xs tracking-[1.2px]">
        <span>0%</span>
        <span>50%</span>
        <span>100%</span>
      </div>
    </div>
  )
}

function Filmstrip({
  steps,
  activeIdx,
  onSelect,
}: {
  steps: ProgressiveStep[]
  activeIdx: number
  onSelect: (i: number) => void
}) {
  return (
    <div className="bg-ink border border-ink mt-3" style={{ padding: 6 }}>
      <div className="flex gap-1 overflow-x-auto" style={{ scrollbarWidth: 'thin' }}>
        {steps.map((s, i) => {
          const past = i <= activeIdx
          const active = i === activeIdx
          // Each cell color reflects that step's prediction strength.
          const fill = past
            ? s.pPositive >= 0.5
              ? `rgba(61, 107, 58, ${0.4 + s.pPositive * 0.5})`
              : `rgba(155, 38, 20, ${0.4 + (1 - s.pPositive) * 0.5})`
            : 'rgba(247, 239, 217, 0.08)'
          return (
            <button
              key={i}
              onClick={() => onSelect(i)}
              className="shrink-0 cursor-pointer"
              style={{
                width: 22,
                height: 30,
                background: fill,
                border: active ? '2px solid #e8a23a' : '1px solid rgba(247, 239, 217, 0.2)',
                transition: 'background 240ms, border-color 120ms',
              }}
              title={`step ${i + 1}: p_pos=${(s.pPositive * 100).toFixed(1)}%`}
            />
          )
        })}
      </div>
    </div>
  )
}
