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
  { id: '1', title: 'Matrix', type: 'film', statuses: ['owned'], tier: 'none', addedVia: 'search', director: 'Wachowski' },
  { id: '2', title: 'Dune', type: 'livre', statuses: ['watched'], tier: 'none', addedVia: 'scan', author: 'Herbert' },
  { id: '3', title: 'Breaking Bad', type: 'serie', statuses: ['owned'], tier: 'none', addedVia: 'manual' },
  { id: '4', title: 'Blade Runner', type: 'film', statuses: ['owned'], tier: 'none', addedVia: 'search', director: 'Scott' },
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
    expect(getAllByTestId('item-card')).toHaveLength(4)
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

  it('combine type + statut → aucun résultat', () => {
    useFiltersStore.getState().setMediaType('film')
    useFiltersStore.getState().setStatus('watched')
    const { queryAllByTestId, getByTestId } = render(<CollectionScreen />)
    expect(queryAllByTestId('item-card')).toHaveLength(0)
    expect(getByTestId('empty-state')).toBeTruthy()
  })

  it('clearFilters → tous items visibles', () => {
    useFiltersStore.getState().setSearchQuery('Matrix')
    useFiltersStore.getState().clearFilters()
    const { getAllByTestId } = render(<CollectionScreen />)
    expect(getAllByTestId('item-card')).toHaveLength(4)
  })
})

describe('CollectionScreen — recherche floue (AC3, AC4, AC5, AC6)', () => {
  it('AC5 — query vide → tous les items', () => {
    useFiltersStore.getState().setSearchQuery('')
    const { getAllByTestId } = render(<CollectionScreen />)
    expect(getAllByTestId('item-card')).toHaveLength(4)
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
