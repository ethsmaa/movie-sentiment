import { describe, it, expect, beforeEach } from 'vitest'
import { useMoviesStore } from './movies.store'

describe('useMoviesStore', () => {
  beforeEach(() => {
    useMoviesStore.getState().resetFilters()
  })

  it('starts with empty search, empty genre and page 1', () => {
    const { filter } = useMoviesStore.getState()
    expect(filter).toEqual({ search: '', genre: '', page: 1 })
  })

  it('setSearch updates search and resets page to 1', () => {
    useMoviesStore.getState().setPage(5)
    useMoviesStore.getState().setSearch('inception')
    expect(useMoviesStore.getState().filter).toEqual({
      search: 'inception',
      genre: '',
      page: 1,
    })
  })

  it('setGenre updates genre and resets page to 1', () => {
    useMoviesStore.getState().setPage(3)
    useMoviesStore.getState().setGenre('Drama')
    expect(useMoviesStore.getState().filter).toEqual({
      search: '',
      genre: 'Drama',
      page: 1,
    })
  })

  it('setPage updates page without touching search or genre', () => {
    useMoviesStore.getState().setSearch('matrix')
    useMoviesStore.getState().setGenre('Action')
    useMoviesStore.getState().setPage(4)
    expect(useMoviesStore.getState().filter).toEqual({
      search: 'matrix',
      genre: 'Action',
      page: 4,
    })
  })

  it('resetFilters returns the store to initial state', () => {
    useMoviesStore.getState().setSearch('x')
    useMoviesStore.getState().setGenre('Sci-Fi')
    useMoviesStore.getState().setPage(7)
    useMoviesStore.getState().resetFilters()
    expect(useMoviesStore.getState().filter).toEqual({
      search: '',
      genre: '',
      page: 1,
    })
  })

  it('produces a new filter object on every update (immutability)', () => {
    const before = useMoviesStore.getState().filter
    useMoviesStore.getState().setSearch('a')
    const after = useMoviesStore.getState().filter
    expect(after).not.toBe(before)
  })
})
