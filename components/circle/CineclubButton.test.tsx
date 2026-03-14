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

const mockGetCircle = jest.fn()
jest.mock('@/lib/circle', () => ({
  getCircle: (...args: unknown[]) => mockGetCircle(...args),
}))

let mockCircleId: string | null = 'circle-1'
let mockCircleIds: string[] = ['circle-1']
jest.mock('@/stores/authStore', () => ({
  useAuthStore: (selector: (s: object) => unknown) =>
    selector({ uid: 'uid-me', displayName: 'Moi', activeCircleId: mockCircleId, circleIds: mockCircleIds }),
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
  mockCircleIds = ['circle-1']
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

describe('CineclubButton — sélecteur de cercle', () => {
  it('1 cercle : setDoc appelé directement sans modal', async () => {
    mockCircleIds = ['circle-1']
    mockSetDoc.mockResolvedValueOnce(undefined)

    const { getByText } = render(<CineclubButton item={fakeFilm} cineclubItemIds={[]} />)
    fireEvent.press(getByText('Mettre en Cinéclub'))

    await waitFor(() => {
      expect(mockSetDoc).toHaveBeenCalled()
      expect(mockGetCircle).not.toHaveBeenCalled()
    })
  })

  it('2 cercles : modal affichée avec les noms après clic', async () => {
    mockCircleIds = ['circle-1', 'circle-2']
    mockGetCircle
      .mockResolvedValueOnce({ id: 'circle-1', name: 'Famille', members: [], adminIds: ['uid-me'] })
      .mockResolvedValueOnce({ id: 'circle-2', name: 'Cinéphiles', members: [], adminIds: ['uid-me'] })

    const { getByText } = render(<CineclubButton item={fakeFilm} cineclubItemIds={[]} />)
    fireEvent.press(getByText('Mettre en Cinéclub'))

    await waitFor(() => {
      expect(getByText('Famille')).toBeTruthy()
      expect(getByText('Cinéphiles')).toBeTruthy()
    })
  })

  it('sélection d\'un cercle : setDoc appelé avec le circleId choisi', async () => {
    mockCircleIds = ['circle-1', 'circle-2']
    mockGetCircle
      .mockResolvedValueOnce({ id: 'circle-1', name: 'Famille', members: [], adminIds: ['uid-me'] })
      .mockResolvedValueOnce({ id: 'circle-2', name: 'Cinéphiles', members: [], adminIds: ['uid-me'] })
    mockSetDoc.mockResolvedValueOnce(undefined)

    const { getByText } = render(<CineclubButton item={fakeFilm} cineclubItemIds={[]} />)
    fireEvent.press(getByText('Mettre en Cinéclub'))

    await waitFor(() => expect(getByText('Cinéphiles')).toBeTruthy())
    fireEvent.press(getByText('Cinéphiles'))

    await waitFor(() => {
      expect(mockDoc).toHaveBeenCalledWith(expect.anything(), 'circles', 'circle-2', 'cineclub', 'item-1')
    })
  })

  it('annulation : modal fermée, setDoc non appelé', async () => {
    mockCircleIds = ['circle-1', 'circle-2']
    mockGetCircle
      .mockResolvedValueOnce({ id: 'circle-1', name: 'Famille', members: [], adminIds: ['uid-me'] })
      .mockResolvedValueOnce({ id: 'circle-2', name: 'Cinéphiles', members: [], adminIds: ['uid-me'] })

    const { getByText, queryByText } = render(<CineclubButton item={fakeFilm} cineclubItemIds={[]} />)
    fireEvent.press(getByText('Mettre en Cinéclub'))

    await waitFor(() => expect(getByText('Annuler')).toBeTruthy())
    fireEvent.press(getByText('Annuler'))

    await waitFor(() => {
      expect(mockSetDoc).not.toHaveBeenCalled()
      expect(queryByText('Famille')).toBeNull()
    })
  })

  it('erreur getCircle : alerte affichée, modal non ouverte', async () => {
    mockCircleIds = ['circle-1', 'circle-2']
    mockGetCircle.mockRejectedValueOnce(new Error('network'))

    const { getByText, queryByText } = render(<CineclubButton item={fakeFilm} cineclubItemIds={[]} />)
    fireEvent.press(getByText('Mettre en Cinéclub'))

    await waitFor(() => {
      expect(mockShowAlert).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('Impossible')
      )
    })
    expect(queryByText('Choisir un cercle')).toBeNull()
    expect(mockSetDoc).not.toHaveBeenCalled()
  })

  it('cache : getCircle appelé une seule fois sur ouvertures successives', async () => {
    mockCircleIds = ['circle-1', 'circle-2']
    mockGetCircle
      .mockResolvedValueOnce({ id: 'circle-1', name: 'Famille', members: [], adminIds: ['uid-me'] })
      .mockResolvedValueOnce({ id: 'circle-2', name: 'Cinéphiles', members: [], adminIds: ['uid-me'] })

    const { getByText } = render(<CineclubButton item={fakeFilm} cineclubItemIds={[]} />)

    // Première ouverture
    fireEvent.press(getByText('Mettre en Cinéclub'))
    await waitFor(() => expect(getByText('Annuler')).toBeTruthy())

    // Fermer
    fireEvent.press(getByText('Annuler'))
    await waitFor(() => expect(getByText('Mettre en Cinéclub')).toBeTruthy())

    // Deuxième ouverture
    fireEvent.press(getByText('Mettre en Cinéclub'))
    await waitFor(() => expect(getByText('Famille')).toBeTruthy())

    // getCircle doit n'avoir été appelé qu'une seule fois au total (2 appels pour 2 cercles)
    expect(mockGetCircle).toHaveBeenCalledTimes(2)
  })
})
