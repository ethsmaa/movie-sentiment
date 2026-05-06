import { useState } from 'react'
import { trpc } from '../lib/trpc'
import { getTextSegments, type SentimentLabel } from '@movie-sentiment/shared'
import { VideoClubFooter } from './HomePage'

const HIGHLIGHT_COLORS = {
  positive: '#3d6b3a',
  negative: '#9b2614',
} as const

const LABEL_META: Record<SentimentLabel, { copy: string; color: string }> = {
  positive: { copy: 'POSITIVE', color: '#3d6b3a' },
  negative: { copy: 'NEGATIVE', color: '#9b2614' },
  neutral: { copy: 'NEUTRAL', color: '#8a6a3a' },
}

const MAX_LEN = 10_000

const SAMPLE_REVIEWS = [
  'An absolute masterpiece. Every scene is crafted with care and the performances are extraordinary. One of the best films of the decade.',
  'Pretentious nonsense dressed up in fake depth. The runtime is bloated, the acting is wooden, and the ending is meaningless.',
  'It was okay. Some good moments, some bad. Nothing I would watch again but not a complete waste of time either.',
]

export function AnalyzePage() {
  const [text, setText] = useState('')
  const analyzeMutation = trpc.sentiment.analyzeText.useMutation()

  const result = analyzeMutation.data
  const segments = result ? getTextSegments(text) : []
  const overLimit = text.length > MAX_LEN
  const canSubmit = text.trim().length > 0 && !overLimit && !analyzeMutation.isPending

  const handleAnalyze = () => {
    if (!canSubmit) return
    analyzeMutation.mutate({ text: text.trim() })
  }

  const handleSample = (sample: string) => {
    setText(sample)
    analyzeMutation.reset()
  }

  return (
    <main className="bg-paper text-ink min-h-screen">
      <div className="px-8 pt-8 pb-8">
        {/* Page header */}
        <div className="flex justify-between items-end border-b border-ink pb-5 mb-6">
          <div>
            <div className="font-mono text-red text-meta-sm tracking-[2px] uppercase">
              LIVE INFERENCE · TRY IT YOURSELF
            </div>
            <h1
              className="font-display text-ink uppercase m-0 mt-1.5"
              style={{ fontSize: 72, lineHeight: 0.95 }}
            >
              Paste a Review
            </h1>
            <div className="font-serif italic text-ink-soft mt-1.5" style={{ fontSize: 18 }}>
              Any English movie review · the model classifies it in under a second.
            </div>
          </div>

          <div
            className="bg-amber border border-ink font-mono text-ink text-meta-sm tracking-[1.5px] shrink-0"
            style={{ padding: '10px 16px', transform: 'rotate(-2deg)' }}
          >
            <div className="border-b border-dashed border-ink pb-1 mb-1">DEMO · LIVE</div>
            <div>EN · DISTILBERT</div>
          </div>
        </div>

        <div className="grid gap-6" style={{ gridTemplateColumns: '1fr 1fr' }}>
          {/* Input column */}
          <section>
            <div className="flex items-baseline gap-3 mb-3.5">
              <div className="font-display text-ink text-[28px] leading-none tracking-[0.5px] uppercase">
                INPUT
              </div>
              <div className="flex-1 h-px bg-ink opacity-30" />
              <div className="font-mono text-ink-soft text-meta-sm tracking-[1px]">
                {text.length} / {MAX_LEN.toLocaleString()}
              </div>
            </div>

            <div className="bg-paper-2 border border-ink" style={{ padding: 14 }}>
              <textarea
                value={text}
                onChange={(e) => {
                  setText(e.target.value)
                  if (analyzeMutation.data) analyzeMutation.reset()
                }}
                placeholder="Paste a review here, then hit ANALYZE…"
                className="w-full bg-transparent outline-none font-serif text-ink placeholder:text-ink-soft resize-none"
                style={{ fontSize: 16, lineHeight: 1.5, minHeight: 220 }}
                maxLength={MAX_LEN + 1}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-4">
              <button
                onClick={handleAnalyze}
                disabled={!canSubmit}
                className={`font-mono text-meta uppercase tracking-[1.4px] border border-ink ${
                  canSubmit
                    ? 'bg-ink text-paper hover:bg-red cursor-pointer'
                    : 'bg-paper-dark text-ink-soft cursor-not-allowed'
                }`}
                style={{ padding: '10px 16px' }}
              >
                {analyzeMutation.isPending ? 'ANALYZING…' : 'ANALYZE ▸'}
              </button>

              <button
                onClick={() => {
                  setText('')
                  analyzeMutation.reset()
                }}
                className="font-mono text-meta uppercase tracking-[1.4px] border border-ink text-ink hover:bg-paper-dark cursor-pointer bg-transparent"
                style={{ padding: '10px 16px' }}
                disabled={text.length === 0}
              >
                CLEAR
              </button>

              {overLimit && (
                <div className="font-mono text-red text-meta-sm tracking-[1px]">
                  TOO LONG · TRIM TO {MAX_LEN.toLocaleString()} CHARS
                </div>
              )}
            </div>

            {/* Sample reviews */}
            <div className="mt-6">
              <div className="font-mono text-ink-soft text-meta-sm tracking-[1.5px] uppercase mb-2">
                Or try a sample
              </div>
              <div className="flex flex-col gap-2">
                {SAMPLE_REVIEWS.map((sample, i) => (
                  <button
                    key={i}
                    onClick={() => handleSample(sample)}
                    className="text-left bg-paper-2 border border-ink font-serif text-ink-soft hover:bg-paper-dark cursor-pointer"
                    style={{ padding: '10px 12px', fontSize: 13, lineHeight: 1.4 }}
                  >
                    "{sample.length > 110 ? `${sample.slice(0, 110)}…` : sample}"
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Result column */}
          <section>
            <div className="flex items-baseline gap-3 mb-3.5">
              <div className="font-display text-ink text-[28px] leading-none tracking-[0.5px] uppercase">
                RESULT
              </div>
              <div className="flex-1 h-px bg-ink opacity-30" />
              <div className="font-mono text-ink-soft text-meta-sm tracking-[1px]">
                {result ? `MODEL · ${result.modelVersion.toUpperCase()}` : 'NO PREDICTION YET'}
              </div>
            </div>

            {analyzeMutation.error ? (
              <div className="bg-red text-paper border border-ink p-4">
                <div className="font-mono text-meta-sm tracking-[1.5px] uppercase mb-1">
                  REEL JAMMED
                </div>
                <div className="font-serif" style={{ fontSize: 14 }}>
                  {analyzeMutation.error.message}
                </div>
              </div>
            ) : result ? (
              <ResultPanel
                label={result.label as SentimentLabel}
                confidence={result.confidenceScore}
                pPositive={result.positiveProb}
                pNegative={result.negativeProb}
                segments={segments}
              />
            ) : (
              <EmptyResult />
            )}
          </section>
        </div>
      </div>

      <VideoClubFooter right="LIVE INFERENCE · DISTILBERT-IMDB">
        ★ THIS REVIEW HAS NEVER BEEN SEEN BY THE MODEL ★ EVALUATED IN REAL TIME ★
      </VideoClubFooter>
    </main>
  )
}

function EmptyResult() {
  return (
    <div className="bg-paper-2 border border-dashed border-ink flex items-center justify-center" style={{ minHeight: 220 }}>
      <div className="text-center font-mono text-ink-soft text-meta-sm tracking-[1.5px] uppercase">
        AWAITING INPUT
      </div>
    </div>
  )
}

interface ResultPanelProps {
  label: SentimentLabel
  confidence: number
  pPositive: number
  pNegative: number
  segments: ReturnType<typeof getTextSegments>
}

function ResultPanel({ label, confidence, pPositive, pNegative, segments }: ResultPanelProps) {
  const meta = LABEL_META[label]
  const confPct = Math.round(confidence * 100)
  const posPct = Math.round(pPositive * 100)
  const negPct = Math.round(pNegative * 100)

  return (
    <div className="flex flex-col gap-3">
      {/* Label + confidence header */}
      <div
        className="border border-ink flex items-center justify-between"
        style={{ background: meta.color, color: '#f7efd9', padding: '14px 18px' }}
      >
        <div>
          <div className="font-mono text-meta-sm tracking-[1.5px] opacity-80">CLASSIFICATION</div>
          <div className="font-display uppercase" style={{ fontSize: 36, lineHeight: 1 }}>
            {meta.copy}
          </div>
        </div>
        <div className="text-right">
          <div className="font-mono text-meta-sm tracking-[1.5px] opacity-80">CONFIDENCE</div>
          <div className="font-display" style={{ fontSize: 36, lineHeight: 1 }}>
            {confPct}%
          </div>
        </div>
      </div>

      {/* Probability split */}
      <div className="bg-paper-2 border border-ink" style={{ padding: 14 }}>
        <div className="font-mono text-ink-soft text-meta-sm tracking-[1.5px] uppercase mb-3">
          Probability split
        </div>
        <div className="flex flex-col gap-2 font-mono text-meta">
          <ProbBar label="POSITIVE" pct={posPct} color="#3d6b3a" />
          <ProbBar label="NEGATIVE" pct={negPct} color="#9b2614" />
        </div>
      </div>

      {/* Highlighted text */}
      <div className="bg-paper-2 border border-ink" style={{ padding: 14 }}>
        <div className="font-mono text-ink-soft text-meta-sm tracking-[1.5px] uppercase mb-2">
          Lexicon signal
        </div>
        <p className="font-serif m-0" style={{ fontSize: 15, lineHeight: 1.6, color: '#1b1612' }}>
          <span
            className="font-serif text-red"
            style={{ fontSize: 28, lineHeight: 0.5, marginRight: 4, verticalAlign: '-0.3em' }}
          >
            "
          </span>
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
        </p>
      </div>
    </div>
  )
}

function ProbBar({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-ink-soft tracking-[1px]" style={{ width: 70 }}>{label}</span>
      <div className="flex-1 h-3 border border-ink" style={{ background: 'rgba(27,22,18,0.08)' }}>
        <div className="h-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-ink font-bold" style={{ width: 36, textAlign: 'right' }}>{pct}%</span>
    </div>
  )
}
