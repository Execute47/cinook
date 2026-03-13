import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'

const mockShowAlert = jest.fn()
jest.mock('@/hooks/useAlert', () => ({
  useAlert: () => ({ alert: mockShowAlert, confirm: jest.fn() }),
}))

const mockSetDoc = jest.fn()
const mockDeleteDoc = jest.fn()
const mockDoc = jest.fn(() => ({}))
const mockServerTimestamp = jest.fn(() => ({ seconds: 0 }))
jest.mock('firebase/firestore', () => ({
  setDoc: (...args: unknown[]) => mockSetDoc(...args),
  deleteDoc: (...args: unknown[]) => mockDeleteDoc(...args),
  doc: (...args: unknown[]) => mockDoc(...args),
  serverTimestamp: () => mockServerTimestamp(),
  getFirestore: jest.fn(),
}))

jest.mock('@/lib/firebase', () => ({ db: {} }))

let mockCircleId: string | null = 'circle-1'
jest.mock('@/stores/authStore', () => ({
  useAuthStore: (selector: (s: object) => unknown) =>
    selector({ uid: 'uid-me', displayName: 'Moi', activeCircleId: mockCircleId }),
}))

import CineclubButton from './CineclubButton'
import type { MediaItem } from '@/types/media'

const fakeFilm: MediaItem = {
  id: 'item-1', title: 'Matrix', type: 'film',
  status: 'owned', tier: 'none', addedVia: 'search',
  addedAt: { seconds: 0, nanoseconds: 0 } as never,
}

const fakeLivre: MediaItem = {
  id: 'item-2', title: 'Dune', type: 'livre',
  status: 'owned', tier: 'none', addedVia: 'search',
  addedAt: { seconds: 0, nanoseconds: 0 } as never,
}

beforeEach(() => {
  jest.clearAllMocks()
  mockCircleId = 'circle-1'
})

describe('CineclubButton — label', () => {
  it('affiche "Cinéclub" pour un film', () => {
    const { getByText } = render(<CineclubButton item={fakeFilm} />)
    expect(getByText('Mettre en Cinéclub')).toBeTruthy()
  })

  it('affiche "Coin lecture" pour un livre', () => {
    const { getByText } = render(<CineclubButton item={fakeLivre} />)
    expect(getByText('Mettre en Coin lecture')).toBeTruthy()
  })
})

describe('CineclubButton — mise en avant', () => {
  it('appelle setDoc avec itemType dans le payload', async () => {
    mockSetDoc.mockResolvedValueOnce(undefined)
    const { getByText } = render(<CineclubButton item={fakeFilm} />)
    fireEvent.press(getByText('Mettre en Cinéclub'))

    await waitFor(() => {
      expect(mockSetDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ itemId: 'item-1', itemTitle: 'Matrix', itemType: 'film', postedBy: 'Moi' })
      )
    })
  })

  it('affiche une alerte après setDoc réussi', async () => {
    mockSetDoc.mockResolvedValueOnce(undefined)

    const { getByText } = render(<CineclubButton item={fakeFilm} />)
    fireEvent.press(getByText('Mettre en Cinéclub'))

    await waitFor(() => {
      expect(mockShowAlert).toHaveBeenCalledWith(
        'Cinéclub',
        expect.stringContaining('Matrix')
      )
    })
  })
})

describe('CineclubButton — mode retrait (AC3)', () => {
  it('affiche "Retirer du Cinéclub" si currentCineclubItemId === item.id', () => {
    const { getByText, queryByText } = render(
      <CineclubButton item={fakeFilm} currentCineclubItemId="item-1" />
    )
    expect(getByText('Retirer du Cinéclub')).toBeTruthy()
    expect(queryByText('Mettre en Cinéclub')).toBeNull()
  })

  it('affiche "Retirer du Coin lecture" pour un livre actif', () => {
    const { getByText } = render(
      <CineclubButton item={fakeLivre} currentCineclubItemId="item-2" />
    )
    expect(getByText('Retirer du Coin lecture')).toBeTruthy()
  })

  it('appelle deleteDoc sur le bon chemin au clic Retirer', async () => {
    mockDeleteDoc.mockResolvedValueOnce(undefined)
    const { getByText } = render(
      <CineclubButton item={fakeFilm} currentCineclubItemId="item-1" />
    )
    fireEvent.press(getByText('Retirer du Cinéclub'))

    await waitFor(() => {
      expect(mockDeleteDoc).toHaveBeenCalledTimes(1)
    })
  })
})

describe('CineclubButton — sans circleId', () => {
  it('ne rend rien si pas de circleId', () => {
    mockCircleId = null
    const { queryByText } = render(<CineclubButton item={fakeFilm} />)
    expect(queryByText(/Cinéclub/)).toBeNull()
  })
})
