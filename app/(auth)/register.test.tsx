import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import RegisterScreen from './register'

// Mock expo-router
jest.mock('expo-router', () => ({
  router: {
    replace: jest.fn(),
    push: jest.fn(),
  },
}))

// Mock Firebase Auth
const mockCreateUserWithEmailAndPassword = jest.fn()
const mockUpdateProfile = jest.fn()
jest.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: (...args: unknown[]) =>
    mockCreateUserWithEmailAndPassword(...args),
  updateProfile: (...args: unknown[]) => mockUpdateProfile(...args),
  getAuth: jest.fn(),
}))

// Mock Firebase Firestore
const mockSetDoc = jest.fn()
const mockDoc = jest.fn()
const mockServerTimestamp = jest.fn(() => ({ seconds: 0, nanoseconds: 0 }))
jest.mock('firebase/firestore', () => ({
  doc: (...args: unknown[]) => mockDoc(...args),
  setDoc: (...args: unknown[]) => mockSetDoc(...args),
  serverTimestamp: () => mockServerTimestamp(),
  getFirestore: jest.fn(),
  initializeFirestore: jest.fn(),
  persistentLocalCache: jest.fn(),
}))

// Mock lib/firebase
jest.mock('@/lib/firebase', () => ({
  auth: {},
  db: {},
}))

jest.mock('@/lib/auth', () => ({
  signInWithGoogle: jest.fn(),
}))

// Mock authStore
const mockSetUser = jest.fn()
jest.mock('@/stores/authStore', () => ({
  useAuthStore: {
    getState: () => ({ setUser: mockSetUser }),
  },
}))

// Mock uiStore
const mockAddToast = jest.fn()
jest.mock('@/stores/uiStore', () => ({
  useUIStore: {
    getState: () => ({ addToast: mockAddToast }),
  },
}))

import { router } from 'expo-router'

beforeEach(() => {
  jest.clearAllMocks()
})

describe('RegisterScreen', () => {
  describe('AC3 — Validation du formulaire', () => {
    it('affiche une erreur pour un email invalide sans appel Firebase', async () => {
      const { getByPlaceholderText, getByText } = render(<RegisterScreen />)
      fireEvent.changeText(getByPlaceholderText('Email'), 'pasunemail')
      fireEvent.changeText(getByPlaceholderText('Mot de passe'), 'motdepasse')
      fireEvent.press(getByText("Créer mon compte"))

      await waitFor(() => {
        expect(getByText('Email invalide')).toBeTruthy()
      })
      expect(mockCreateUserWithEmailAndPassword).not.toHaveBeenCalled()
    })

    it('affiche une erreur si le mot de passe est trop court sans appel Firebase', async () => {
      const { getByPlaceholderText, getByText } = render(<RegisterScreen />)
      fireEvent.changeText(getByPlaceholderText('Email'), 'test@test.com')
      fireEvent.changeText(getByPlaceholderText('Mot de passe'), '123')
      fireEvent.press(getByText("Créer mon compte"))

      await waitFor(() => {
        expect(
          getByText('Le mot de passe doit contenir au moins 6 caractères')
        ).toBeTruthy()
      })
      expect(mockCreateUserWithEmailAndPassword).not.toHaveBeenCalled()
    })
  })

  describe('AC1 — Création de compte réussie', () => {
    it('appelle setUser avec les bons arguments après création réussie', async () => {
      const fakeUser = { uid: 'uid-123', email: 'test@test.com' }
      mockCreateUserWithEmailAndPassword.mockResolvedValueOnce({
        user: fakeUser,
      })
      mockUpdateProfile.mockResolvedValueOnce(undefined)
      mockSetDoc.mockResolvedValueOnce(undefined)

      const { getByPlaceholderText, getByText } = render(<RegisterScreen />)
      fireEvent.changeText(getByPlaceholderText('Prénom (optionnel)'), 'Alice')
      fireEvent.changeText(getByPlaceholderText('Email'), 'test@test.com')
      fireEvent.changeText(getByPlaceholderText('Mot de passe'), 'motdepasse')
      fireEvent.press(getByText("Créer mon compte"))

      await waitFor(() => {
        expect(mockSetUser).toHaveBeenCalledWith('uid-123', 'test@test.com', 'Alice')
      })
      expect(router.replace).toHaveBeenCalledWith('/(app)/')
    })

    it('navigue même si Firestore échoue (non bloquant)', async () => {
      const fakeUser = { uid: 'uid-456', email: 'test@test.com' }
      mockCreateUserWithEmailAndPassword.mockResolvedValueOnce({
        user: fakeUser,
      })
      mockUpdateProfile.mockResolvedValueOnce(undefined)
      mockSetDoc.mockRejectedValueOnce(new Error('Firestore down'))

      const { getByPlaceholderText, getByText } = render(<RegisterScreen />)
      fireEvent.changeText(getByPlaceholderText('Email'), 'test@test.com')
      fireEvent.changeText(getByPlaceholderText('Mot de passe'), 'motdepasse')
      fireEvent.press(getByText("Créer mon compte"))

      await waitFor(() => {
        expect(router.replace).toHaveBeenCalledWith('/(app)/')
      })
    })
  })

  describe('AC2 — Email déjà utilisé', () => {
    it("affiche 'Ce compte existe déjà' pour auth/email-already-in-use", async () => {
      const { FirebaseError } = jest.requireActual('firebase/app')
      const error = new FirebaseError(
        'auth/email-already-in-use',
        'Email already in use'
      )
      mockCreateUserWithEmailAndPassword.mockRejectedValueOnce(error)

      const { getByPlaceholderText, getByText } = render(<RegisterScreen />)
      fireEvent.changeText(getByPlaceholderText('Email'), 'existe@test.com')
      fireEvent.changeText(getByPlaceholderText('Mot de passe'), 'motdepasse')
      fireEvent.press(getByText("Créer mon compte"))

      await waitFor(() => {
        expect(getByText('Ce compte existe déjà')).toBeTruthy()
      })
    })
  })
})
