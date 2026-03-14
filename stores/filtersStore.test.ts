import { useFiltersStore } from './filtersStore'

beforeEach(() => {
  useFiltersStore.getState().clearFilters()
})

describe('filtersStore', () => {
  it('initialise avec des filtres vides', () => {
    const state = useFiltersStore.getState()
    expect(state.searchQuery).toBe('')
    expect(state.mediaType).toBeNull()
    expect(state.status).toBeNull()
    expect(state.tier).toBeNull()
  })

  it('setSearchQuery met à jour la recherche', () => {
    useFiltersStore.getState().setSearchQuery('Inception')
    expect(useFiltersStore.getState().searchQuery).toBe('Inception')
  })

  it('setMediaType met à jour le filtre de type', () => {
    useFiltersStore.getState().setMediaType('film')
    expect(useFiltersStore.getState().mediaType).toBe('film')
  })

  it('setStatus met à jour le filtre de statut', () => {
    useFiltersStore.getState().setStatus('watched')
    expect(useFiltersStore.getState().status).toBe('watched')
  })

  it('setTier met à jour le filtre de tier', () => {
    useFiltersStore.getState().setTier('gold')
    expect(useFiltersStore.getState().tier).toBe('gold')
  })

  it('clearFilters remet tous les filtres à zéro', () => {
    useFiltersStore.getState().setSearchQuery('test')
    useFiltersStore.getState().setMediaType('livre')
    useFiltersStore.getState().setStatus('owned')
    useFiltersStore.getState().setTier('bronze')
    useFiltersStore.getState().clearFilters()
    const state = useFiltersStore.getState()
    expect(state.searchQuery).toBe('')
    expect(state.mediaType).toBeNull()
    expect(state.status).toBeNull()
    expect(state.tier).toBeNull()
  })

  it('les filtres peuvent être null (désactivés)', () => {
    useFiltersStore.getState().setMediaType('film')
    useFiltersStore.getState().setMediaType(null)
    expect(useFiltersStore.getState().mediaType).toBeNull()
  })
})
