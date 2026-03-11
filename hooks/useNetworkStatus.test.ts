import { renderHook, act } from '@testing-library/react-native'

// Mock NetInfo
let netInfoCallback: ((state: { isConnected: boolean }) => void) | null = null
const mockNetInfoUnsub = jest.fn()
jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn((cb) => {
    netInfoCallback = cb
    return mockNetInfoUnsub
  }),
}))

// Mock onSnapshotsInSync
let snapshotsInSyncCallback: (() => void) | null = null
const mockSnapshotsUnsub = jest.fn()
jest.mock('firebase/firestore', () => ({
  onSnapshotsInSync: jest.fn((db, cb) => {
    snapshotsInSyncCallback = cb
    return mockSnapshotsUnsub
  }),
  getFirestore: jest.fn(),
  initializeFirestore: jest.fn(),
  persistentLocalCache: jest.fn(),
}))

jest.mock('@/lib/firebase', () => ({ db: {} }))

// Mock uiStore
const mockSetSyncPending = jest.fn()
jest.mock('@/stores/uiStore', () => ({
  useUIStore: {
    getState: () => ({ setSyncPending: mockSetSyncPending }),
  },
}))

import { useNetworkStatus } from './useNetworkStatus'

beforeEach(() => {
  jest.clearAllMocks()
  netInfoCallback = null
  snapshotsInSyncCallback = null
})

describe('useNetworkStatus', () => {
  it('appelle setSyncPending(true) quand le réseau est déconnecté', () => {
    renderHook(() => useNetworkStatus())
    act(() => { netInfoCallback?.({ isConnected: false }) })
    expect(mockSetSyncPending).toHaveBeenCalledWith(true)
  })

  it('ne modifie pas syncPending si le réseau est connecté', () => {
    renderHook(() => useNetworkStatus())
    act(() => { netInfoCallback?.({ isConnected: true }) })
    expect(mockSetSyncPending).not.toHaveBeenCalledWith(true)
  })

  it('appelle setSyncPending(false) quand onSnapshotsInSync se déclenche', () => {
    renderHook(() => useNetworkStatus())
    act(() => { snapshotsInSyncCallback?.() })
    expect(mockSetSyncPending).toHaveBeenCalledWith(false)
  })

  it('unsubscribe les listeners au démontage', () => {
    const { unmount } = renderHook(() => useNetworkStatus())
    unmount()
    expect(mockNetInfoUnsub).toHaveBeenCalledTimes(1)
    expect(mockSnapshotsUnsub).toHaveBeenCalledTimes(1)
  })
})
