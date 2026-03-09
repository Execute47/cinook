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

import { router } from 'expo-router'

beforeEach(() => jest.clearAllMocks())

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
          expect.objectContaining({ title: 'Inception', addedVia: 'manual', status: 'owned', tier: 'none' })
        )
        expect(router.back).toHaveBeenCalled()
      })
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
})
