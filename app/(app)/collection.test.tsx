import React from 'react'
import { render } from '@testing-library/react-native'

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
}))

jest.mock('@/lib/firebase', () => ({ auth: {}, db: {} }))
jest.mock('@/lib/auth', () => ({ signInWithGoogle: jest.fn() }))

jest.mock('@shopify/flash-list', () => {
  const { FlatList } = require('react-native')
  return { FlashList: FlatList }
})

const mockItems = [
  { id: '1', title: 'Matrix', type: 'film', statuses: ['owned'], tier: 'none', addedVia: 'search', director: 'Wachowski', endedAt: { toMillis: () => 1700000000000 } },
  { id: '2', title: 'Dune', type: 'livre', statuses: ['watched'], tier: 'none', addedVia: 'scan', author: 'Herbert', endedAt: { toMillis: () => 1600000000000 } },
  { id: '3', title: 'Breaking Bad', type: 'serie', statuses: ['owned'], tier: 'none', addedVia: 'manual' },
  { id: '4', title: 'Blade Runner', type: 'film', statuses: ['owned'], tier: 'none', addedVia: 'search', director: 'Scott' },
  { id: '5', title: 'Titanic', type: 'serie', statuses: ['owned'], tier: 'gold', addedVia: 'manual' },
  { id: '6', title: 'Vertigo', type: 'serie', statuses: ['owned'], tier: 'gold', addedVia: 'manual' },
  { id: '7', title: 'Psycho', type: 'serie', statuses: ['owned'], tier: 'bronze', addedVia: 'manual' },
  { id: '8', title: 'Alien', type: 'serie', statuses: ['owned'], tier: 'bronze', addedVia: 'manual' },
  { id: '9', title: 'Moonlight', type: 'livre', statuses: ['borrowed'], tier: 'none', addedVia: 'manual' },
]

jest.mock('@/hooks/useCollection', () => ({
  useCollection: () => ({ items: mockItems, loading: false, error: null }),
}))

jest.mock('@/components/media/ItemCard', () => {
  const { Text } = require('react-native')
  return ({ item }: { item: { title: string } }) => <Text testID="item-card">{item.title}</Text>
})

jest.mock('@/components/ui/EmptyState', () => {
  const { Text } = require('react-native')
  return ({ message }: { message: string }) => <Text testID="empty-state">{message}</Text>
})

import { useFiltersStore } from '@/stores/filtersStore'

beforeEach(() => useFiltersStore.getState().clearFilters())

import CollectionScreen from './collection'

describe('CollectionScreen — filtrage exact', () => {
  it('affiche tous les items sans filtre', () => {
    const { getAllByTestId } = render(<CollectionScreen />)
    expect(getAllByTestId('item-card')).toHaveLength(9)
  })

  it('filtre par type seul', () => {
    useFiltersStore.getState().setMediaType('film')
    const { getAllByTestId } = render(<CollectionScreen />)
    expect(getAllByTestId('item-card')).toHaveLength(2)
  })

  it('filtre par statut seul', () => {
    useFiltersStore.getState().setStatus('watched')
    const { getAllByTestId } = render(<CollectionScreen />)
    expect(getAllByTestId('item-card')).toHaveLength(1)
    expect(getAllByTestId('item-card')[0].props.children).toBe('Dune')
  })

  it('filtre par statut borrowed', () => {
    useFiltersStore.getState().setStatus('borrowed')
    const { getAllByTestId } = render(<CollectionScreen />)
    expect(getAllByTestId('item-card')).toHaveLength(1)
    expect(getAllByTestId('item-card')[0].props.children).toBe('Moonlight')
  })

  it('combine type + statut → aucun résultat', () => {
    useFiltersStore.getState().setMediaType('film')
    useFiltersStore.getState().setStatus('watched')
    const { queryAllByTestId, getByTestId } = render(<CollectionScreen />)
    expect(queryAllByTestId('item-card')).toHaveLength(0)
    expect(getByTestId('empty-state')).toBeTruthy()
  })

  it('filtre par tier gold', () => {
    useFiltersStore.getState().setTier('gold')
    const { getAllByTestId } = render(<CollectionScreen />)
    expect(getAllByTestId('item-card')).toHaveLength(2)
  })

  it('clearFilters → tous items visibles', () => {
    useFiltersStore.getState().setSearchQuery('Matrix')
    useFiltersStore.getState().clearFilters()
    const { getAllByTestId } = render(<CollectionScreen />)
    expect(getAllByTestId('item-card')).toHaveLength(9)
  })

  it('clearFilters remet tier à null', () => {
    useFiltersStore.getState().setTier('diamond')
    useFiltersStore.getState().clearFilters()
    expect(useFiltersStore.getState().tier).toBeNull()
  })
})

describe('CollectionScreen — tri endedAt', () => {
  it('tri endedAt — recents en premier, sans date en dernier', () => {
    const { getAllByTestId } = render(<CollectionScreen />)
    const cards = getAllByTestId('item-card')
    // Matrix (endedAt: 1700000000000) doit être avant Dune (endedAt: 1600000000000)
    expect(cards[0].props.children).toBe('Matrix')
    expect(cards[1].props.children).toBe('Dune')
    // Les items sans endedAt suivent
    const remaining = cards.slice(2).map((c) => c.props.children)
    expect(remaining).not.toContain('Matrix')
    expect(remaining).not.toContain('Dune')
  })
})

describe('CollectionScreen — recherche floue (AC3, AC4, AC5, AC6)', () => {
  it('AC5 — query vide → tous les items', () => {
    useFiltersStore.getState().setSearchQuery('')
    const { getAllByTestId } = render(<CollectionScreen />)
    expect(getAllByTestId('item-card')).toHaveLength(9)
  })

  it('AC3 — recherche exacte "Matrix" → Matrix uniquement', () => {
    useFiltersStore.getState().setSearchQuery('Matrix')
    const { getAllByTestId } = render(<CollectionScreen />)
    const titles = getAllByTestId('item-card').map((n) => n.props.children)
    expect(titles).toContain('Matrix')
    expect(titles).not.toContain('Dune')
  })

  it('AC3 — faute légère "dun" → Dune', () => {
    useFiltersStore.getState().setSearchQuery('dun')
    const { getAllByTestId } = render(<CollectionScreen />)
    const titles = getAllByTestId('item-card').map((n) => n.props.children)
    expect(titles).toContain('Dune')
  })

  it('AC3 — faute légère "blade runr" → Blade Runner', () => {
    useFiltersStore.getState().setSearchQuery('blade runr')
    const { getAllByTestId } = render(<CollectionScreen />)
    const titles = getAllByTestId('item-card').map((n) => n.props.children)
    expect(titles).toContain('Blade Runner')
  })

  it('AC4 — recherche sur le réalisateur "wachow" → Matrix', () => {
    useFiltersStore.getState().setSearchQuery('wachow')
    const { getAllByTestId } = render(<CollectionScreen />)
    const titles = getAllByTestId('item-card').map((n) => n.props.children)
    expect(titles).toContain('Matrix')
  })

  it('AC6 — recherche floue + filtre type se combinent', () => {
    useFiltersStore.getState().setSearchQuery('blade runr')
    useFiltersStore.getState().setMediaType('livre')
    const { queryAllByTestId } = render(<CollectionScreen />)
    expect(queryAllByTestId('item-card')).toHaveLength(0)
  })
})
