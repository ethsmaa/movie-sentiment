import { Link } from 'react-router-dom'
import type { MovieDTO } from '@movie-sentiment/shared'
import { Star, Clock } from 'lucide-react'
import { formatRuntime } from '../../lib/utils'

interface MovieCardProps {
  movie: MovieDTO
}

export function MovieCard({ movie }: MovieCardProps) {
  return (
    <Link
      to={`/movie/${movie.id}`}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:border-accent/30 hover:shadow-lg hover:shadow-accent/10 animate-fade-in"
    >
      <div className="relative aspect-[2/3] overflow-hidden bg-border">
        <img
          src={movie.posterUrl}
          alt={movie.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        {movie.voteAverage && (
          <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-background/80 px-2 py-0.5 text-xs font-semibold text-accent backdrop-blur-sm">
            <Star className="h-3 w-3 fill-accent" />
            {movie.voteAverage.toFixed(1)}
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-card to-transparent" />
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <h3 className="line-clamp-1 text-sm font-semibold text-text-primary group-hover:text-accent transition-colors">
          {movie.title}
        </h3>
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <span>{movie.year}</span>
          {movie.runtime && (
            <>
              <span>·</span>
              <Clock className="h-3 w-3" />
              <span>{formatRuntime(movie.runtime)}</span>
            </>
          )}
        </div>
        <div className="flex flex-wrap gap-1 mt-1">
          {movie.genres.slice(0, 2).map((genre) => (
            <span
              key={genre}
              className="rounded-full bg-background px-2 py-0.5 text-[10px] font-medium text-text-muted"
            >
              {genre}
            </span>
          ))}
        </div>
      </div>
    </Link>
  )
}
