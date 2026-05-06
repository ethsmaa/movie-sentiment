import { trpc } from '../lib/trpc'
import { ClassMetricsCard } from '../components/analytics/ClassMetricsCard'
import { ConfusionMatrix } from '../components/analytics/ConfusionMatrix'
import { TopWordsPanel } from '../components/analytics/TopWordsPanel'
import { VideoClubFooter } from './HomePage'

export function ModelMetricsPage() {
  const metricsQ = trpc.sentiment.modelMetrics.useQuery({})
  const topWordsQ = trpc.sentiment.topWords.useQuery({ limit: 10 })

  const isLoading = metricsQ.isLoading || topWordsQ.isLoading

  if (isLoading) {
    return (
      <div className="bg-paper min-h-screen px-8 pt-8">
        <div className="bg-paper-dark animate-pulse h-16 w-80 mb-6" />
        <div className="grid grid-cols-4 gap-3.5 mb-8">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="bg-paper-dark animate-pulse" style={{ height: 110 }} />
          ))}
        </div>
      </div>
    )
  }

  if (metricsQ.isError || !metricsQ.data) {
    return (
      <div className="bg-paper min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="font-display text-ink text-d-s uppercase tracking-[0.5px]">
          REEL JAMMED
        </div>
        <p className="font-body text-ink-soft text-[14px]">
          Failed to load model metrics. Analyze some movies first.
        </p>
      </div>
    )
  }

  const { classMetrics, weightedF1, accuracy, confusionMatrix, sampleSize, totalReviews, modelInfo } =
    metricsQ.data

  const accPct = (accuracy * 100).toFixed(1)
  const f1Pct = (weightedF1 * 100).toFixed(1)

  const qcId = Math.floor(10000 + Math.random() * 90000)

  return (
    <main className="bg-paper text-ink min-h-screen">
      <div className="px-8 pt-8 pb-8">

        {/* ── Page title block ── */}
        <div
          className="flex justify-between items-end border-b border-ink pb-5 mb-6"
        >
          <div>
            <div className="font-mono text-red text-meta-sm tracking-[2px] uppercase">
              QUALITY CONTROL · LAB SHEET
            </div>
            <h1
              className="font-display text-ink uppercase m-0 mt-1.5"
              style={{ fontSize: 72, lineHeight: 0.95 }}
            >
              Model Metrics
            </h1>
            <div className="font-serif italic text-ink-soft mt-1.5" style={{ fontSize: 18 }}>
              {modelInfo
                ? `${modelInfo.base} fine-tuned on ${modelInfo.trainedOn} · ${modelInfo.epochs} epochs`
                : 'BERT sentiment classifier — ground truth derived from user ratings.'}
            </div>
          </div>

          {/* QC Stamp */}
          <div
            className="bg-amber border border-ink font-mono text-ink text-meta-sm tracking-[1.5px] shrink-0"
            style={{ padding: '10px 16px', transform: 'rotate(2deg)' }}
          >
            <div className="border-b border-dashed border-ink pb-1 mb-1">STAMP · APPROVED</div>
            <div>QC-{qcId}</div>
          </div>
        </div>

        {/* ── Headline metrics ── */}
        <div className="grid gap-3.5 mb-8" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          {[
            { label: 'ACCURACY',       value: `${accPct}%`,                 color: '#3d6b3a' },
            { label: 'WEIGHTED F1',    value: `${f1Pct}%`,                  color: '#e8a23a' },
            { label: 'EVALUATED',      value: String(sampleSize),           color: '#1b1612' },
            { label: 'TOTAL REVIEWS',  value: String(totalReviews),         color: '#1b1612' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-paper-2 border border-ink relative" style={{ padding: 18 }}>
              {/* Top color stripe */}
              <div className="absolute top-0 left-0 right-0 h-1" style={{ background: color }} />
              <div className="font-mono text-ink-soft text-meta-xs tracking-[1.8px] uppercase mt-1">
                {label}
              </div>
              <div className="font-display text-ink mt-1" style={{ fontSize: 56, lineHeight: 1 }}>
                {value}
              </div>
            </div>
          ))}
        </div>

        {/* ── Per-class metrics ── */}
        <section className="mb-9">
          <div className="flex items-baseline gap-3 mb-3.5">
            <div className="font-display text-ink text-[28px] leading-none tracking-[0.5px] uppercase">
              PER-CLASS METRICS
            </div>
            <div className="flex-1 h-px bg-ink opacity-30" />
            <div className="font-mono text-ink-soft text-meta-sm tracking-[1px]">
              PRECISION · RECALL · F1
            </div>
          </div>
          <div className="grid gap-3.5" style={{ gridTemplateColumns: `repeat(${Math.max(classMetrics.length, 1)}, 1fr)` }}>
            {classMetrics.map((m) => (
              <ClassMetricsCard key={m.label} metrics={m} />
            ))}
          </div>
        </section>

        {/* ── Confusion matrix ── */}
        <section className="mb-9">
          <div className="flex items-baseline gap-3 mb-3.5">
            <div className="font-display text-ink text-[28px] leading-none tracking-[0.5px] uppercase">
              CONFUSION MATRIX
            </div>
            <div className="flex-1 h-px bg-ink opacity-30" />
            <div className="font-mono text-ink-soft text-meta-sm tracking-[1px]">
              ROW = ACTUAL · COL = PREDICTED
            </div>
          </div>
          <ConfusionMatrix data={confusionMatrix} />
        </section>

        {/* ── Global top words ── */}
        {topWordsQ.data && (
          <section>
            <div className="flex items-baseline gap-3 mb-3.5">
              <div className="font-display text-ink text-[28px] leading-none tracking-[0.5px] uppercase">
                GLOBAL TOP WORDS
              </div>
              <div className="flex-1 h-px bg-ink opacity-30" />
              <div className="font-mono text-ink-soft text-meta-sm tracking-[1px]">
                ACROSS ALL ANALYZED REVIEWS
              </div>
            </div>
            <TopWordsPanel data={topWordsQ.data} />
          </section>
        )}
      </div>

      <VideoClubFooter right={modelInfo ? `${modelInfo.base} · trained ${modelInfo.trainedAt.slice(0, 10)}` : 'BERT-base-uncased'}>
        ★ LAB SHEET CINESENTIMENT/QC-001 ★ INTERNAL USE ONLY ★
      </VideoClubFooter>
    </main>
  )
}
