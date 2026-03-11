import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import SearchScreen from './search'
import type { Timestamp } from 'firebase/firestore'

jest.mock('expo-router', () => ({
  router: { back: jest.fn(), push: jest.fn() },
}))

jest.mock('@/lib/firestore', () => ({
  addItem: jest.fn().mockResolvedValue('new-id'),
}))

jest.mock('@/lib/firebase', () => ({ auth: {}, db: {} }))
jest.mock('@/lib/auth', () => ({ signInWithGoogle: jest.fn() }))

jest.mock('@/stores/authStore', () => ({
  useAuthStore: (selector: (s: { uid: string }) => unknown) =>
    selector({ uid: 'uid-test' }),
}))

const mockItems: jest.Mock = jest.fn()
jest.mock('@/hooks/useCollection', () => ({
  useCollection: () => ({ items: mockItems(), loading: false, error: null }),
}))

const mockSearchResults: jest.Mock = jest.fn()
jest.mock('@/hooks/useMediaSearch', () => ({
  useMediaSearch: () => ({
    results: mockSearchResults(),
    isLoading: false,
    error: null,
    query: 'Inception',
    mediaType: 'film',
    setQuery: jest.fn(),
    setMediaType: jest.fn(),
    reset: jest.fn(),
  }),
}))

jest.mock('@/components/media/SearchResultCard', () => {
  const { TouchableOpacity, Text } = require('react-native')
  return ({ item, onPress }: { item: { title: string }; onPress: (item: unknown) => void }) => (
    <TouchableOpacity onPress={() => onPress(item)}>
      <Text>{item.title}</Text>
    </TouchableOpacity>
  )
})

import { router } from 'expo-router'

const fakeTimestamp = {} as Timestamp

beforeEach(() => {
  jest.clearAllMocks()
  mockItems.mockReturnValue([])
  mockSearchResults.mockReturnValue([
    { title: 'Inception', type: 'film', tmdbId: '27205' },
  ])
})

describe('SearchScreen — détection doublon (AC1)', () => {
  it('affiche le bouton Ajouter quand pas de doublon', () => {
    mockItems.mockReturnValue([])
    const { queryByText } = render(<SearchScreen />)

    // Sélectionner un item
    fireEvent.press(queryByText('Inception')!)

    expect(queryByText('Ajouter à ma collection')).toBeTruthy()
    expect(queryByText('Déjà dans votre collection')).toBeNull()
    expect(queryByText('Voir la fiche')).toBeNull()
  })

  it('affiche le badge doublon et masque Ajouter quand doublon détecté', () => {
    mockItems.mockReturnValue([
      {
        id: 'existing-1',
        title: 'Inception',
        type: 'film',
        tmdbId: '27205',
        status: 'owned',
        tier: 'none',
        addedVia: 'search',
        addedAt: fakeTimestamp,
      },
    ])
    const { queryByText } = render(<SearchScreen />)

    fireEvent.press(queryByText('Inception')!)

    expect(queryByText('Déjà dans votre collection')).toBeTruthy()
    expect(queryByText('Voir la fiche')).toBeTruthy()
    expect(queryByText('Ajouter à ma collection')).toBeNull()
  })

  it('le bouton Voir la fiche navigue vers la fiche existante', () => {
    mockItems.mockReturnValue([
      {
        id: 'existing-1',
        title: 'Inception',
        type: 'film',
        tmdbId: '27205',
        status: 'owned',
        tier: 'none',
        addedVia: 'search',
        addedAt: fakeTimestamp,
      },
    ])
    const { getByText } = render(<SearchScreen />)

    fireEvent.press(getByText('Inception'))
    fireEvent.press(getByText('Voir la fiche'))

    expect(router.push).toHaveBeenCalledWith('/(app)/item/existing-1')
  })
})
