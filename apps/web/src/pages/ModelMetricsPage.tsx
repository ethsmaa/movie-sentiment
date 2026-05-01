import { BarChart3, AlertCircle, Loader2 } from 'lucide-react'
import { ClassMetricsCard } from '../components/analytics/ClassMetricsCard'
import { ConfusionMatrix } from '../components/analytics/ConfusionMatrix'
import { TopWordsPanel } from '../components/analytics/TopWordsPanel'
import { trpc } from '../lib/trpc'

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl border border-border bg-card/50 p-4">
      <span className="text-2xl font-bold text-accent">{value}</span>
      <span className="text-xs text-text-muted">{label}</span>
    </div>
  )
}

export function ModelMetricsPage() {
  const metricsQuery = trpc.sentiment.modelMetrics.useQuery({})
  const topWordsQuery = trpc.sentiment.topWords.useQuery({ limit: 10 })

  const isLoading = metricsQuery.isLoading || topWordsQuery.isLoading
  const isError = metricsQuery.isError

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-3 py-24 text-text-muted">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span>Loading model metrics...</span>
      </div>
    )
  }

  if (isError || !metricsQuery.data) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-text-muted">
        <AlertCircle className="h-8 w-8 text-negative" />
        <p className="text-sm">Failed to load model metrics. Analyze some movies first.</p>
      </div>
    )
  }

  const { classMetrics, weightedF1, accuracy, confusionMatrix, sampleSize, totalReviews } =
    metricsQuery.data

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 animate-slide-up">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
          <BarChart3 className="h-5 w-5 text-accent" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-text-primary">Model Metrics</h1>
          <p className="text-sm text-text-muted">
            BERT sentiment classifier performance — ground truth derived from user ratings
          </p>
        </div>
      </div>

      {/* Overview stats */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Accuracy" value={`${(accuracy * 100).toFixed(1)}%`} />
        <StatCard label="Weighted F1" value={`${(weightedF1 * 100).toFixed(1)}%`} />
        <StatCard label="Evaluated Reviews" value={sampleSize.toLocaleString()} />
        <StatCard label="Total Reviews" value={totalReviews.toLocaleString()} />
      </div>

      {/* Per-class metrics */}
      <section className="mb-8">
        <h2 className="mb-4 text-base font-semibold text-text-primary">
          Per-Class Metrics
          <span className="ml-2 text-xs font-normal text-text-muted">
            (Precision · Recall · F1)
          </span>
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {classMetrics.map((m) => (
            <ClassMetricsCard key={m.label} metrics={m} />
          ))}
        </div>
      </section>

      {/* Confusion matrix */}
      <section className="mb-8 rounded-xl border border-border bg-card/50 p-5">
        <h2 className="mb-1 text-base font-semibold text-text-primary">Confusion Matrix</h2>
        <p className="mb-4 text-xs text-text-muted">
          Row = actual class (rating ≥7 → positive, ≤3 → negative, 4–6 → neutral)
          &nbsp;·&nbsp; Column = model prediction
        </p>
        <ConfusionMatrix data={confusionMatrix} />
      </section>

      {/* Global top words */}
      {topWordsQuery.data && (
        <section>
          <h2 className="mb-4 text-base font-semibold text-text-primary">
            Global Top Words
            <span className="ml-2 text-xs font-normal text-text-muted">
              (across all analyzed reviews)
            </span>
          </h2>
          <TopWordsPanel data={topWordsQuery.data} />
        </section>
      )}
    </main>
  )
}
