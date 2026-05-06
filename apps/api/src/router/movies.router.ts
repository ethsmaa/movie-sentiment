import { router, publicProcedure } from '../trpc.js'
import { MovieListInputSchema, MovieByIdInputSchema } from '../schemas/movie.schema.js'
import {
  listMovies,
  getMovieById,
  getAllGenres,
  getCollectionStats,
} from '../services/movie.service.js'

export const moviesRouter = router({
  list: publicProcedure.input(MovieListInputSchema).query(async ({ input }) => {
    return listMovies(input)
  }),

  byId: publicProcedure.input(MovieByIdInputSchema).query(async ({ input }) => {
    return getMovieById(input.id)
  }),

  genres: publicProcedure.query(async () => {
    return getAllGenres()
  }),

  stats: publicProcedure.query(async () => {
    return getCollectionStats()
  }),
})
