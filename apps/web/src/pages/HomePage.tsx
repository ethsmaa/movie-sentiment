import { MovieSearchBar } from '../components/movies/MovieSearchBar'
import { MovieGrid } from '../components/movies/MovieGrid'
import { Sparkles } from 'lucide-react'

export function HomePage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8 flex flex-col gap-2 animate-slide-up">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-accent" />
          <span className="text-xs font-semibold uppercase tracking-widest text-accent">
            AI-Powered Sentiment Analysis
          </span>
        </div>
        <h1 className="text-3xl font-bold text-text-primary md:text-4xl">
          Global Cinema{' '}
          <span className="bg-gradient-to-r from-accent to-orange-400 bg-clip-text text-transparent">
            Analytics
          </span>
        </h1>
        <p className="text-text-muted">
          Explore audience sentiment across the world's greatest films using BERT AI
        </p>
      </div>

      <div className="mb-6">
        <MovieSearchBar />
      </div>

      <MovieGrid />
    </main>
  )
}
