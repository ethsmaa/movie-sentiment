import type { TopWordsDTO } from '@movie-sentiment/shared'

interface TopWordsPanelProps {
  data: TopWordsDTO
}

function WordList({
  words,
  variant,
}: {
  words: TopWordsDTO['positive']
  variant: 'positive' | 'negative'
}) {
  const color = variant === 'positive' ? '#3ECF8E' : '#E5484D'
  const bgBase = variant === 'positive' ? 'rgba(62, 207, 142,' : 'rgba(229, 72, 77,'

  return (
    <div className="flex flex-col gap-2">
      {words.map((item, i) => (
        <div key={item.word} className="flex items-center gap-3">
          <span className="w-4 text-right text-xs font-mono text-text-muted/60">{i + 1}</span>
          <div className="flex flex-1 items-center gap-2 overflow-hidden">
            <div className="relative h-6 flex-1 overflow-hidden rounded-md bg-background">
              <div
                className="absolute inset-y-0 left-0 rounded-md transition-all duration-500"
                style={{
                  width: `${item.relativeWeight}%`,
                  background: `${bgBase} 0.15)`,
                }}
              />
              <span
                className="absolute inset-0 flex items-center px-2 text-xs font-medium capitalize"
                style={{ color }}
              >
                {item.word}
              </span>
            </div>
            <span className="w-6 flex-shrink-0 text-right text-xs text-text-muted">
              {item.count}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

export function TopWordsPanel({ data }: TopWordsPanelProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="rounded-xl border border-border bg-card/50 p-4">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-positive">
          <span className="h-2 w-2 rounded-full bg-positive" />
          Top Positive Words
        </h3>
        {data.positive.length > 0 ? (
          <WordList words={data.positive} variant="positive" />
        ) : (
          <p className="text-xs text-text-muted">No data yet.</p>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card/50 p-4">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-negative">
          <span className="h-2 w-2 rounded-full bg-negative" />
          Top Negative Words
        </h3>
        {data.negative.length > 0 ? (
          <WordList words={data.negative} variant="negative" />
        ) : (
          <p className="text-xs text-text-muted">No data yet.</p>
        )}
      </div>
    </div>
  )
}
