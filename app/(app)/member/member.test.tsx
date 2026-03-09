import React from 'react'
import { render, waitFor } from '@testing-library/react-native'

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ uid: 'member-uid' }),
  router: { back: jest.fn() },
}))

jest.mock('@/lib/firebase', () => ({ db: {} }))

const mockGetDocs = jest.fn()
jest.mock('firebase/firestore', () => ({
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
  collection: jest.fn((_db, ...s) => ({ path: s.join('/') })),
  query: jest.fn((...args) => args[0]),
  orderBy: jest.fn(),
}))

jest.mock('@/hooks/useCircle', () => ({
  useCircle: () => ({
    members: [
      { uid: 'member-uid', displayName: 'Alice', email: 'alice@test.com' },
    ],
    isAdmin: false,
    adminId: null,
    loading: false,
    error: null,
  }),
}))

import MemberCollectionScreen from './[uid]'

beforeEach(() => jest.clearAllMocks())

describe('MemberCollectionScreen', () => {
  it('requête les items de /users/{memberUid}/items', async () => {
    mockGetDocs.mockResolvedValueOnce({ docs: [] })
    render(<MemberCollectionScreen />)

    await waitFor(() => {
      expect(mockGetDocs).toHaveBeenCalledWith(
        expect.objectContaining({ path: 'users/member-uid/items' })
      )
    })
  })

  it('affiche le nom du membre dans le header', async () => {
    mockGetDocs.mockResolvedValueOnce({ docs: [] })
    const { getByText } = render(<MemberCollectionScreen />)

    await waitFor(() => {
      expect(getByText('Alice')).toBeTruthy()
    })
  })

  it('affiche "Collection vide" quand il n\'y a pas d\'items', async () => {
    mockGetDocs.mockResolvedValueOnce({ docs: [] })
    const { getByText } = render(<MemberCollectionScreen />)

    await waitFor(() => {
      expect(getByText('Collection vide')).toBeTruthy()
    })
  })

  it('affiche les items du membre', async () => {
    mockGetDocs.mockResolvedValueOnce({
      docs: [
        {
          id: 'item-1',
          data: () => ({
            title: 'Inception', type: 'film', status: 'watched',
            tier: 'gold', addedVia: 'search',
            addedAt: { toDate: () => new Date() },
          }),
        },
      ],
    })
    const { getByText } = render(<MemberCollectionScreen />)

    await waitFor(() => {
      expect(getByText('Inception')).toBeTruthy()
    })
  })
})
