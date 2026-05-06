import type { ConfusionMatrixDTO } from '@movie-sentiment/shared'

interface ConfusionMatrixProps {
  data: ConfusionMatrixDTO
}

export function ConfusionMatrix({ data }: ConfusionMatrixProps) {
  const { matrix, labels } = data
  const rowMaxes = matrix.map((row) => Math.max(...row, 1))

  return (
    <div className="bg-paper-2 border border-ink" style={{ padding: 24 }}>
      {/* Grid: 110px label col + N data cols (N = labels.length, supports binary or multi-class) */}
      <div style={{ display: 'grid', gridTemplateColumns: `110px repeat(${labels.length}, 1fr)`, gap: 8, alignItems: 'center' }}>
        {/* Header row */}
        <div />
        {labels.map((l) => (
          <div
            key={l}
            className="font-mono text-ink-soft text-meta-sm tracking-[1.5px] text-center border-b border-dashed border-ink capitalize"
            style={{ paddingBottom: 6 }}
          >
            PRED · {l.toUpperCase()}
          </div>
        ))}

        {/* Data rows */}
        {matrix.map((row, ri) => {
          const rowMax = rowMaxes[ri] ?? 1
          return (
            <>
              {/* Row label */}
              <div
                key={`lbl-${ri}`}
                className="font-mono text-ink-soft text-meta-sm tracking-[1.5px] text-right border-r border-dashed border-ink pr-2 capitalize"
              >
                ACT · {labels[ri]?.toUpperCase()}
              </div>

              {/* Cells */}
              {row.map((v, ci) => {
                const isDiag = ri === ci
                const intensity = v === 0 ? 0 : 0.25 + (v / rowMax) * 0.7
                const bg = isDiag
                  ? '#3d6b3a'
                  : v === 0
                  ? '#f7efd9'
                  : `rgba(155, 38, 20, ${intensity})`

                return (
                  <div
                    key={`cell-${ri}-${ci}`}
                    className="border border-ink text-center"
                    style={{ padding: '20px 12px', background: bg }}
                  >
                    <div
                      className="font-display"
                      style={{
                        fontSize: 36,
                        lineHeight: 1,
                        color: isDiag ? '#f7efd9' : '#1b1612',
                      }}
                    >
                      {v}
                    </div>
                  </div>
                )
              })}
            </>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex gap-[18px] mt-4 font-mono text-ink-soft text-meta-sm tracking-[1px]">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 border border-ink bg-green" />
          CORRECT (DIAGONAL)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 border border-ink opacity-50" style={{ background: '#9b2614' }} />
          MISCLASSIFIED
        </span>
      </div>
    </div>
  )
}
