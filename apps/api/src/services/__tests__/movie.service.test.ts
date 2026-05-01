import { describe, it, expect } from 'vitest'
import { prisma } from './prisma-mock'
import { listMovies, getMovieById, getAllGenres } from '../movie.service.js'

const mockMovie = {
  id: 'movie-1',
  externalId: 'tt0111161',
  title: 'The Shawshank Redemption',
  originalTitle: null,
  year: 1994,
  posterUrl: 'https://example.com/poster.jpg',
  backdropUrl: null,
  overview: 'Two imprisoned men bond.',
  genres: ['Drama'],
  language: 'en',
  runtime: 142,
  voteAverage: 9.3,
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe('listMovies', () => {
  it('returns paginated movies with total count', async () => {
    prisma.movie.findMany.mockResolvedValue([mockMovie])
    prisma.movie.count.mockResolvedValue(1)

    const result = await listMovies({ page: 1, limit: 20 })

    expect(result.items).toHaveLength(1)
    expect(result.total).toBe(1)
    expect(result.page).toBe(1)
    expect(result.limit).toBe(20)
  })

  it('maps null optional fields to absent properties', async () => {
    prisma.movie.findMany.mockResolvedValue([mockMovie])
    prisma.movie.count.mockResolvedValue(1)

    const result = await listMovies({ page: 1, limit: 20 })
    const movie = result.items[0]!

    expect(movie).not.toHaveProperty('originalTitle')
    expect(movie).not.toHaveProperty('backdropUrl')
    expect(movie.runtime).toBe(142)
    expect(movie.voteAverage).toBe(9.3)
  })

  it('applies search filter to query', async () => {
    prisma.movie.findMany.mockResolvedValue([])
    prisma.movie.count.mockResolvedValue(0)

    await listMovies({ page: 1, limit: 20, search: 'inception' })

    expect(prisma.movie.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ OR: expect.any(Array) }),
      }),
    )
  })

  it('applies genre filter to query', async () => {
    prisma.movie.findMany.mockResolvedValue([])
    prisma.movie.count.mockResolvedValue(0)

    await listMovies({ page: 1, limit: 20, genre: 'Drama' })

    expect(prisma.movie.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ genres: { has: 'Drama' } }),
      }),
    )
  })

  it('calculates correct skip for page 2', async () => {
    prisma.movie.findMany.mockResolvedValue([])
    prisma.movie.count.mockResolvedValue(0)

    await listMovies({ page: 2, limit: 10 })

    expect(prisma.movie.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 10, take: 10 }),
    )
  })
})

describe('getMovieById', () => {
  it('returns a single movie by id', async () => {
    prisma.movie.findUniqueOrThrow.mockResolvedValue(mockMovie)

    const result = await getMovieById('movie-1')

    expect(result.id).toBe('movie-1')
    expect(result.title).toBe('The Shawshank Redemption')
    expect(prisma.movie.findUniqueOrThrow).toHaveBeenCalledWith({
      where: { id: 'movie-1' },
    })
  })
})

describe('getAllGenres', () => {
  it('returns sorted unique genres', async () => {
    prisma.movie.findMany.mockResolvedValue([
      { genres: ['Drama', 'Crime'] },
      { genres: ['Drama', 'Thriller'] },
      { genres: ['Comedy'] },
    ] as never)

    const result = await getAllGenres()

    expect(result).toEqual(['Comedy', 'Crime', 'Drama', 'Thriller'])
  })

  it('returns empty array when no movies exist', async () => {
    prisma.movie.findMany.mockResolvedValue([])

    const result = await getAllGenres()

    expect(result).toEqual([])
  })
})
