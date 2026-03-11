import React from 'react'
import { render } from '@testing-library/react-native'
import { Platform } from 'react-native'

jest.mock('expo-router', () => ({ router: { back: jest.fn(), push: jest.fn() } }))
jest.mock('@/lib/firestore', () => ({ addItem: jest.fn() }))
jest.mock('@/stores/authStore', () => ({
  useAuthStore: (sel: (s: { uid: string }) => unknown) => sel({ uid: 'uid-test' }),
}))
jest.mock('@/hooks/useCollection', () => ({ useCollection: () => ({ items: [] }) }))
jest.mock('@/lib/duplicates', () => ({ findDuplicate: jest.fn(() => undefined) }))
jest.mock('expo-camera', () => ({
  CameraView: 'CameraView',
  useCameraPermissions: jest.fn(() => [{ granted: true }, jest.fn()]),
}))
jest.mock('@/hooks/useBarcodeScan', () => ({
  useBarcodeScan: () => ({
    result: null, error: null, isLoading: false,
    onBarcodeScanned: jest.fn(), reset: jest.fn(),
  }),
}))
jest.mock('@/components/scan/BarcodeOverlay', () => 'BarcodeOverlay')
jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  initializeFirestore: jest.fn(),
  persistentLocalCache: jest.fn(),
  collection: jest.fn(),
  doc: jest.fn(),
  onSnapshot: jest.fn(() => jest.fn()),
}))
jest.mock('@/lib/firebase', () => ({ db: {}, auth: { currentUser: { uid: 'uid-test' } } }))

import ScanScreen from './scan'

function setPlatformOS(os: string) {
  Object.defineProperty(Platform, 'OS', { value: os, configurable: true, writable: true })
}

afterEach(() => {
  setPlatformOS('ios')
})

describe('ScanScreen', () => {
  it('AC4 — web : affiche le message de substitution', () => {
    setPlatformOS('web')
    const { getByText } = render(<ScanScreen />)
    expect(getByText('Scanner non disponible sur web')).toBeTruthy()
    expect(getByText(/disponible uniquement sur l'application mobile/)).toBeTruthy()
  })

  it('AC4 — mobile : n\'affiche pas le message de substitution', () => {
    setPlatformOS('ios')
    const { queryByText } = render(<ScanScreen />)
    expect(queryByText('Scanner non disponible sur web')).toBeNull()
  })
})
