import { useParams, useNavigate } from 'react-router-dom'
import { trpc } from '../lib/trpc'
import { SentimentDashboard } from '../components/sentiment/SentimentDashboard'
import { ArrowLeft, Star, Clock, Globe, Loader2 } from 'lucide-react'
import { formatRuntime } from '../lib/utils'

export function MovieDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: movie, isLoading } = trpc.movies.byId.useQuery(
    { id: id! },
    { enabled: !!id },
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-3 py-32 text-text-muted">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  if (!movie) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 text-center text-text-muted">
        Movie not found
      </div>
    )
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 animate-fade-in">
      <button
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center gap-2 text-sm text-text-muted transition-colors hover:text-text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Movies
      </button>

      <div className="mb-8 flex flex-col gap-6 sm:flex-row">
        <div className="flex-shrink-0">
          <img
            src={movie.posterUrl}
            alt={movie.title}
            className="w-32 rounded-xl border border-border sm:w-44"
          />
        </div>
        <div className="flex flex-col gap-3">
          <div>
            <h1 className="text-2xl font-bold text-text-primary sm:text-3xl">{movie.title}</h1>
            {movie.originalTitle && movie.originalTitle !== movie.title && (
              <p className="text-sm italic text-text-muted">{movie.originalTitle}</p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-text-muted">
            <span className="font-medium text-text-primary">{movie.year}</span>
            {movie.runtime && (
              <div className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {formatRuntime(movie.runtime)}
              </div>
            )}
            {movie.voteAverage && (
              <div className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-accent text-accent" />
                <span className="font-semibold text-accent">{movie.voteAverage.toFixed(1)}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Globe className="h-3.5 w-3.5" />
              <span className="uppercase">{movie.language}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {movie.genres.map((genre) => (
              <span
                key={genre}
                className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-text-muted"
              >
                {genre}
              </span>
            ))}
          </div>
          <p className="max-w-2xl text-sm leading-relaxed text-text-muted">{movie.overview}</p>
        </div>
      </div>

      <div className="border-t border-border pt-6">
        <h2 className="mb-6 flex items-center gap-3 text-xl font-bold text-text-primary">
          <span className="inline-block h-1 w-6 rounded-full bg-accent" />
          Sentiment Analysis
        </h2>
        {id && <SentimentDashboard movieId={id} />}
      </div>
    </main>
  )
}
