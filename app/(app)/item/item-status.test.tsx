import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: 'item-1' }),
  router: { back: jest.fn(), push: jest.fn() },
}))

jest.mock('@/lib/firebase', () => ({ auth: {}, db: {} }))
jest.mock('@/lib/auth', () => ({ signInWithGoogle: jest.fn() }))

const mockUpdateItem = jest.fn()
const mockDeleteItem = jest.fn()
jest.mock('@/lib/firestore', () => ({
  updateItem: (...args: unknown[]) => mockUpdateItem(...args),
  deleteItem: (...args: unknown[]) => mockDeleteItem(...args),
}))

const mockDeleteField = jest.fn(() => 'DELETE_FIELD_SENTINEL')
jest.mock('firebase/firestore', () => ({
  deleteField: () => mockDeleteField(),
  Timestamp: {
    fromDate: (d: Date) => ({ seconds: Math.floor(d.getTime() / 1000), toDate: () => d }),
  },
  getFirestore: jest.fn(),
}))

jest.mock('@/stores/authStore', () => ({
  useAuthStore: (selector: (s: { uid: string }) => unknown) =>
    selector({ uid: 'uid-test' }),
}))

jest.mock('@/hooks/usePlaylists', () => ({
  usePlaylists: () => ({ playlists: [], loading: false }),
}))

jest.mock('@/hooks/useCineclub', () => ({
  useCineclub: () => ({ cineclubs: [] }),
}))

jest.mock('@react-native-community/datetimepicker', () => 'DateTimePicker')

const mockCollectionItems: jest.Mock = jest.fn()
jest.mock('@/hooks/useCollection', () => ({
  useCollection: () => ({ items: mockCollectionItems(), loading: false, error: null }),
}))

import ItemDetailScreen from './[id]'

const itemLoaned = {
  id: 'item-1', title: 'Matrix', type: 'film', statuses: ['loaned'],
  tier: 'none', addedVia: 'search', loanTo: 'Alice',
  loanDate: { toDate: () => new Date('2025-01-01') },
}

const itemWatched = {
  id: 'item-1', title: 'Matrix', type: 'film', statuses: ['watched'],
  tier: 'none', addedVia: 'search',
  endedAt: { toDate: () => new Date('2024-06-15'), seconds: 0 },
}

beforeEach(() => {
  jest.clearAllMocks()
  mockCollectionItems.mockReturnValue([itemLoaned])
})

describe('Item detail — changement de statut', () => {
  it('statut → "Vu" ouvre la modal (pas d\'update Firestore direct)', async () => {
    const { getByText, queryByText } = render(<ItemDetailScreen />)

    // itemLoaned a statuses:['loaned'], donc "Vu" n'apparaît qu'une fois (picker)
    fireEvent.press(getByText('Vu'))

    await waitFor(() => {
      expect(queryByText('Date de visionnage')).toBeTruthy()
    })
    expect(mockUpdateItem).not.toHaveBeenCalled()
  })

  it('validation de la modal appelle updateItem avec statuses incluant watched et endedAt', async () => {
    mockUpdateItem.mockResolvedValueOnce(undefined)
    const { getByText } = render(<ItemDetailScreen />)

    fireEvent.press(getByText('Vu'))
    // La date est pré-remplie avec aujourd'hui, on valide directement
    await waitFor(() => getByText('Valider'))
    fireEvent.press(getByText('Valider'))

    await waitFor(() => {
      expect(mockUpdateItem).toHaveBeenCalledWith(
        'uid-test', 'item-1',
        expect.objectContaining({ statuses: expect.arrayContaining(['watched']), endedAt: expect.anything() })
      )
    })
  })

  it('efface loanTo et loanDate quand on retire Prêté', async () => {
    mockUpdateItem.mockResolvedValueOnce(undefined)
    const { getAllByText } = render(<ItemDetailScreen />)

    // itemLoaned a statuses:['loaned'] → "Prêté" apparaît 2 fois (badge + picker)
    fireEvent.press(getAllByText('Prêté')[1])

    await waitFor(() => {
      expect(mockUpdateItem).toHaveBeenCalledWith(
        'uid-test', 'item-1',
        expect.objectContaining({
          statuses: [],
          loanTo: 'DELETE_FIELD_SENTINEL',
          loanDate: 'DELETE_FIELD_SENTINEL',
        })
      )
    })
  })
})

describe('Item detail — statut "Emprunté"', () => {
  it('statut → "Emprunté" ouvre la modal sans update Firestore direct', () => {
    const { getAllByText, queryByText } = render(<ItemDetailScreen />)

    fireEvent.press(getAllByText('Emprunté')[0])

    expect(queryByText("Enregistrer l'emprunt")).toBeTruthy()
    expect(mockUpdateItem).not.toHaveBeenCalled()
  })

  it('efface borrowedFrom et borrowDate quand on retire Emprunté', async () => {
    mockUpdateItem.mockResolvedValueOnce(undefined)
    mockCollectionItems.mockReturnValue([{
      id: 'item-1', title: 'Matrix', type: 'film',
      statuses: ['borrowed'], tier: 'none', addedVia: 'search',
      borrowedFrom: 'Jean', borrowDate: { toDate: () => new Date('2025-01-01') },
    }])
    const { getAllByText } = render(<ItemDetailScreen />)

    fireEvent.press(getAllByText('Emprunté')[1])

    await waitFor(() => {
      expect(mockUpdateItem).toHaveBeenCalledWith(
        'uid-test', 'item-1',
        expect.objectContaining({
          statuses: [],
          borrowedFrom: 'DELETE_FIELD_SENTINEL',
          borrowDate: 'DELETE_FIELD_SENTINEL',
        })
      )
    })
  })
})

describe('Item detail — quitter le statut "Vu"', () => {
  beforeEach(() => {
    mockCollectionItems.mockReturnValue([itemWatched])
  })

  it('efface startedAt et endedAt quand on retire le statut Vu', async () => {
    mockUpdateItem.mockResolvedValueOnce(undefined)
    const { getAllByText } = render(<ItemDetailScreen />)

    // itemWatched a statuses:['watched'] → "Vu" apparaît 2 fois (badge + picker)
    fireEvent.press(getAllByText('Vu')[1])

    await waitFor(() => {
      expect(mockUpdateItem).toHaveBeenCalledWith(
        'uid-test', 'item-1',
        expect.objectContaining({
          statuses: [],
          startedAt: 'DELETE_FIELD_SENTINEL',
          endedAt: 'DELETE_FIELD_SENTINEL',
        })
      )
    })
  })
})
