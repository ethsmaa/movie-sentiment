import { router } from '../trpc.js'
import { moviesRouter } from './movies.router.js'
import { sentimentRouter } from './sentiment.router.js'

export const appRouter = router({
  movies: moviesRouter,
  sentiment: sentimentRouter,
})

export type AppRouter = typeof appRouter
