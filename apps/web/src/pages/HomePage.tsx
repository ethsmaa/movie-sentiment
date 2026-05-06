import { useState } from 'react'
import { trpc } from '../lib/trpc'
import { useMoviesStore } from '../store/movies.store'
import { MovieGrid } from '../components/movies/MovieGrid'

export function VideoClubFooter({
  children,
  right = 'v1.0 · DISTILBERT-IMDB',
}: {
  children: React.ReactNode
  right?: string
}) {
  return (
    <div className="bg-ink text-paper font-mono text-meta-sm tracking-[1.5px] px-8 flex justify-between"
      style={{ paddingTop: 14, paddingBottom: 14 }}>
      <span>{children}</span>
      <span>{right}</span>
    </div>
  )
}

const FALLBACK_GENRES = ['ALL', 'DRAMA', 'COMEDY', 'ACTION', 'SCI-FI', 'HORROR', 'THRILLER']

export function HomePage() {
  const { filter, setSearch, setGenre } = useMoviesStore()
  const { data: genreList } = trpc.movies.genres.useQuery()
  const [localSearch, setLocalSearch] = useState(filter.search)

  const displayGenres = genreList
    ? ['ALL', ...genreList.slice(0, 6).map((g) => g.toUpperCase())]
    : FALLBACK_GENRES

  const activeGenre = filter.genre ? filter.genre.toUpperCase() : 'ALL'

  const handleSearch = (val: string) => {
    setLocalSearch(val)
    setSearch(val)
  }

  const handleGenre = (g: string) => {
    setGenre(g === 'ALL' ? '' : g.charAt(0).toUpperCase() + g.slice(1).toLowerCase())
  }

  return (
    <main className="bg-paper text-ink min-h-screen">

      {/* ── Hero ── */}
      <section className="border-b border-dashed border-ink" style={{ padding: '40px 32px 24px' }}>
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-10">

          {/* Left: headline copy */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-px bg-red" />
              <span className="font-mono text-red text-meta-sm tracking-[2px] uppercase">
                Now Showing · Vol. 01
              </span>
            </div>

            <h1 className="font-display text-ink uppercase m-0"
              style={{ fontSize: 'clamp(56px, 6.67vw, 96px)', lineHeight: 0.92, letterSpacing: -0.5 }}>
              What the world
              <br />
              <span className="text-red italic">really thinks.</span>
            </h1>

            <p className="font-body text-ink-soft mt-4 max-w-[500px]"
              style={{ fontSize: 14, lineHeight: 1.5 }}>
              Audience sentiment across the greatest films, processed through
              transformer-based NLP to surface what critics miss. A weekly bulletin
              from the projection booth.
            </p>
          </div>

          {/* Right: ADMIT ONE ticket */}
          <AdmitOneTicket />
        </div>
      </section>

      {/* ── Search + Genre chips ── */}
      <section className="border-b border-ink flex flex-wrap items-center gap-3 px-8"
        style={{ paddingTop: 20, paddingBottom: 20 }}>
        <div className="flex flex-1 items-center gap-2.5 bg-paper-2 border border-ink min-w-[240px]"
          style={{ padding: '10px 14px' }}>
          <span className="font-mono text-ink-soft text-meta tracking-[1px] shrink-0">SEARCH ▸</span>
          <input
            type="text"
            value={localSearch}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="title, director, year…"
            className="font-body text-ink bg-transparent flex-1 outline-none placeholder:text-ink-soft text-body-sm"
          />
          {localSearch && (
            <button
              onClick={() => handleSearch('')}
              className="font-mono text-ink-soft text-meta shrink-0 cursor-pointer hover:text-ink"
            >
              ×
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {displayGenres.map((g) => {
            const active = g === activeGenre
            return (
              <button
                key={g}
                onClick={() => handleGenre(g)}
                className={`font-mono text-meta-sm tracking-[1.4px] uppercase cursor-pointer border border-ink transition-colors duration-120 ${
                  active
                    ? 'bg-ink text-paper'
                    : 'bg-transparent text-ink hover:bg-paper-dark'
                }`}
                style={{ padding: '8px 12px' }}
              >
                {g}
              </button>
            )
          })}
        </div>
      </section>

      {/* ── Section header ── */}
      <div className="flex justify-between items-baseline px-8" style={{ paddingTop: 32, paddingBottom: 16 }}>
        <div className="font-display text-ink text-d-xs uppercase tracking-[0.5px]">
          THE COLLECTION
        </div>
        <div className="font-mono text-ink-soft text-meta tracking-[1px]">
          SORTED BY HYPE
        </div>
      </div>

      <MovieGrid />

      <VideoClubFooter>
        ★ CINESENTIMENT VIDEO CLUB ★ MEMBERS ONLY ★ NO LATE FEES ★ BE KIND, REWIND ★
      </VideoClubFooter>
    </main>
  )
}

function AdmitOneTicket() {
  return (
    <div className="relative bg-amber border-2 border-ink shadow-vhs shrink-0"
      style={{ padding: '14px 20px', minWidth: 220 }}>
      {/* Left perforation */}
      <div className="absolute bg-paper border-2 border-ink rounded-full"
        style={{ top: '50%', left: -8, width: 14, height: 14, transform: 'translateY(-50%)' }} />
      {/* Right perforation */}
      <div className="absolute bg-paper border-2 border-ink rounded-full"
        style={{ top: '50%', right: -8, width: 14, height: 14, transform: 'translateY(-50%)' }} />

      <div className="font-mono text-ink text-meta-xxs tracking-[1.5px]">NO. 4672698</div>
      <div className="font-display text-ink mt-1" style={{ fontSize: 32, lineHeight: 1 }}>ADMIT ONE</div>
      <div className="font-mono text-ink text-meta-xs border-t border-dashed border-ink mt-2 pt-1.5 flex justify-between">
        <span>FILMS · 20</span>
        <span>REVIEWS · 346</span>
      </div>
    </div>
  )
}
