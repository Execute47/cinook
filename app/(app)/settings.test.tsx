import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import SettingsScreen from './settings'

jest.mock('expo-router', () => ({
  router: { replace: jest.fn() },
}))

jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: { signIn: jest.fn() },
}))

const mockSignOut = jest.fn()
jest.mock('firebase/auth', () => ({
  signOut: (...args: unknown[]) => mockSignOut(...args),
  getAuth: jest.fn(),
}))

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  initializeFirestore: jest.fn(),
  persistentLocalCache: jest.fn(),
}))

jest.mock('@/lib/firebase', () => ({ auth: {}, db: {} }))

const mockReset = jest.fn()
jest.mock('@/stores/authStore', () => ({
  useAuthStore: Object.assign(
    (selector: (s: object) => unknown) => selector({ circleIds: [] }),
    { getState: () => ({ reset: mockReset }) }
  ),
}))

const mockAddToast = jest.fn()
const mockSetLoading = jest.fn()
jest.mock('@/stores/uiStore', () => ({
  useUIStore: {
    getState: () => ({ addToast: mockAddToast, setLoading: mockSetLoading }),
  },
}))

const mockExportCollection = jest.fn()
jest.mock('@/lib/export', () => ({
  exportCollection: (...args: unknown[]) => mockExportCollection(...args),
}))

jest.mock('@/hooks/useCollection', () => ({
  useCollection: () => ({ items: [{ id: '1', title: 'Film A', type: 'film' }], loading: false }),
}))

import { router } from 'expo-router'

beforeEach(() => jest.clearAllMocks())

describe('SettingsScreen', () => {
  describe('AC3 — Déconnexion', () => {
    it('appelle signOut, reset authStore et redirige vers login', async () => {
      mockSignOut.mockResolvedValueOnce(undefined)

      const { getByText } = render(<SettingsScreen />)
      fireEvent.press(getByText('Se déconnecter'))

      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalled()
        expect(mockReset).toHaveBeenCalled()
        expect(router.replace).toHaveBeenCalledWith('/(auth)/login')
      })
    })
  })

  describe('AC1 — Export CSV', () => {
    it('appelle exportCollection avec format csv', async () => {
      mockExportCollection.mockResolvedValueOnce(undefined)
      const { getByText } = render(<SettingsScreen />)
      fireEvent.press(getByText('Exporter en CSV'))
      await waitFor(() =>
        expect(mockExportCollection).toHaveBeenCalledWith(expect.any(Array), 'csv')
      )
    })
  })

  describe('AC1 — Export JSON', () => {
    it('appelle exportCollection avec format json', async () => {
      mockExportCollection.mockResolvedValueOnce(undefined)
      const { getByText } = render(<SettingsScreen />)
      fireEvent.press(getByText('Exporter en JSON'))
      await waitFor(() =>
        expect(mockExportCollection).toHaveBeenCalledWith(expect.any(Array), 'json')
      )
    })
  })
})
