import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import NewItemScreen from './new'

jest.mock('expo-router', () => ({
  router: { back: jest.fn(), push: jest.fn() },
}))

const mockAddItem = jest.fn()
jest.mock('@/lib/firestore', () => ({
  addItem: (...args: unknown[]) => mockAddItem(...args),
}))

jest.mock('@/lib/firebase', () => ({ auth: {}, db: {} }))
jest.mock('@/lib/auth', () => ({ signInWithGoogle: jest.fn() }))

jest.mock('@/stores/authStore', () => ({
  useAuthStore: (selector: (s: { uid: string }) => unknown) =>
    selector({ uid: 'uid-test' }),
}))

const mockCollectionItems: jest.Mock = jest.fn().mockReturnValue([])
jest.mock('@/hooks/useCollection', () => ({
  useCollection: () => ({ items: mockCollectionItems(), loading: false, error: null }),
}))

jest.mock('@react-native-community/datetimepicker', () => 'DateTimePicker')

import { router } from 'expo-router'
import type { Timestamp } from 'firebase/firestore'

const fakeTimestamp = {} as Timestamp

beforeEach(() => {
  jest.clearAllMocks()
  mockCollectionItems.mockReturnValue([])
})

describe('NewItemScreen', () => {
  describe('AC2 — Validation titre obligatoire', () => {
    it('affiche une erreur si titre vide et ne appelle pas addItem', async () => {
      const { getByText } = render(<NewItemScreen />)
      fireEvent.press(getByText('Ajouter à ma collection'))

      await waitFor(() => {
        expect(getByText('Le titre est obligatoire')).toBeTruthy()
      })
      expect(mockAddItem).not.toHaveBeenCalled()
    })
  })

  describe('AC1 — Création manuelle réussie', () => {
    it('appelle addItem avec addedVia: manual et navigue back', async () => {
      mockAddItem.mockResolvedValueOnce('new-id')

      const { getByPlaceholderText, getByText } = render(<NewItemScreen />)
      fireEvent.changeText(getByPlaceholderText('Titre'), 'Inception')
      fireEvent.press(getByText('Ajouter à ma collection'))
await waitFor(() => {
  expect(mockAddItem).toHaveBeenCalledWith(
    'uid-test',
    expect.objectContaining({ title: 'Inception', addedVia: 'manual', statuses: [], tier: 'none' })
  )
})
      expect(router.back).toHaveBeenCalled()
      })

    it('inclut les champs optionnels si renseignés', async () => {
      mockAddItem.mockResolvedValueOnce('new-id')

      const { getByPlaceholderText, getByText } = render(<NewItemScreen />)
      fireEvent.changeText(getByPlaceholderText('Titre'), 'Matrix')
      fireEvent.changeText(getByPlaceholderText('Ex : 1999'), '1999')
      fireEvent.changeText(getByPlaceholderText('Réalisateur'), 'Wachowski')
      fireEvent.changeText(getByPlaceholderText('Synopsis...'), 'Un film de SF')
      fireEvent.press(getByText('Ajouter à ma collection'))

      await waitFor(() => {
        expect(mockAddItem).toHaveBeenCalledWith(
          'uid-test',
          expect.objectContaining({
            title: 'Matrix',
            year: 1999,
            director: 'Wachowski',
            synopsis: 'Un film de SF',
          })
        )
      })
    })

    it('utilise le champ auteur pour les livres', async () => {
      mockAddItem.mockResolvedValueOnce('new-id')

      const { getByPlaceholderText, getByText } = render(<NewItemScreen />)
      fireEvent.press(getByText('Livre'))
      fireEvent.changeText(getByPlaceholderText('Titre'), 'Dune')
      fireEvent.changeText(getByPlaceholderText('Auteur'), 'Frank Herbert')
      fireEvent.press(getByText('Ajouter à ma collection'))

      await waitFor(() => {
        expect(mockAddItem).toHaveBeenCalledWith(
          'uid-test',
          expect.objectContaining({ type: 'livre', author: 'Frank Herbert' })
        )
      })
    })
  })

  describe('AC4 — Sélection de statuts à l\'ajout', () => {
    it('crée l\'item avec statuts simples sélectionnés', async () => {
      mockAddItem.mockResolvedValueOnce('new-id')

      const { getByPlaceholderText, getByText } = render(<NewItemScreen />)
      fireEvent.changeText(getByPlaceholderText('Titre'), 'Inception')
      fireEvent.press(getByText('Possédé'))
      fireEvent.press(getByText('Favori'))
      fireEvent.press(getByText('Ajouter à ma collection'))

      await waitFor(() => {
        expect(mockAddItem).toHaveBeenCalledWith(
          'uid-test',
          expect.objectContaining({ statuses: ['owned', 'favorite'] })
        )
      })
    })

    it('désélectionne un statut au second appui', async () => {
      mockAddItem.mockResolvedValueOnce('new-id')

      const { getByPlaceholderText, getByText } = render(<NewItemScreen />)
      fireEvent.changeText(getByPlaceholderText('Titre'), 'Inception')
      fireEvent.press(getByText('Possédé'))
      fireEvent.press(getByText('Possédé')) // désélection
      fireEvent.press(getByText('Ajouter à ma collection'))

      await waitFor(() => {
        expect(mockAddItem).toHaveBeenCalledWith(
          'uid-test',
          expect.objectContaining({ statuses: [] })
        )
      })
    })

    it('crée l\'item sans statuts si aucun sélectionné', async () => {
      mockAddItem.mockResolvedValueOnce('new-id')

      const { getByPlaceholderText, getByText } = render(<NewItemScreen />)
      fireEvent.changeText(getByPlaceholderText('Titre'), 'Inception')
      fireEvent.press(getByText('Ajouter à ma collection'))

      await waitFor(() => {
        expect(mockAddItem).toHaveBeenCalledWith(
          'uid-test',
          expect.objectContaining({ statuses: [] })
        )
      })
    })
  })

  describe('AC3 — Avertissement doublon (non bloquant)', () => {
    it('affiche un avertissement si doublon titre+type détecté', () => {
      mockCollectionItems.mockReturnValue([
        {
          id: 'existing-film',
          title: 'Inception',
          type: 'film',
          statuses: ['owned'],
          tier: 'none',
          addedVia: 'search',
          addedAt: fakeTimestamp,
        },
      ])

      const { getByPlaceholderText, queryByText } = render(<NewItemScreen />)
      fireEvent.changeText(getByPlaceholderText('Titre'), 'Inception')

      expect(queryByText(/Un item similaire existe déjà/)).toBeTruthy()
      expect(queryByText('Voir la fiche')).toBeTruthy()
    })

    it('le bouton Ajouter reste actif même avec un doublon détecté', () => {
      mockCollectionItems.mockReturnValue([
        {
          id: 'existing-film',
          title: 'Inception',
          type: 'film',
          statuses: ['owned'],
          tier: 'none',
          addedVia: 'search',
          addedAt: fakeTimestamp,
        },
      ])

      const { getByPlaceholderText, getByText } = render(<NewItemScreen />)
      fireEvent.changeText(getByPlaceholderText('Titre'), 'Inception')

      expect(getByText('Ajouter à ma collection')).toBeTruthy()
    })

    it("n'affiche pas d'avertissement quand pas de doublon", () => {
      mockCollectionItems.mockReturnValue([])

      const { getByPlaceholderText, queryByText } = render(<NewItemScreen />)
      fireEvent.changeText(getByPlaceholderText('Titre'), 'Film Inconnu')

      expect(queryByText(/Un item similaire/)).toBeNull()
    })
  })
})
