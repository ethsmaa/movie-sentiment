import { useMoviesStore } from '../../store/movies.store'
import { trpc } from '../../lib/trpc'
import { VHSTape } from './MovieCard'
import { MovieCardSkeleton } from './MovieCardSkeleton'

const LIMIT = 20

export function MovieGrid() {
  const { filter, setPage } = useMoviesStore()

  const { data, isLoading } = trpc.movies.list.useQuery({
    page: filter.page,
    limit: LIMIT,
    search: filter.search || undefined,
    genre: filter.genre || undefined,
  })

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-[18px] px-8 pb-[60px]">
        {Array.from({ length: 8 }).map((_, i) => (
          <MovieCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (!data || data.items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center px-8">
        <div className="font-display text-ink text-d-s uppercase tracking-[0.5px]">
          NO TAPES IN STOCK
        </div>
        <p className="font-body text-ink-soft mt-3 text-[14px] leading-normal">
          {filter.search
            ? `No match for "${filter.search}"`
            : 'No films found. Try adjusting your filters.'}
        </p>
        {(filter.search || filter.genre) && (
          <button
            onClick={() => useMoviesStore.getState().resetFilters()}
            className="font-mono text-ink border border-ink text-meta uppercase tracking-[1.4px] mt-6 bg-transparent cursor-pointer hover:bg-ink hover:text-paper transition-colors duration-120"
            style={{ padding: '10px 16px' }}
          >
            CLEAR FILTERS
          </button>
        )}
      </div>
    )
  }

  const totalPages = Math.ceil(data.total / LIMIT)

  return (
    <div className="pb-[60px]">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-[18px] px-8">
        {data.items.map((movie, i) => (
          <VHSTape key={movie.id} movie={movie} idx={i} />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center mt-8">
          <button
            onClick={() => setPage(filter.page - 1)}
            disabled={filter.page === 1}
            className="font-mono text-ink bg-transparent border border-ink text-xs w-9 h-9 flex items-center justify-center border-r-0 disabled:opacity-30 hover:bg-ink hover:text-paper transition-colors duration-120"
          >
            ←
          </button>
          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`font-mono text-xs w-9 h-9 flex items-center justify-center border border-ink border-r-0 transition-colors duration-120 last:border-r ${
                p === filter.page
                  ? 'bg-ink text-paper'
                  : 'bg-transparent text-ink hover:bg-paper-dark'
              }`}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setPage(filter.page + 1)}
            disabled={filter.page === totalPages}
            className="font-mono text-ink bg-transparent border border-ink text-xs w-9 h-9 flex items-center justify-center disabled:opacity-30 hover:bg-ink hover:text-paper transition-colors duration-120"
          >
            →
          </button>
        </div>
      )}
    </div>
  )
}
