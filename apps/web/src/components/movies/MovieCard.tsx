import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { MovieDTO } from '@movie-sentiment/shared'
import { tapeColor, TAPE_COLORS } from '../../lib/utils'

interface VHSTapeProps {
  movie: MovieDTO
  idx?: number
}

function PosterFallback({ title }: { title: string }) {
  return (
    <div className="w-full h-full flex items-center justify-center bg-ink">
      <span className="font-display text-paper text-center px-2 uppercase opacity-70 text-[12px] leading-tight tracking-[0.5px]">
        {title}
      </span>
    </div>
  )
}

export function VHSTape({ movie, idx = 0 }: VHSTapeProps) {
  const [imgError, setImgError] = useState(false)
  const labelColor = tapeColor(idx)
  const imdb = movie.voteAverage ? movie.voteAverage.toFixed(1) : null
  const hypeNum = movie.voteAverage ? Math.round(movie.voteAverage * 10) : null

  return (
    <Link
      to={`/movie/${movie.id}`}
      className="group block bg-ink border-thin border-ink shadow-vhs-sm"
      style={{
        padding: 8,
        transition: 'transform 180ms cubic-bezier(0.2,0.8,0.2,1), box-shadow 180ms cubic-bezier(0.2,0.8,0.2,1)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-3px) scale(1.01)'
        e.currentTarget.style.boxShadow = '4px 4px 0 #1b1612'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = ''
        e.currentTarget.style.boxShadow = ''
      }}
    >
      {/* Rainbow stripe band */}
      <div className="flex h-2 mb-2">
        {TAPE_COLORS.map((c, i) => (
          <div key={i} className="flex-1" style={{ background: c }} />
        ))}
      </div>

      {/* Poster */}
      <div className="relative border-thin border-ink" style={{ aspectRatio: '2/3', overflow: 'hidden' }}>
        {imgError || !movie.posterUrl ? (
          <PosterFallback title={movie.title} />
        ) : (
          <img
            src={movie.posterUrl}
            alt={movie.title}
            className="w-full h-full object-cover block"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        )}

        {/* Hover play overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-180"
          style={{ background: 'rgba(27,22,18,0.55)' }}>
          <div style={{
            width: 0, height: 0,
            borderTop: '14px solid transparent',
            borderBottom: '14px solid transparent',
            borderLeft: '22px solid #efe5cd',
          }} />
        </div>

        {/* IMDB badge */}
        {imdb && (
          <div className="absolute top-2 right-2 bg-amber border-thin border-ink font-mono font-bold text-ink"
            style={{ padding: '2px 6px', fontSize: 10, letterSpacing: 0.5 }}>
            ★ {imdb}
          </div>
        )}
      </div>

      {/* Sticker label */}
      <div className="relative bg-paper-2 border-thin border-ink mt-2" style={{ padding: '6px 8px' }}>
        {/* Left color accent bar */}
        <div className="absolute top-0 left-0 bottom-0 w-1" style={{ background: labelColor }} />
        <div className="pl-1.5">
          <div className="font-display text-ink text-tape uppercase truncate">
            {movie.title}
          </div>
          <div className="flex justify-between mt-0.5 font-mono text-ink-soft text-meta-xs tracking-[0.5px]">
            <span>
              {movie.year} · {movie.genres.slice(0, 2).join(' · ').toUpperCase()}
            </span>
            {hypeNum !== null && (
              <span className="font-bold" style={{ color: labelColor }}>
                HYPE {hypeNum}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}

export { VHSTape as MovieCard }
