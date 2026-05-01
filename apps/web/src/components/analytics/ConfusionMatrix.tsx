import type { ConfusionMatrixDTO } from '@movie-sentiment/shared'

interface ConfusionMatrixProps {
  data: ConfusionMatrixDTO
}

function cellOpacity(value: number, rowMax: number): number {
  if (rowMax === 0) return 0
  return Math.max(0.08, value / rowMax)
}

export function ConfusionMatrix({ data }: ConfusionMatrixProps) {
  const { matrix, labels } = data
  const rowMaxes = matrix.map((row) => Math.max(...row, 1))

  return (
    <div className="flex flex-col gap-3">
      <div className="text-xs text-text-muted text-center">Predicted →</div>
      <div className="flex items-start gap-2">
        <div
          className="text-xs text-text-muted flex items-center"
          style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', height: 120 }}
        >
          Actual ↓
        </div>
        <div className="flex-1 overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr>
                <th className="w-16 p-1" />
                {labels.map((l) => (
                  <th key={l} className="p-1 text-center font-semibold text-text-muted capitalize">
                    {l}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.map((row, ri) => (
                <tr key={labels[ri]}>
                  <td className="p-1 text-right pr-2 font-semibold text-text-muted capitalize">
                    {labels[ri]}
                  </td>
                  {row.map((val, ci) => {
                    const isDiagonal = ri === ci
                    const opacity = cellOpacity(val, rowMaxes[ri] ?? 1)
                    const bg = isDiagonal
                      ? `rgba(62, 207, 142, ${opacity})`
                      : `rgba(229, 72, 77, ${opacity})`
                    return (
                      <td key={ci} className="p-1 text-center">
                        <div
                          className="flex h-12 w-full items-center justify-center rounded-lg text-sm font-bold transition-all duration-300"
                          style={{ background: bg }}
                        >
                          <span
                            className={isDiagonal ? 'text-positive' : val > 0 ? 'text-negative' : 'text-text-muted/40'}
                          >
                            {val}
                          </span>
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="flex gap-4 text-xs text-text-muted mt-1">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm" style={{ background: 'rgba(62,207,142,0.5)' }} />
          Correct (diagonal)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm" style={{ background: 'rgba(229,72,77,0.3)' }} />
          Misclassified
        </span>
      </div>
    </div>
  )
}
