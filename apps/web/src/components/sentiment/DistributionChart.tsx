import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import type { DistributionDTO } from '@movie-sentiment/shared'
import { SENTIMENT_COLORS, SentimentLabel } from '@movie-sentiment/shared'
import { BarChart2 } from 'lucide-react'

interface DistributionChartProps {
  distribution: DistributionDTO
}

export function DistributionChart({ distribution }: DistributionChartProps) {
  const data = distribution.buckets.map((b) => ({
    name: b.label.charAt(0).toUpperCase() + b.label.slice(1),
    value: b.count,
    percentage: b.percentage,
    label: b.label as SentimentLabel,
  }))

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2">
        <BarChart2 className="h-4 w-4 text-text-muted" />
        <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
          Sentiment Distribution
        </span>
      </div>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={75}
              paddingAngle={3}
              dataKey="value"
            >
              {data.map((entry) => (
                <Cell key={entry.label} fill={SENTIMENT_COLORS[entry.label]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number, name: string) => [`${value} reviews`, name]}
              contentStyle={{
                backgroundColor: '#15192C',
                border: '1px solid #1E2440',
                borderRadius: '8px',
                color: '#F8FAFC',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-col gap-2">
        {data.map((entry) => (
          <div key={entry.label} className="flex items-center gap-2">
            <div
              className="h-2.5 w-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: SENTIMENT_COLORS[entry.label] }}
            />
            <span className="flex-1 text-sm text-text-muted">{entry.name}</span>
            <span className="text-sm font-semibold text-text-primary">{entry.percentage}%</span>
            <span className="text-xs text-text-muted">({entry.value})</span>
          </div>
        ))}
      </div>
    </div>
  )
}
