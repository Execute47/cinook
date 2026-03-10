import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'

const mockAddDoc = jest.fn()
const mockCollectionRef = {}
const mockCollection = jest.fn(() => mockCollectionRef)
const mockServerTimestamp = jest.fn(() => ({ seconds: 0 }))
jest.mock('firebase/firestore', () => ({
  addDoc: (...args: unknown[]) => mockAddDoc(...args),
  collection: (...args: unknown[]) => mockCollection(...args),
  serverTimestamp: () => mockServerTimestamp(),
  getFirestore: jest.fn(),
}))

jest.mock('@/lib/firebase', () => ({ db: {} }))

jest.mock('@/stores/authStore', () => ({
  useAuthStore: (selector: (s: object) => unknown) =>
    selector({ uid: 'uid-me', displayName: 'Moi', circleId: 'circle-1' }),
}))

jest.mock('@/hooks/useCircle', () => ({
  useCircle: () => ({
    members: [
      { uid: 'uid-me', displayName: 'Moi', email: 'moi@test.com' },
      { uid: 'uid-alice', displayName: 'Alice', email: 'alice@test.com' },
      { uid: 'uid-bob', displayName: null, email: 'bob@test.com' },
    ],
  }),
}))

import RecoComposer from './RecoComposer'
import type { MediaItem } from '@/types/media'

const fakeItem: MediaItem = {
  id: 'item-1',
  title: 'Matrix',
  type: 'film',
  status: 'owned',
  tier: 'none',
  addedVia: 'search',
  addedAt: { seconds: 0, nanoseconds: 0 } as never,
}

beforeEach(() => jest.clearAllMocks())

describe('RecoComposer', () => {
  it('affiche les membres du cercle (hors soi-même)', () => {
    const { getByText, queryByText } = render(
      <RecoComposer item={fakeItem} visible onClose={jest.fn()} />
    )
    expect(getByText('Alice')).toBeTruthy()
    expect(getByText('bob@test.com')).toBeTruthy()
    expect(queryByText('Moi')).toBeNull()
  })

  it('appelle addDoc avec les bons champs à l\'envoi', async () => {
    mockAddDoc.mockResolvedValueOnce({ id: 'reco-new' })
    const onClose = jest.fn()

    const { getByText } = render(
      <RecoComposer item={fakeItem} visible onClose={onClose} />
    )

    fireEvent.press(getByText('Alice'))
    fireEvent.press(getByText('Envoyer à 1 membre'))

    await waitFor(() => {
      expect(mockAddDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          fromUserId: 'uid-me',
          fromUserName: 'Moi',
          toUserIds: ['uid-alice'],
          itemId: 'item-1',
          itemTitle: 'Matrix',
        })
      )
      expect(onClose).toHaveBeenCalled()
    })
  })

  it('désactive le bouton Envoyer si aucun membre sélectionné', () => {
    const { getByText } = render(
      <RecoComposer item={fakeItem} visible onClose={jest.fn()} />
    )
    expect(getByText('Sélectionner des membres')).toBeTruthy()
  })
})
