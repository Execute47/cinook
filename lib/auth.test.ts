import { Platform } from 'react-native'

// Mocks
const mockHasPlayServices = jest.fn()
const mockSignIn = jest.fn()
jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: (...args: unknown[]) => mockHasPlayServices(...args),
    signIn: (...args: unknown[]) => mockSignIn(...args),
  },
  statusCodes: {
    SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED',
    IN_PROGRESS: 'IN_PROGRESS',
  },
}))

const mockSignInWithCredential = jest.fn()
const mockGoogleCredential = jest.fn()
jest.mock('firebase/auth', () => ({
  GoogleAuthProvider: {
    credential: (...args: unknown[]) => mockGoogleCredential(...args),
  },
  signInWithCredential: (...args: unknown[]) => mockSignInWithCredential(...args),
  getAuth: jest.fn(),
  initializeAuth: jest.fn(),
  getReactNativePersistence: jest.fn(),
}))

const mockGetDoc = jest.fn()
const mockSetDoc = jest.fn()
const mockDoc = jest.fn()
const mockServerTimestamp = jest.fn(() => 'ts')
jest.mock('firebase/firestore', () => ({
  doc: (...args: unknown[]) => mockDoc(...args),
  getDoc: (...args: unknown[]) => mockGetDoc(...args),
  setDoc: (...args: unknown[]) => mockSetDoc(...args),
  serverTimestamp: () => mockServerTimestamp(),
  getFirestore: jest.fn(),
}))

jest.mock('@react-native-async-storage/async-storage', () => ({}))
jest.mock('@/lib/firebase', () => ({ auth: {}, db: {} }))

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

import { signInWithGoogle } from './auth'

beforeEach(() => {
  jest.clearAllMocks()
  // Simuler Android par défaut
  Object.defineProperty(Platform, 'OS', { value: 'android', configurable: true })
})

describe('signInWithGoogle', () => {
  const fakeUser = { uid: 'uid-google', email: 'user@gmail.com', displayName: 'Alice' }

  describe('Flow complet — premier login Google', () => {
    it('appelle signInWithCredential, crée le profil Firestore et hydrate authStore', async () => {
      mockHasPlayServices.mockResolvedValueOnce(true)
      mockSignIn.mockResolvedValueOnce({ data: { idToken: 'mock-id-token' } })
      mockGoogleCredential.mockReturnValueOnce('mock-credential')
      mockSignInWithCredential.mockResolvedValueOnce({ user: fakeUser })
      mockGetDoc.mockResolvedValueOnce({ exists: () => false })
      mockSetDoc.mockResolvedValueOnce(undefined)

      const result = await signInWithGoogle()

      expect(mockSignInWithCredential).toHaveBeenCalledWith({}, 'mock-credential')
      expect(mockSetDoc).toHaveBeenCalled()
      expect(mockSetUser).toHaveBeenCalledWith('uid-google', 'user@gmail.com', 'Alice')
      expect(result).toBe(true)
    })
  })

  describe('Flow complet — login existant', () => {
    it('ne recrée pas le profil Firestore si déjà existant', async () => {
      mockHasPlayServices.mockResolvedValueOnce(true)
      mockSignIn.mockResolvedValueOnce({ data: { idToken: 'mock-id-token' } })
      mockGoogleCredential.mockReturnValueOnce('mock-credential')
      mockSignInWithCredential.mockResolvedValueOnce({ user: fakeUser })
      mockGetDoc.mockResolvedValueOnce({ exists: () => true, data: () => ({ circleIds: [] }) })

      const result = await signInWithGoogle()

      expect(mockSetDoc).not.toHaveBeenCalled()
      expect(mockSetUser).toHaveBeenCalledWith('uid-google', 'user@gmail.com', 'Alice')
      expect(result).toBe(true)
    })

    it('appelle setCircleIds et setActiveCircle si circleIds présent', async () => {
      mockHasPlayServices.mockResolvedValueOnce(true)
      mockSignIn.mockResolvedValueOnce({ data: { idToken: 'mock-id-token' } })
      mockGoogleCredential.mockReturnValueOnce('mock-credential')
      mockSignInWithCredential.mockResolvedValueOnce({ user: fakeUser })
      mockGetDoc.mockResolvedValueOnce({ exists: () => true, data: () => ({ circleIds: ['circle-1'] }) })

      await signInWithGoogle()

      expect(mockSetCircleIds).toHaveBeenCalledWith(['circle-1'])
      expect(mockSetActiveCircle).toHaveBeenCalledWith('circle-1')
    })
  })

  describe('Annulation utilisateur', () => {
    it('retourne false sans toast pour SIGN_IN_CANCELLED', async () => {
      mockHasPlayServices.mockResolvedValueOnce(true)
      mockSignIn.mockRejectedValueOnce({ code: 'SIGN_IN_CANCELLED' })

      const result = await signInWithGoogle()

      expect(result).toBe(false)
      expect(mockAddToast).not.toHaveBeenCalled()
    })

    it('retourne false sans toast pour IN_PROGRESS', async () => {
      mockHasPlayServices.mockResolvedValueOnce(true)
      mockSignIn.mockRejectedValueOnce({ code: 'IN_PROGRESS' })

      const result = await signInWithGoogle()

      expect(result).toBe(false)
      expect(mockAddToast).not.toHaveBeenCalled()
    })
  })

  describe('Erreur réseau / Firebase', () => {
    it('affiche un toast et retourne false', async () => {
      mockHasPlayServices.mockResolvedValueOnce(true)
      mockSignIn.mockRejectedValueOnce(new Error('Network error'))

      const result = await signInWithGoogle()

      expect(result).toBe(false)
      expect(mockAddToast).toHaveBeenCalledWith('Erreur de connexion Google', 'error')
    })
  })
})
