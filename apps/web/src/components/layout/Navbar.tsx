import { Link, useLocation } from 'react-router-dom'

export function VideoClubHeader() {
  const location = useLocation()
  const isFilms = location.pathname === '/' || location.pathname.startsWith('/movie')
  const isAnalyze = location.pathname === '/analyze'
  const isTheModel = location.pathname === '/the-model'
  const isMetrics = location.pathname === '/metrics'

  return (
    <header className="bg-paper flex items-center justify-between px-8 border-b border-ink"
      style={{ paddingTop: 14, paddingBottom: 14 }}>
      <div className="flex items-center gap-3.5">
        <Link
          to="/"
          className="font-display text-ink text-[26px] leading-none tracking-[1px] pt-0.5"
        >
          CINESENTIMENT
        </Link>
        <div className="font-mono text-red border border-red text-meta-xs px-1.5 py-[3px] uppercase tracking-[1.5px]">
          Video Club · Est. 2026
        </div>
      </div>

      <div className="flex items-center gap-6">
        <Link
          to="/"
          className={`font-mono text-meta uppercase tracking-[1.4px] transition-colors duration-120 ${
            isFilms
              ? 'text-red underline underline-offset-4'
              : 'text-ink hover:text-red'
          }`}
        >
          Films
        </Link>
        <Link
          to="/analyze"
          className={`font-mono text-meta uppercase tracking-[1.4px] transition-colors duration-120 ${
            isAnalyze
              ? 'text-red underline underline-offset-4'
              : 'text-ink hover:text-red'
          }`}
        >
          Analyze
        </Link>
        <Link
          to="/the-model"
          className={`font-mono text-meta uppercase tracking-[1.4px] transition-colors duration-120 ${
            isTheModel
              ? 'text-red underline underline-offset-4'
              : 'text-ink hover:text-red'
          }`}
        >
          The Model
        </Link>
        <Link
          to="/metrics"
          className={`font-mono text-meta uppercase tracking-[1.4px] transition-colors duration-120 ${
            isMetrics
              ? 'text-red underline underline-offset-4'
              : 'text-ink hover:text-red'
          }`}
        >
          Model Metrics
        </Link>
        <div className="font-mono text-ink-soft text-meta-sm tracking-[1px]">
          DISTILBERT · IMDB
        </div>
      </div>
    </header>
  )
}

export { VideoClubHeader as Navbar }
