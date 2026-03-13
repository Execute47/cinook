import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'

const mockPush = jest.fn()
const mockReplace = jest.fn()
const mockBack = jest.fn()
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace, back: mockBack }),
  useLocalSearchParams: () => mockParams,
}))

const mockAddItem = jest.fn()
jest.mock('@/lib/firestore', () => ({
  addItem: (...args: unknown[]) => mockAddItem(...args),
}))

const mockFindDuplicate = jest.fn()
jest.mock('@/lib/duplicates', () => ({
  findDuplicate: (...args: unknown[]) => mockFindDuplicate(...args),
}))

let mockItems: object[] = []
jest.mock('@/hooks/useCollection', () => ({
  useCollection: () => ({ items: mockItems }),
}))

jest.mock('@/stores/authStore', () => ({
  useAuthStore: (selector: (s: object) => unknown) =>
    selector({ uid: 'uid-me' }),
}))

import PreviewScreen from './preview'

let mockParams = {
  title: 'Matrix',
  type: 'film',
  poster: '',
  synopsis: 'Un hacker découvre la vérité.',
  year: '1999',
  director: 'Wachowski',
  author: '',
  tmdbId: 'tmdb-123',
  googleBooksId: '',
  isbn: '',
  source: 'cineclub',
  sourceName: 'Alice',
}

beforeEach(() => {
  jest.clearAllMocks()
  mockItems = []
  mockFindDuplicate.mockReturnValue(null)
  mockParams = {
    title: 'Matrix',
    type: 'film',
    poster: '',
    synopsis: 'Un hacker découvre la vérité.',
    year: '1999',
    director: 'Wachowski',
    author: '',
    tmdbId: 'tmdb-123',
    googleBooksId: '',
    isbn: '',
    source: 'cineclub',
    sourceName: 'Alice',
  }
})

describe('preview.tsx — item absent de la collection', () => {
  it('affiche le bouton "Ajouter à ma collection"', () => {
    const { getByText, queryByText } = render(<PreviewScreen />)
    expect(getByText('Ajouter à ma collection')).toBeTruthy()
    expect(queryByText('Voir dans ma collection')).toBeNull()
  })

  it('affiche le titre, le réalisateur et le synopsis', () => {
    const { getByText } = render(<PreviewScreen />)
    expect(getByText('Matrix')).toBeTruthy()
    expect(getByText(/Wachowski/)).toBeTruthy()
    expect(getByText(/hacker/)).toBeTruthy()
  })

  it('affiche la source cinéclub', () => {
    const { getByText } = render(<PreviewScreen />)
    expect(getByText(/Mis en avant par Alice/)).toBeTruthy()
  })

  it('appelle addItem et navigue vers la fiche après ajout', async () => {
    mockAddItem.mockResolvedValueOnce('new-item-id')
    const { getByText } = render(<PreviewScreen />)
    fireEvent.press(getByText('Ajouter à ma collection'))
    await waitFor(() => {
      expect(mockAddItem).toHaveBeenCalledWith(
        'uid-me',
        expect.objectContaining({ title: 'Matrix', type: 'film', statuses: [], addedVia: 'discover' })
      )
      expect(mockReplace).toHaveBeenCalledWith(expect.stringContaining('new-item-id'))
    })
  })
})

describe('preview.tsx — item déjà en collection', () => {
  it('affiche le bouton "Voir dans ma collection"', () => {
    mockFindDuplicate.mockReturnValue({ id: 'existing-id', title: 'Matrix' })
    const { getByText, queryByText } = render(<PreviewScreen />)
    expect(getByText('Voir dans ma collection')).toBeTruthy()
    expect(queryByText('Ajouter à ma collection')).toBeNull()
  })

  it('navigue vers la fiche existante au tap', () => {
    mockFindDuplicate.mockReturnValue({ id: 'existing-id', title: 'Matrix' })
    const { getByText } = render(<PreviewScreen />)
    fireEvent.press(getByText('Voir dans ma collection'))
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('existing-id'))
  })
})

describe('preview.tsx — champs manquants (rétrocompatibilité)', () => {
  it("n'affiche pas de champs vides et ne crash pas", () => {
    mockParams = {
      title: 'Film sans infos',
      type: 'film',
      poster: '',
      synopsis: '',
      year: '',
      director: '',
      author: '',
      tmdbId: '',
      googleBooksId: '',
      isbn: '',
      source: '',
      sourceName: '',
    }
    const { getByText, queryByText } = render(<PreviewScreen />)
    expect(getByText('Film sans infos')).toBeTruthy()
    expect(queryByText(/Réal\./)).toBeNull()
    expect(queryByText('Synopsis')).toBeNull()
    expect(queryByText(/Mis en avant/)).toBeNull()
  })
})

describe('preview.tsx — source recommandation', () => {
  it('affiche "Recommandé par" pour une reco', () => {
    mockParams = { ...mockParams, source: 'reco', sourceName: 'Bob' }
    const { getByText } = render(<PreviewScreen />)
    expect(getByText(/Recommandé par Bob/)).toBeTruthy()
  })

  it('affiche "Coin lecture" pour un livre en cinéclub', () => {
    mockParams = { ...mockParams, type: 'livre', source: 'cineclub', sourceName: 'Alice' }
    const { getByText } = render(<PreviewScreen />)
    expect(getByText(/Coin lecture.*Alice/)).toBeTruthy()
  })

  it('affiche "Cinéclub" pour un film en cinéclub', () => {
    mockParams = { ...mockParams, type: 'film', source: 'cineclub', sourceName: 'Alice' }
    const { getByText } = render(<PreviewScreen />)
    expect(getByText(/Cinéclub.*Alice/)).toBeTruthy()
  })
})
