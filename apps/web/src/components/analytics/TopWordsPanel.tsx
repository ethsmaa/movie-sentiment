import type { TopWordsDTO } from '@movie-sentiment/shared'

interface TopWordsPanelProps {
  data: TopWordsDTO
}

function SignalWordsList({
  title,
  words,
  color,
}: {
  title: string
  words: TopWordsDTO['positive']
  color: string
}) {
  const max = Math.max(...words.map((w) => w.count), 1)

  return (
    <div className="bg-paper-2 border border-ink">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-dashed border-ink"
        style={{ padding: '10px 14px' }}>
        <div className="w-2 h-2" style={{ background: color }} />
        <span
          className="font-mono text-meta-sm tracking-[1.5px] font-bold uppercase"
          style={{ color }}
        >
          {title}
        </span>
      </div>

      {/* Word rows */}
      <div>
        {words.map((item, i) => (
          <div
            key={item.word}
            className="flex items-center gap-3 border-b border-dashed border-ink/15 last:border-b-0"
            style={{ padding: '8px 14px' }}
          >
            {/* Index */}
            <span className="font-mono text-ink-soft text-meta-xs w-4">
              {String(i + 1).padStart(2, '0')}
            </span>

            {/* Word bar */}
            <div className="flex-1 relative h-[22px] flex items-center">
              <div
                className="absolute inset-0 opacity-20"
                style={{ width: `${(item.count / max) * 100}%`, background: color }}
              />
              <span
                className="relative font-display text-ink uppercase pl-2"
                style={{ fontSize: 16, letterSpacing: 0.5 }}
              >
                {item.word}
              </span>
            </div>

            {/* Count */}
            <span className="font-mono text-ink font-bold text-meta tracking-[1px]">
              {item.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function TopWordsPanel({ data }: TopWordsPanelProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-[18px]">
      <SignalWordsList title="Top Positive Words" words={data.positive} color="#3d6b3a" />
      <SignalWordsList title="Top Negative Words" words={data.negative} color="#9b2614" />
    </div>
  )
}

export { SignalWordsList }
