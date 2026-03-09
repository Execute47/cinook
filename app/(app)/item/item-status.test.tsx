import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: 'item-1' }),
  router: { back: jest.fn() },
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
  getFirestore: jest.fn(),
}))

jest.mock('@/stores/authStore', () => ({
  useAuthStore: (selector: (s: { uid: string }) => unknown) =>
    selector({ uid: 'uid-test' }),
}))

const mockItems = [
  {
    id: 'item-1', title: 'Matrix', type: 'film', status: 'loaned',
    tier: 'none', addedVia: 'search', loanTo: 'Alice', loanDate: { toDate: () => new Date('2025-01-01') },
  },
]
jest.mock('@/hooks/useCollection', () => ({
  useCollection: () => ({ items: mockItems, loading: false, error: null }),
}))

import ItemDetailScreen from './[id]'

beforeEach(() => jest.clearAllMocks())

describe('Item detail — changement de statut', () => {
  it('appelle updateItem avec le nouveau statut', async () => {
    mockUpdateItem.mockResolvedValueOnce(undefined)
    const { getByText } = render(<ItemDetailScreen />)

    fireEvent.press(getByText('Vu'))

    await waitFor(() => {
      expect(mockUpdateItem).toHaveBeenCalledWith(
        'uid-test', 'item-1',
        expect.objectContaining({ status: 'watched' })
      )
    })
  })

  it('efface loanTo et loanDate quand on quitte le statut Prêté', async () => {
    mockUpdateItem.mockResolvedValueOnce(undefined)
    const { getByText } = render(<ItemDetailScreen />)

    fireEvent.press(getByText('Vu'))

    await waitFor(() => {
      expect(mockUpdateItem).toHaveBeenCalledWith(
        'uid-test', 'item-1',
        expect.objectContaining({
          status: 'watched',
          loanTo: 'DELETE_FIELD_SENTINEL',
          loanDate: 'DELETE_FIELD_SENTINEL',
        })
      )
    })
  })

  it('ne efface pas loanTo/loanDate quand on reste sur Prêté', async () => {
    mockUpdateItem.mockResolvedValueOnce(undefined)
    const { getAllByText } = render(<ItemDetailScreen />)

    // "Prêté" apparaît deux fois : badge statut + bouton picker → on prend le dernier (picker)
    const buttons = getAllByText('Prêté')
    fireEvent.press(buttons[buttons.length - 1])

    await waitFor(() => {
      expect(mockUpdateItem).toHaveBeenCalledWith(
        'uid-test', 'item-1',
        expect.not.objectContaining({ loanTo: expect.anything() })
      )
    })
  })
})
