import { BarChart3, Film } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

export function Navbar() {
  const location = useLocation()

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-4">
        <Link to="/" className="flex items-center gap-2.5">
          <Film className="h-6 w-6 text-accent" />
          <span className="text-lg font-bold tracking-tight text-text-primary">
            Cine<span className="text-accent">Sentiment</span>
          </span>
        </Link>

        <nav className="ml-6 flex items-center gap-1">
          <Link
            to="/metrics"
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              location.pathname === '/metrics'
                ? 'bg-accent/10 text-accent'
                : 'text-text-muted hover:bg-card hover:text-text-primary'
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            Model Metrics
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <span className="rounded-full bg-card px-3 py-1 text-xs font-medium text-text-muted border border-border">
            BERT AI Model
          </span>
        </div>
      </div>
    </header>
  )
}
