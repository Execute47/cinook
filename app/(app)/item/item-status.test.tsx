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
  it('statut → "Vu" ouvre la modal (pas d\'update Firestore direct)', () => {
    const { getByText, queryByText } = render(<ItemDetailScreen />)

    fireEvent.press(getByText('Vu'))

    expect(queryByText('Date de visionnage')).toBeTruthy()
    expect(mockUpdateItem).not.toHaveBeenCalled()
  })

  it('validation de la modal appelle updateItem avec statuses incluant watched et endedAt', async () => {
    mockUpdateItem.mockResolvedValueOnce(undefined)
    const { getByText, getAllByPlaceholderText } = render(<ItemDetailScreen />)

    fireEvent.press(getByText('Vu'))
    fireEvent.changeText(getAllByPlaceholderText('jj/mm/aaaa')[0], '15/06/2024')
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
    const { getByText } = render(<ItemDetailScreen />)

    // On retire "Prêté"
    fireEvent.press(getByText('Prêté'))

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

describe('Item detail — quitter le statut "Vu"', () => {
  beforeEach(() => {
    mockCollectionItems.mockReturnValue([itemWatched])
  })

  it('efface startedAt et endedAt quand on retire le statut Vu', async () => {
    mockUpdateItem.mockResolvedValueOnce(undefined)
    const { getByText } = render(<ItemDetailScreen />)

    fireEvent.press(getByText('Vu'))

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
