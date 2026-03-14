import React from 'react'
import { render, waitFor, fireEvent } from '@testing-library/react-native'

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ uid: 'member-uid' }),
  router: { back: jest.fn() },
}))

jest.mock('@/lib/firebase', () => ({ db: {} }))

jest.mock('@shopify/flash-list', () => {
  const { FlatList } = require('react-native')
  return { FlashList: FlatList }
})

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

jest.mock('@/components/media/ItemCard', () => {
  const { Text } = require('react-native')
  return ({ item }: { item: { title: string } }) => <Text testID="item-card">{item.title}</Text>
})

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

  it("affiche 'Collection vide' quand il n'y a pas d'items", async () => {
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
            title: 'Inception', type: 'film', statuses: ['watched'],
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

describe('MemberCollectionScreen — filtrage et recherche', () => {
  it('filtre par type film', async () => {
    mockGetDocs.mockResolvedValueOnce({
      docs: [
        { id: 'a', data: () => ({ title: 'Inception', type: 'film', statuses: ['watched'], tier: 'none', addedVia: 'search' }) },
        { id: 'b', data: () => ({ title: 'Dune', type: 'livre', statuses: ['owned'], tier: 'none', addedVia: 'scan' }) },
      ],
    })
    const { getAllByTestId, getByText, getByTestId } = render(<MemberCollectionScreen />)

    await waitFor(() => {
      expect(getAllByTestId('item-card')).toHaveLength(2)
    })

    fireEvent.press(getByTestId('filter-button'))
    await waitFor(() => expect(getByText('Films')).toBeTruthy())
    fireEvent.press(getByText('Films'))

    await waitFor(() => {
      expect(getAllByTestId('item-card')).toHaveLength(1)
      expect(getAllByTestId('item-card')[0].props.children).toBe('Inception')
    })
  })

  it('recherche floue filtre par titre', async () => {
    mockGetDocs.mockResolvedValueOnce({
      docs: [
        { id: 'a', data: () => ({ title: 'Inception', type: 'film', statuses: ['watched'], tier: 'none', addedVia: 'search' }) },
        { id: 'b', data: () => ({ title: 'Matrix', type: 'film', statuses: ['owned'], tier: 'none', addedVia: 'search' }) },
      ],
    })
    const { getAllByTestId, getByPlaceholderText } = render(<MemberCollectionScreen />)

    await waitFor(() => {
      expect(getAllByTestId('item-card')).toHaveLength(2)
    })

    fireEvent.changeText(getByPlaceholderText('Rechercher dans cette collection...'), 'Incep')

    await waitFor(() => {
      const titles = getAllByTestId('item-card').map((c) => c.props.children)
      expect(titles).toContain('Inception')
      expect(titles).not.toContain('Matrix')
    })
  })

  it('affiche vide quand aucun item ne correspond', async () => {
    mockGetDocs.mockResolvedValueOnce({
      docs: [
        { id: 'a', data: () => ({ title: 'Inception', type: 'film', statuses: ['watched'], tier: 'none', addedVia: 'search' }) },
      ],
    })
    const { getByText, getByPlaceholderText } = render(<MemberCollectionScreen />)

    await waitFor(() => {
      expect(getByText('Inception')).toBeTruthy()
    })

    fireEvent.changeText(getByPlaceholderText('Rechercher dans cette collection...'), 'xyzxyz')

    await waitFor(() => {
      expect(getByText('Aucun item ne correspond.')).toBeTruthy()
    })
  })
})
