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
    const { getByText } = render(<CineclubButton item={fakeFilm} cineclubItemIds={[]} />)
    expect(getByText('Mettre en Cinéclub')).toBeTruthy()
  })

  it('affiche "Coin lecture" pour un livre', () => {
    const { getByText } = render(<CineclubButton item={fakeLivre} cineclubItemIds={[]} />)
    expect(getByText('Mettre en Coin lecture')).toBeTruthy()
  })
})

describe('CineclubButton — mise en avant', () => {
  it('appelle setDoc avec itemType dans le payload', async () => {
    mockSetDoc.mockResolvedValueOnce(undefined)
    const { getByText } = render(<CineclubButton item={fakeFilm} cineclubItemIds={[]} />)
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

    const { getByText } = render(<CineclubButton item={fakeFilm} cineclubItemIds={[]} />)
    fireEvent.press(getByText('Mettre en Cinéclub'))

    await waitFor(() => {
      expect(mockShowAlert).toHaveBeenCalledWith(
        'Cinéclub',
        expect.stringContaining('Matrix')
      )
    })
  })

  it('affiche une alerte si la limite de 5 est atteinte', async () => {
    const { getByText } = render(
      <CineclubButton item={fakeFilm} cineclubItemIds={['a', 'b', 'c', 'd', 'e']} />
    )
    fireEvent.press(getByText('Mettre en Cinéclub'))

    await waitFor(() => {
      expect(mockShowAlert).toHaveBeenCalledWith('Cinéclub', expect.stringContaining('5'))
      expect(mockSetDoc).not.toHaveBeenCalled()
    })
  })
})

describe('CineclubButton — mode retrait', () => {
  it('affiche "Retirer du Cinéclub" si item.id est dans cineclubItemIds', () => {
    const { getByText, queryByText } = render(
      <CineclubButton item={fakeFilm} cineclubItemIds={['item-1']} />
    )
    expect(getByText('Retirer du Cinéclub')).toBeTruthy()
    expect(queryByText('Mettre en Cinéclub')).toBeNull()
  })

  it('affiche "Retirer du Coin lecture" pour un livre actif', () => {
    const { getByText } = render(
      <CineclubButton item={fakeLivre} cineclubItemIds={['item-2']} />
    )
    expect(getByText('Retirer du Coin lecture')).toBeTruthy()
  })

  it('appelle deleteDoc avec item.id au clic Retirer', async () => {
    mockDeleteDoc.mockResolvedValueOnce(undefined)
    const { getByText } = render(
      <CineclubButton item={fakeFilm} cineclubItemIds={['item-1']} />
    )
    fireEvent.press(getByText('Retirer du Cinéclub'))

    await waitFor(() => {
      expect(mockDeleteDoc).toHaveBeenCalledTimes(1)
      expect(mockDoc).toHaveBeenCalledWith(expect.anything(), 'circles', 'circle-1', 'cineclub', 'item-1')
    })
  })
})

describe('CineclubButton — sans circleId', () => {
  it('ne rend rien si pas de circleId', () => {
    mockCircleId = null
    const { queryByText } = render(<CineclubButton item={fakeFilm} cineclubItemIds={[]} />)
    expect(queryByText(/Cinéclub/)).toBeNull()
  })
})
