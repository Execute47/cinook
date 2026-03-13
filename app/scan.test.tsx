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
const mockUseBarcodeScan = jest.fn()
jest.mock('@/hooks/useBarcodeScan', () => ({
  useBarcodeScan: () => mockUseBarcodeScan(),
}))

jest.mock('@react-native-community/datetimepicker', () => 'DateTimePicker')
jest.mock('@/components/scan/BarcodeOverlay', () => 'BarcodeOverlay')
jest.mock('@/components/scan/WebScanner', () => ({
  __esModule: true,
  default: () => {
    const { View, Text } = require('react-native')
    return (
      <View>
        <Text testID="web-scanner">WebScanner</Text>
      </View>
    )
  },
}))
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
import { addItem } from '@/lib/firestore'
import { fireEvent, waitFor } from '@testing-library/react-native'

function setPlatformOS(os: string) {
  Object.defineProperty(Platform, 'OS', { value: os, configurable: true, writable: true })
}

const defaultScan = {
  result: null, error: null, isLoading: false,
  onBarcodeScanned: jest.fn(), reset: jest.fn(),
}

beforeEach(() => {
  jest.clearAllMocks()
  mockUseBarcodeScan.mockReturnValue(defaultScan)
})

afterEach(() => {
  setPlatformOS('ios')
})

describe('ScanScreen', () => {
  it('AC4 — web : affiche le WebScanner (PWA)', () => {
    setPlatformOS('web')
    const { getByTestId } = render(<ScanScreen />)
    expect(getByTestId('web-scanner')).toBeTruthy()
  })

  it('AC4 — mobile : n\'affiche pas le WebScanner', () => {
    setPlatformOS('ios')
    const { queryByTestId } = render(<ScanScreen />)
    expect(queryByTestId('web-scanner')).toBeNull()
  })

  it('affiche le StatusPicker après un scan réussi', () => {
    mockUseBarcodeScan.mockReturnValue({
      ...defaultScan,
      result: { title: 'Dune', type: 'film', year: 2021 },
    })
    const { getByText } = render(<ScanScreen />)
    expect(getByText('Possédé')).toBeTruthy()
    expect(getByText('Favori')).toBeTruthy()
  })

  it('crée l\'item avec statuts sélectionnés après scan', async () => {
    mockUseBarcodeScan.mockReturnValue({
      ...defaultScan,
      result: { title: 'Dune', type: 'film', year: 2021 },
    })
    const { getByText } = render(<ScanScreen />)

    fireEvent.press(getByText('Possédé'))
    fireEvent.press(getByText('Ajouter à ma collection'))

    await waitFor(() => {
      expect(addItem).toHaveBeenCalledWith(
        'uid-test',
        expect.objectContaining({ title: 'Dune', statuses: ['owned'] })
      )
    })
  })
})
