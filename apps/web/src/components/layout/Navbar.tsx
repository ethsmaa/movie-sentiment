import { Film } from 'lucide-react'
import { Link } from 'react-router-dom'

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-4">
        <Link to="/" className="flex items-center gap-2.5">
          <Film className="h-6 w-6 text-accent" />
          <span className="text-lg font-bold tracking-tight text-text-primary">
            Cine<span className="text-accent">Sentiment</span>
          </span>
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <span className="rounded-full bg-card px-3 py-1 text-xs font-medium text-text-muted border border-border">
            BERT AI Model
          </span>
        </div>
      </div>
    </header>
  )
}
