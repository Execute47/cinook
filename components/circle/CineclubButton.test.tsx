import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'

const mockSetDoc = jest.fn()
const mockDoc = jest.fn(() => ({}))
const mockServerTimestamp = jest.fn(() => ({ seconds: 0 }))
jest.mock('firebase/firestore', () => ({
  setDoc: (...args: unknown[]) => mockSetDoc(...args),
  doc: (...args: unknown[]) => mockDoc(...args),
  serverTimestamp: () => mockServerTimestamp(),
  getFirestore: jest.fn(),
}))

jest.mock('@/lib/firebase', () => ({ db: {} }))

let mockCircleId: string | null = 'circle-1'
jest.mock('@/stores/authStore', () => ({
  useAuthStore: (selector: (s: object) => unknown) =>
    selector({ uid: 'uid-me', displayName: 'Moi', circleId: mockCircleId }),
}))

import CineclubButton from './CineclubButton'
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

beforeEach(() => {
  jest.clearAllMocks()
  mockCircleId = 'circle-1'
})

describe('CineclubButton', () => {
  it('appelle setDoc avec les bons champs au press', async () => {
    mockSetDoc.mockResolvedValueOnce(undefined)

    const { getByText } = render(<CineclubButton item={fakeItem} />)
    fireEvent.press(getByText('⭐ Mettre en Cinéclub'))

    await waitFor(() => {
      expect(mockSetDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          itemId: 'item-1',
          itemTitle: 'Matrix',
          postedBy: 'Moi',
        })
      )
    })
  })

  it('ne rend rien si pas de circleId', () => {
    mockCircleId = null
    const { queryByText } = render(<CineclubButton item={fakeItem} />)
    expect(queryByText('⭐ Mettre en Cinéclub')).toBeNull()
  })
})
