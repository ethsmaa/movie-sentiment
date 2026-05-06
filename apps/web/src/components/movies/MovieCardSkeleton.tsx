import { TAPE_COLORS } from '../../lib/utils'

export function MovieCardSkeleton() {
  return (
    <div className="bg-ink border-thin border-ink shadow-vhs-sm" style={{ padding: 8 }}>
      {/* Stripe band */}
      <div className="flex h-2 mb-2">
        {TAPE_COLORS.map((c, i) => (
          <div key={i} className="flex-1 opacity-50" style={{ background: c }} />
        ))}
      </div>

      {/* Poster placeholder */}
      <div className="relative overflow-hidden" style={{ aspectRatio: '2/3', background: '#2a231e' }}>
        <div
          className="absolute inset-0 animate-shimmer"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(239,229,205,0.06) 50%, transparent 100%)',
            backgroundSize: '200px 100%',
          }}
        />
      </div>

      {/* Label placeholder */}
      <div className="bg-paper-2 border-thin border-ink mt-2 opacity-70" style={{ padding: '6px 8px' }}>
        <div className="bg-paper-dark h-3.5 w-3/4 mb-1.5" />
        <div className="bg-paper-dark h-2 w-1/2" />
      </div>
    </div>
  )
}
