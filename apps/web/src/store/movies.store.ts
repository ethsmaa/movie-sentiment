import { create } from 'zustand'

interface MoviesFilter {
  search: string
  genre: string
  page: number
}

interface MoviesStore {
  filter: MoviesFilter
  setSearch: (search: string) => void
  setGenre: (genre: string) => void
  setPage: (page: number) => void
  resetFilters: () => void
}

const initialFilter: MoviesFilter = {
  search: '',
  genre: '',
  page: 1,
}

export const useMoviesStore = create<MoviesStore>((set) => ({
  filter: initialFilter,
  setSearch: (search) => set((state) => ({ filter: { ...state.filter, search, page: 1 } })),
  setGenre: (genre) => set((state) => ({ filter: { ...state.filter, genre, page: 1 } })),
  setPage: (page) => set((state) => ({ filter: { ...state.filter, page } })),
  resetFilters: () => set({ filter: initialFilter }),
}))
