import { prisma } from '../lib/prisma.js'
import type { MovieDTO, PaginatedResponse } from '@movie-sentiment/shared'
import type { MovieListInput } from '../schemas/movie.schema.js'

function toMovieDTO(movie: {
  id: string
  externalId: string
  title: string
  originalTitle: string | null
  year: number
  posterUrl: string
  backdropUrl: string | null
  overview: string
  genres: string[]
  language: string
  runtime: number | null
  voteAverage: number | null
}): MovieDTO {
  return {
    id: movie.id,
    externalId: movie.externalId,
    title: movie.title,
    ...(movie.originalTitle !== null ? { originalTitle: movie.originalTitle } : {}),
    year: movie.year,
    posterUrl: movie.posterUrl,
    ...(movie.backdropUrl !== null ? { backdropUrl: movie.backdropUrl } : {}),
    overview: movie.overview,
    genres: movie.genres,
    language: movie.language,
    ...(movie.runtime !== null ? { runtime: movie.runtime } : {}),
    ...(movie.voteAverage !== null ? { voteAverage: movie.voteAverage } : {}),
  }
}

export async function listMovies(input: MovieListInput): Promise<PaginatedResponse<MovieDTO>> {
  const { search, genre, page, limit } = input
  const skip = (page - 1) * limit

  const where = {
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: 'insensitive' as const } },
            { originalTitle: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
    ...(genre ? { genres: { has: genre } } : {}),
  }

  const [items, total] = await Promise.all([
    prisma.movie.findMany({ where, skip, take: limit, orderBy: { year: 'desc' } }),
    prisma.movie.count({ where }),
  ])

  return {
    items: items.map(toMovieDTO),
    total,
    page,
    limit,
  }
}

export async function getMovieById(id: string): Promise<MovieDTO> {
  const movie = await prisma.movie.findUniqueOrThrow({ where: { id } })
  return toMovieDTO(movie)
}

export async function getAllGenres(): Promise<string[]> {
  const movies = await prisma.movie.findMany({ select: { genres: true } })
  const genreSet = new Set<string>()
  movies.forEach((m) => m.genres.forEach((g) => genreSet.add(g)))
  return Array.from(genreSet).sort()
}

export async function getCollectionStats(): Promise<{ movieCount: number; reviewCount: number }> {
  const [movieCount, reviewCount] = await Promise.all([
    prisma.movie.count(),
    prisma.review.count(),
  ])
  return { movieCount, reviewCount }
}
