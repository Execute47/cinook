import { create } from 'zustand'
import type { MediaType, ItemStatus } from '../types/media'

interface FiltersState {
  searchQuery: string
  mediaType: MediaType | null
  status: ItemStatus | null
  setSearchQuery: (query: string) => void
  setMediaType: (type: MediaType | null) => void
  setStatus: (status: ItemStatus | null) => void
  clearFilters: () => void
}

export const useFiltersStore = create<FiltersState>((set) => ({
  searchQuery: '',
  mediaType: null,
  status: null,
  setSearchQuery: (searchQuery) => set(() => ({ searchQuery })),
  setMediaType: (mediaType) => set(() => ({ mediaType })),
  setStatus: (status) => set(() => ({ status })),
  clearFilters: () => set(() => ({ searchQuery: '', mediaType: null, status: null })),
}))
