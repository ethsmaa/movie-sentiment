import { Search, X } from 'lucide-react'
import { useMoviesStore } from '../../store/movies.store'
import { trpc } from '../../lib/trpc'

export function MovieSearchBar() {
  const { filter, setSearch, setGenre } = useMoviesStore()
  const { data: genres } = trpc.movies.genres.useQuery()

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          value={filter.search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search movies..."
          className="w-full rounded-lg border border-border bg-card py-2.5 pl-10 pr-10 text-sm text-text-primary placeholder-text-muted outline-none transition-colors focus:border-accent/50"
        />
        {filter.search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <select
        value={filter.genre}
        onChange={(e) => setGenre(e.target.value)}
        className="rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-text-primary outline-none transition-colors focus:border-accent/50 sm:w-44"
      >
        <option value="">All Genres</option>
        {genres?.map((genre) => (
          <option key={genre} value={genre}>
            {genre}
          </option>
        ))}
      </select>
    </div>
  )
}
