import { create } from 'zustand'
import type { MediaType, ItemStatus, TierLevel } from '../types/media'

interface FiltersState {
  searchQuery: string
  mediaType: MediaType | null
  status: ItemStatus | null
  tier: TierLevel | null
  setSearchQuery: (query: string) => void
  setMediaType: (type: MediaType | null) => void
  setStatus: (status: ItemStatus | null) => void
  setTier: (tier: TierLevel | null) => void
  clearFilters: () => void
}

export const useFiltersStore = create<FiltersState>((set) => ({
  searchQuery: '',
  mediaType: null,
  status: null,
  tier: null,
  setSearchQuery: (searchQuery) => set(() => ({ searchQuery })),
  setMediaType: (mediaType) => set(() => ({ mediaType })),
  setStatus: (status) => set(() => ({ status })),
  setTier: (tier) => set(() => ({ tier })),
  clearFilters: () => set(() => ({ searchQuery: '', mediaType: null, status: null, tier: null })),
}))
