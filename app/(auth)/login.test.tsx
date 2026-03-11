import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import LoginScreen from './login'

jest.mock('expo-router', () => ({
  router: { replace: jest.fn(), push: jest.fn() },
}))

const mockSignIn = jest.fn()
jest.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: (...args: unknown[]) => mockSignIn(...args),
  getAuth: jest.fn(),
}))

const mockGetDoc = jest.fn()
const mockDoc = jest.fn()
jest.mock('firebase/firestore', () => ({
  getDoc: (...args: unknown[]) => mockGetDoc(...args),
  doc: (...args: unknown[]) => mockDoc(...args),
  getFirestore: jest.fn(),
  initializeFirestore: jest.fn(),
  persistentLocalCache: jest.fn(),
}))

jest.mock('@/lib/firebase', () => ({ auth: {}, db: {} }))

jest.mock('@/lib/auth', () => ({
  signInWithGoogle: jest.fn(),
}))

const mockSetUser = jest.fn()
const mockSetCircleIds = jest.fn()
const mockSetActiveCircle = jest.fn()
jest.mock('@/stores/authStore', () => ({
  useAuthStore: {
    getState: () => ({ setUser: mockSetUser, setCircleIds: mockSetCircleIds, setActiveCircle: mockSetActiveCircle }),
  },
}))

const mockAddToast = jest.fn()
jest.mock('@/stores/uiStore', () => ({
  useUIStore: {
    getState: () => ({ addToast: mockAddToast }),
  },
}))

import { router } from 'expo-router'

beforeEach(() => jest.clearAllMocks())

describe('LoginScreen', () => {
  describe('AC1 — Connexion réussie', () => {
    it('appelle setUser et navigue vers (app)/ après connexion', async () => {
      const fakeUser = { uid: 'uid-1', email: 'test@test.com' }
      mockSignIn.mockResolvedValueOnce({ user: fakeUser })
      mockGetDoc.mockResolvedValueOnce({
        data: () => ({ displayName: 'Alice', circleId: null }),
      })

      const { getByPlaceholderText, getByText } = render(<LoginScreen />)
      fireEvent.changeText(getByPlaceholderText('Email'), 'test@test.com')
      fireEvent.changeText(getByPlaceholderText('Mot de passe'), 'motdepasse')
      fireEvent.press(getByText('Se connecter'))

      await waitFor(() => {
        expect(mockSetUser).toHaveBeenCalledWith('uid-1', 'test@test.com', 'Alice')
        expect(router.replace).toHaveBeenCalledWith('/(app)/')
      })
    })

    it('appelle setCircleIds et setActiveCircle si circleIds présent dans Firestore', async () => {
      const fakeUser = { uid: 'uid-2', email: 'test@test.com' }
      mockSignIn.mockResolvedValueOnce({ user: fakeUser })
      mockGetDoc.mockResolvedValueOnce({
        data: () => ({ displayName: 'Bob', circleIds: ['circle-abc'] }),
      })

      const { getByPlaceholderText, getByText } = render(<LoginScreen />)
      fireEvent.changeText(getByPlaceholderText('Email'), 'test@test.com')
      fireEvent.changeText(getByPlaceholderText('Mot de passe'), 'motdepasse')
      fireEvent.press(getByText('Se connecter'))

      await waitFor(() => {
        expect(mockSetCircleIds).toHaveBeenCalledWith(['circle-abc'])
        expect(mockSetActiveCircle).toHaveBeenCalledWith('circle-abc')
      })
    })
  })

  describe('AC2 — Identifiants incorrects', () => {
    it("affiche 'Email ou mot de passe incorrect' pour auth/invalid-credential", async () => {
      const { FirebaseError } = jest.requireActual('firebase/app')
      mockSignIn.mockRejectedValueOnce(
        new FirebaseError('auth/invalid-credential', 'Invalid')
      )

      const { getByPlaceholderText, getByText } = render(<LoginScreen />)
      fireEvent.changeText(getByPlaceholderText('Email'), 'x@x.com')
      fireEvent.changeText(getByPlaceholderText('Mot de passe'), 'mauvais')
      fireEvent.press(getByText('Se connecter'))

      await waitFor(() => {
        expect(getByText('Email ou mot de passe incorrect')).toBeTruthy()
      })
      expect(router.replace).not.toHaveBeenCalled()
    })
  })

  describe('Validation locale', () => {
    it('ne soumet pas si email vide', async () => {
      const { getByPlaceholderText, getByText } = render(<LoginScreen />)
      fireEvent.changeText(getByPlaceholderText('Mot de passe'), 'motdepasse')
      fireEvent.press(getByText('Se connecter'))

      await waitFor(() => {
        expect(getByText('Email requis')).toBeTruthy()
      })
      expect(mockSignIn).not.toHaveBeenCalled()
    })

    it('ne soumet pas si mot de passe vide', async () => {
      const { getByPlaceholderText, getByText } = render(<LoginScreen />)
      fireEvent.changeText(getByPlaceholderText('Email'), 'test@test.com')
      fireEvent.press(getByText('Se connecter'))

      await waitFor(() => {
        expect(getByText('Mot de passe requis')).toBeTruthy()
      })
      expect(mockSignIn).not.toHaveBeenCalled()
    })
  })
})
