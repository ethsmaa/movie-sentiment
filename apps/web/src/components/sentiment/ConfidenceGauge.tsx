interface ConfidenceGaugeProps {
  confidence: number
}

export function ConfidenceGauge({ confidence }: ConfidenceGaugeProps) {
  const percentage = Math.round(confidence * 100)
  const label =
    confidence >= 0.8 ? 'HIGH' : confidence >= 0.65 ? 'MODERATE' : 'LOW'
  const arcLen = confidence * 1.885 * 100

  return (
    <div className="bg-paper-2 border border-ink" style={{ padding: 16 }}>
      <div className="font-mono text-ink text-meta-xs tracking-[2px] uppercase">AI Confidence</div>
      <div className="flex items-center gap-3.5 mt-2">
        {/* SVG ring */}
        <svg width="72" height="72" viewBox="0 0 72 72" aria-hidden>
          <circle cx="36" cy="36" r="30" fill="none" stroke="#1b1612" strokeWidth="1" opacity="0.2" />
          <circle
            cx="36" cy="36" r="30"
            fill="none"
            stroke="#9b2614"
            strokeWidth="6"
            strokeDasharray={`${arcLen} 200`}
            strokeDashoffset="0"
            transform="rotate(-90 36 36)"
            strokeLinecap="butt"
          />
          <text
            x="36" y="42"
            textAnchor="middle"
            fontFamily="Anton, Impact, sans-serif"
            fontSize="22"
            fill="#1b1612"
          >
            {percentage}
          </text>
        </svg>

        <div>
          <div className="font-display text-ink uppercase" style={{ fontSize: 28, lineHeight: 1 }}>
            {label}
          </div>
          <div className="font-mono text-ink-soft text-meta-xs tracking-[1px] mt-1">
            BERT base · {percentage}% mean
          </div>
        </div>
      </div>
    </div>
  )
}
