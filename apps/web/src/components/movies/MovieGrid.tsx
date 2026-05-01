import { useMoviesStore } from '../../store/movies.store'
import { trpc } from '../../lib/trpc'
import { MovieCard } from './MovieCard'
import { MovieCardSkeleton } from './MovieCardSkeleton'
import { ChevronLeft, ChevronRight, Film } from 'lucide-react'

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
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {Array.from({ length: 20 }).map((_, i) => (
          <MovieCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (!data || data.items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <Film className="h-16 w-16 text-text-muted/30" />
        <p className="text-lg font-medium text-text-muted">No movies found</p>
        <p className="text-sm text-text-muted/60">Try adjusting your search or genre filter</p>
      </div>
    )
  }

  const totalPages = Math.ceil(data.total / LIMIT)

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {data.items.map((movie) => (
          <MovieCard key={movie.id} movie={movie} />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setPage(filter.page - 1)}
            disabled={filter.page === 1}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-text-muted transition-colors hover:border-accent/30 hover:text-text-primary disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm text-text-muted">
            {filter.page} / {totalPages}
          </span>
          <button
            onClick={() => setPage(filter.page + 1)}
            disabled={filter.page === totalPages}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-text-muted transition-colors hover:border-accent/30 hover:text-text-primary disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}
