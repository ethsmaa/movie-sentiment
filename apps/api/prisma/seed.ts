import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import { createRequire } from 'module'
import { analyzeMovieSentiment } from '../src/services/sentiment.service.js'

const require = createRequire(import.meta.url)
const moviesData = require('../src/data/mock-movies.json')
const reviewsData = require('../src/data/mock-reviews.json')

const prisma = new PrismaClient()

const MockMovieSchema = z.object({
  externalId: z.string(),
  title: z.string(),
  originalTitle: z.string().optional(),
  year: z.number(),
  posterUrl: z.string().url(),
  backdropUrl: z.string().url().optional(),
  overview: z.string(),
  genres: z.array(z.string()),
  language: z.string(),
  runtime: z.number().optional(),
  voteAverage: z.number().optional(),
})

const MockReviewSchema = z.object({
  externalId: z.string(),
  movieExternalId: z.string(),
  author: z.string(),
  text: z.string(),
  rating: z.number().optional(),
})

async function main() {
  console.log('Seeding database...')

  const movies = z.array(MockMovieSchema).parse(moviesData)
  const reviews = z.array(MockReviewSchema).parse(reviewsData)

  await prisma.movie.deleteMany()
  console.log(`Inserting ${movies.length} movies...`)

  for (const movie of movies) {
    await prisma.movie.create({ data: movie })
  }

  const allMovies = await prisma.movie.findMany()
  const movieMap = new Map(allMovies.map((m) => [m.externalId, m.id]))

  console.log(`Inserting ${reviews.length} reviews...`)
  for (const review of reviews) {
    const movieId = movieMap.get(review.movieExternalId)
    if (!movieId) continue

    await prisma.review.create({
      data: {
        externalId: review.externalId,
        movieId,
        author: review.author,
        text: review.text,
        rating: review.rating,
      },
    })
  }

  console.log('Analyzing sentiment for all movies...')
  for (const movie of allMovies) {
    await analyzeMovieSentiment(movie.id, true)
    console.log(`  Analyzed: ${movie.title}`)
  }

  console.log('Seed complete!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
