import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import SettingsScreen from './settings'

jest.mock('expo-router', () => ({
  router: { replace: jest.fn() },
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
  useAuthStore: {
    getState: () => ({ reset: mockReset }),
  },
}))

jest.mock('@/stores/uiStore', () => ({
  useUIStore: {
    getState: () => ({ addToast: jest.fn() }),
  },
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
})
