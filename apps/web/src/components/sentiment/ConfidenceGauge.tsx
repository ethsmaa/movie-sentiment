import { Shield } from 'lucide-react'

interface ConfidenceGaugeProps {
  confidence: number
}

export function ConfidenceGauge({ confidence }: ConfidenceGaugeProps) {
  const percentage = Math.round(confidence * 100)
  const circumference = 2 * Math.PI * 45
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  const color =
    confidence >= 0.8 ? '#3ECF8E' : confidence >= 0.65 ? '#F5B14B' : '#E5484D'

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2">
        <Shield className="h-4 w-4 text-text-muted" />
        <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
          AI Confidence
        </span>
      </div>
      <div className="flex items-center justify-center">
        <div className="relative h-28 w-28">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="#1E2440" strokeWidth="8" />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke={color}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-700"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-text-primary">{percentage}%</span>
            <span className="text-[10px] text-text-muted">confidence</span>
          </div>
        </div>
      </div>
      <p className="text-center text-xs text-text-muted">
        {confidence >= 0.8
          ? 'High confidence'
          : confidence >= 0.65
            ? 'Moderate confidence'
            : 'Low confidence'}
      </p>
    </div>
  )
}
