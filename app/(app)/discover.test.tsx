import React from 'react'
import { render, waitFor, fireEvent } from '@testing-library/react-native'

// Mocks
const mockGetNowPlaying = jest.fn()
jest.mock('@/lib/tmdb', () => ({
  getNowPlaying: (...args: unknown[]) => mockGetNowPlaying(...args),
}))

const mockAddItem = jest.fn()
jest.mock('@/lib/firestore', () => ({
  addItem: (...args: unknown[]) => mockAddItem(...args),
}))

jest.mock('@/stores/authStore', () => ({
  useAuthStore: (selector: (s: { uid: string }) => unknown) => selector({ uid: 'uid-test' }),
}))

const mockSetLoading = jest.fn()
const mockAddToast = jest.fn()
jest.mock('@/stores/uiStore', () => ({
  useUIStore: () => ({
    setLoading: mockSetLoading,
    loading: { search: false, scan: false, export: false },
    addToast: mockAddToast,
  }),
}))

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  initializeFirestore: jest.fn(),
  persistentLocalCache: jest.fn(),
  collection: jest.fn(),
  addDoc: jest.fn(),
  serverTimestamp: jest.fn(),
}))
jest.mock('@/lib/firebase', () => ({ db: {} }))

import DiscoverScreen from './discover'

beforeEach(() => {
  jest.clearAllMocks()
  mockGetNowPlaying.mockResolvedValue([])
})

const fakeFilm = {
  title: 'Dune 2',
  type: 'film' as const,
  tmdbId: '123',
  poster: 'https://image.tmdb.org/t/p/w500/dune.jpg',
  synopsis: 'Le destin de Paul Atréides.',
  year: 2024,
  releaseDate: '2024-03-06',
}

describe('DiscoverScreen — AC1 : liste à l\'affiche', () => {
  it('appelle getNowPlaying au montage', async () => {
    render(<DiscoverScreen />)
    await waitFor(() => expect(mockGetNowPlaying).toHaveBeenCalledTimes(1))
  })

  it('affiche les films retournés', async () => {
    mockGetNowPlaying.mockResolvedValueOnce([fakeFilm])
    const { getByText } = render(<DiscoverScreen />)
    await waitFor(() => expect(getByText('Dune 2')).toBeTruthy())
  })
})

describe('DiscoverScreen — AC5 : mode hors-ligne', () => {
  it('affiche le message hors-ligne si getNowPlaying lève une erreur', async () => {
    mockGetNowPlaying.mockRejectedValueOnce(new Error('Network error'))
    const { getByText } = render(<DiscoverScreen />)
    await waitFor(() =>
      expect(getByText(/Connexion requise pour les films/)).toBeTruthy()
    )
  })

  it('ne crash pas si getNowPlaying rejette', async () => {
    mockGetNowPlaying.mockRejectedValueOnce(new Error('offline'))
    expect(() => render(<DiscoverScreen />)).not.toThrow()
  })
})

describe('DiscoverScreen — AC3 : ajouter à la collection', () => {
  it('appelle addItem avec addedVia: discover et status: owned', async () => {
    mockGetNowPlaying.mockResolvedValueOnce([fakeFilm])
    mockAddItem.mockResolvedValueOnce('new-id')
    const { getByText } = render(<DiscoverScreen />)
    await waitFor(() => getByText('Dune 2'))

    fireEvent.press(getByText('Dune 2'))
    await waitFor(() => getByText('Ajouter à ma collection'))
    fireEvent.press(getByText('Ajouter à ma collection'))

    await waitFor(() =>
      expect(mockAddItem).toHaveBeenCalledWith(
        'uid-test',
        expect.objectContaining({ addedVia: 'discover', statuses: ['owned'] })
      )
    )
  })
})

describe('DiscoverScreen — AC4 : ajouter à la wishlist', () => {
  it('appelle addItem avec statuses: [wishlist]', async () => {
    mockGetNowPlaying.mockResolvedValueOnce([fakeFilm])
    mockAddItem.mockResolvedValueOnce('new-id')
    const { getByText } = render(<DiscoverScreen />)
    await waitFor(() => getByText('Dune 2'))

    fireEvent.press(getByText('Dune 2'))
    await waitFor(() => getByText('Ajouter à À voir'))
    fireEvent.press(getByText('Ajouter à À voir'))

    await waitFor(() =>
      expect(mockAddItem).toHaveBeenCalledWith(
        'uid-test',
        expect.objectContaining({ statuses: ['wishlist'], addedVia: 'discover' })
      )
    )
  })
})
