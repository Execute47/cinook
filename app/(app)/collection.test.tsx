import React from 'react'
import { render } from '@testing-library/react-native'

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
}))

jest.mock('@/lib/firebase', () => ({ auth: {}, db: {} }))
jest.mock('@/lib/auth', () => ({ signInWithGoogle: jest.fn() }))

const mockItems = [
  { id: '1', title: 'Matrix', type: 'film', status: 'owned', tier: 'none', addedVia: 'search' },
  { id: '2', title: 'Dune', type: 'livre', status: 'watched', tier: 'none', addedVia: 'scan' },
  { id: '3', title: 'Breaking Bad', type: 'serie', status: 'owned', tier: 'none', addedVia: 'manual' },
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

describe('CollectionScreen — filtrage', () => {
  it('affiche tous les items sans filtre', () => {
    const { getAllByTestId } = render(<CollectionScreen />)
    expect(getAllByTestId('item-card')).toHaveLength(3)
  })

  it('filtre par titre (case-insensitive)', () => {
    useFiltersStore.getState().setSearchQuery('matrix')
    const { getAllByTestId } = render(<CollectionScreen />)
    expect(getAllByTestId('item-card')).toHaveLength(1)
    expect(getAllByTestId('item-card')[0].props.children).toBe('Matrix')
  })

  it('filtre par type seul', () => {
    useFiltersStore.getState().setMediaType('film')
    const { getAllByTestId } = render(<CollectionScreen />)
    expect(getAllByTestId('item-card')).toHaveLength(1)
    expect(getAllByTestId('item-card')[0].props.children).toBe('Matrix')
  })

  it('filtre par statut seul', () => {
    useFiltersStore.getState().setStatus('watched')
    const { getAllByTestId } = render(<CollectionScreen />)
    expect(getAllByTestId('item-card')).toHaveLength(1)
    expect(getAllByTestId('item-card')[0].props.children).toBe('Dune')
  })

  it('combine type + statut', () => {
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
    expect(getAllByTestId('item-card')).toHaveLength(3)
  })
})
