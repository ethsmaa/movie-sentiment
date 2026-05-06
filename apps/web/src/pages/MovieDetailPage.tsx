import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { trpc } from '../lib/trpc'
import { SentimentDashboard } from '../components/sentiment/SentimentDashboard'
import { formatRuntime, TAPE_COLORS } from '../lib/utils'
import { VideoClubFooter } from './HomePage'

export function MovieDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [imgError, setImgError] = useState(false)

  const { data: movie, isLoading } = trpc.movies.byId.useQuery(
    { id: id! },
    { enabled: !!id },
  )

  if (isLoading) {
    return (
      <div className="bg-paper min-h-screen">
        <LoadingSkeleton />
      </div>
    )
  }

  if (!movie) {
    return (
      <div className="bg-paper min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="font-display text-ink text-d-s uppercase tracking-[0.5px]">
          REEL NOT FOUND
        </div>
        <p className="font-body text-ink-soft text-[14px]">
          We couldn't locate that film in the archive.
        </p>
        <button
          onClick={() => navigate('/')}
          className="font-mono text-ink border border-ink text-meta uppercase tracking-[1.4px] bg-transparent cursor-pointer hover:bg-ink hover:text-paper transition-colors duration-120"
          style={{ padding: '10px 16px' }}
        >
          ← BACK TO COLLECTION
        </button>
      </div>
    )
  }

  const runtime = movie.runtime ? formatRuntime(movie.runtime) : null
  const genres = movie.genres ?? []

  return (
    <main className="bg-paper text-ink min-h-screen">
      {/* Breadcrumb */}
      <div className="px-8 pt-5 pb-0">
        <button
          onClick={() => navigate(-1)}
          className="font-mono text-ink-soft text-meta tracking-[1px] uppercase cursor-pointer hover:text-red transition-colors duration-120 bg-transparent border-0"
        >
          ← BACK TO COLLECTION
        </button>
      </div>

      {/* Top section: poster + title block */}
      <section className="border-b border-ink px-8 pt-6 pb-8">
        <div className="grid gap-8" style={{ gridTemplateColumns: '300px 1fr' }}>

          {/* Left: tape poster + spec table */}
          <div>
            {/* Large tape card */}
            <div className="bg-ink shadow-vhs" style={{ padding: 8 }}>
              {/* Stripe */}
              <div className="flex h-2 mb-2">
                {TAPE_COLORS.map((c, i) => (
                  <div key={i} className="flex-1" style={{ background: c }} />
                ))}
              </div>
              {imgError || !movie.posterUrl ? (
                <div className="flex items-center justify-center" style={{ aspectRatio: '2/3', background: '#3d342a' }}>
                  <span className="font-display text-paper text-[12px] uppercase opacity-70 text-center px-2">
                    {movie.title}
                  </span>
                </div>
              ) : (
                <img
                  src={movie.posterUrl}
                  alt={movie.title}
                  className="w-full block"
                  onError={() => setImgError(true)}
                />
              )}
            </div>

            {/* Spec table */}
            <div className="bg-paper-2 border border-ink mt-4">
              {[
                ['IMDB', movie.voteAverage ? `★ ${movie.voteAverage.toFixed(1)}` : '—'],
                ['RUNTIME', runtime ?? '—'],
                ['LANGUAGE', movie.language?.toUpperCase() ?? '—'],
                ['YEAR', String(movie.year)],
              ].map(([label, value], i) => (
                <div
                  key={label}
                  className={`flex justify-between font-mono text-meta tracking-[1px] ${
                    i < 3 ? 'border-b border-dashed border-ink' : ''
                  }`}
                  style={{ padding: '10px 14px' }}
                >
                  <span className="text-ink-soft">{label}</span>
                  <span className="text-ink font-bold">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: title + sentiment cards */}
          <div>
            {/* Genre chips */}
            <div className="flex flex-wrap gap-2 mb-3.5">
              {genres.map((g) => (
                <span
                  key={g}
                  className="font-mono text-ink border border-ink text-meta-xs tracking-[1.5px] uppercase"
                  style={{ padding: '3px 8px' }}
                >
                  {g}
                </span>
              ))}
            </div>

            {/* Film title — display XL */}
            <h1
              className="font-display text-ink uppercase m-0"
              style={{
                fontSize: 'clamp(64px, 8.33vw, 120px)',
                lineHeight: 0.9,
                letterSpacing: -1,
              }}
            >
              {movie.title}
            </h1>

            {/* Subtitle */}
            <div
              className="font-serif italic text-red mt-2"
              style={{ fontSize: 22 }}
            >
              {movie.year}
              {movie.originalTitle && movie.originalTitle !== movie.title
                ? ` · ${movie.originalTitle}`
                : ''}
            </div>

            {/* Overview */}
            {movie.overview && (
              <p
                className="font-body text-ink-soft mt-5 max-w-[560px]"
                style={{ fontSize: 14, lineHeight: 1.6 }}
              >
                {movie.overview}
              </p>
            )}

            {/* Sentiment sub-components injected here */}
            {id && <SentimentDashboard movieId={id} />}
          </div>
        </div>
      </section>

      <VideoClubFooter
        right="NEXT REEL ▸"
      >
        ★ FILE NO. {id?.toUpperCase()} ★ ANALYZED {new Date().getFullYear()} ★
      </VideoClubFooter>
    </main>
  )
}

function LoadingSkeleton() {
  return (
    <div className="px-8 pt-6 pb-8">
      <div className="bg-paper-dark animate-pulse h-4 w-40 mb-6" />
      <div className="grid gap-8" style={{ gridTemplateColumns: '300px 1fr' }}>
        <div className="bg-paper-dark animate-pulse" style={{ aspectRatio: '2/3' }} />
        <div className="flex flex-col gap-4">
          <div className="bg-paper-dark animate-pulse h-24 w-full" />
          <div className="bg-paper-dark animate-pulse h-10 w-3/4" />
          <div className="bg-paper-dark animate-pulse h-4 w-full" />
          <div className="bg-paper-dark animate-pulse h-4 w-5/6" />
        </div>
      </div>
    </div>
  )
}
