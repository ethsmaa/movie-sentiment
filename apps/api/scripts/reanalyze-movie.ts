/**
 * Trigger fresh sentiment analysis on demand. Useful for invalidating cached
 * MovieSentimentSummary rows after a model upgrade without re-seeding the
 * entire database.
 *
 * Usage:
 *   pnpm --filter @movie-sentiment/api exec tsx scripts/reanalyze-movie.ts <movieId>
 *   pnpm --filter @movie-sentiment/api exec tsx scripts/reanalyze-movie.ts --all
 *
 * Requires SENTIMENT_SERVICE_URL to point at a running FastAPI sidecar (or it
 * silently falls back to the local simulator — see bert-client.ts).
 */
import { prisma } from '../src/lib/prisma.js'
import { analyzeMovieSentiment } from '../src/services/sentiment.service.js'

async function reanalyzeAll() {
  const movies = await prisma.movie.findMany({ select: { id: true, title: true } })
  console.log(`Reanalyzing ${movies.length} movies…`)

  const startedAt = Date.now()
  for (let i = 0; i < movies.length; i++) {
    const movie = movies[i]
    if (!movie) continue
    process.stdout.write(`[${i + 1}/${movies.length}] ${movie.title} … `)
    const summary = await analyzeMovieSentiment(movie.id, true)
    console.log(`${summary.totalReviews} reviews · hype=${summary.hypeScore.toFixed(2)}`)
  }

  const elapsed = (Date.now() - startedAt) / 1000
  console.log(`\nDone in ${elapsed.toFixed(1)}s`)
}

async function reanalyzeOne(movieId: string) {
  const result = await analyzeMovieSentiment(movieId, true)
  console.log(JSON.stringify(result, null, 2))
}

async function main() {
  const arg = process.argv[2]
  if (!arg) {
    console.error('Usage: tsx scripts/reanalyze-movie.ts <movieId | --all>')
    process.exit(1)
  }

  if (arg === '--all') {
    await reanalyzeAll()
  } else {
    await reanalyzeOne(arg)
  }
}

main()
  .then(() => process.exit(0))
  .catch((err: unknown) => {
    console.error(err)
    process.exit(1)
  })
