jest.mock('@/lib/firebase', () => ({ db: {} }))

const mockUnsubscribe = jest.fn()
const mockOnSnapshot = jest.fn()
const mockGetDoc = jest.fn()

jest.mock('firebase/firestore', () => ({
  onSnapshot: (...args: unknown[]) => mockOnSnapshot(...args),
  getDoc: (...args: unknown[]) => mockGetDoc(...args),
  doc: jest.fn((_db, ...segments) => ({ path: segments.join('/') })),
}))

jest.mock('@/stores/authStore', () => ({
  useAuthStore: (selector: (s: object) => unknown) =>
    selector({ uid: 'uid-1', circleId: 'circle-1' }),
}))

import { renderHook, act } from '@testing-library/react-native'
import { useCircle } from './useCircle'

beforeEach(() => {
  jest.clearAllMocks()
  mockOnSnapshot.mockReturnValue(mockUnsubscribe)
})

const makeCircleSnap = (adminId: string, members: string[]) => ({
  exists: () => true,
  data: () => ({ adminId, members }),
})

const makeUserSnap = (displayName: string | null, email: string) => ({
  data: () => ({ displayName, email }),
})

describe('useCircle', () => {
  it('démarre avec loading=true', () => {
    mockOnSnapshot.mockReturnValue(mockUnsubscribe) // never fires
    const { result } = renderHook(() => useCircle())
    expect(result.current.loading).toBe(true)
  })

  it('inscrit un listener sur /circles/{circleId}', () => {
    renderHook(() => useCircle())
    expect(mockOnSnapshot).toHaveBeenCalledWith(
      expect.objectContaining({ path: 'circles/circle-1' }),
      expect.any(Function),
      expect.any(Function)
    )
  })

  it('retourne les membres avec leurs profils', async () => {
    mockGetDoc
      .mockResolvedValueOnce(makeUserSnap('Alice', 'alice@test.com'))
      .mockResolvedValueOnce(makeUserSnap(null, 'bob@test.com'))

    const { result } = renderHook(() => useCircle())

    await act(async () => {
      const snapshotCallback = mockOnSnapshot.mock.calls[0][1]
      await snapshotCallback(makeCircleSnap('uid-1', ['uid-1', 'uid-2']))
    })

    expect(result.current.loading).toBe(false)
    expect(result.current.members).toHaveLength(2)
    expect(result.current.members[0]).toMatchObject({ uid: 'uid-1', displayName: 'Alice', email: 'alice@test.com' })
    expect(result.current.members[1]).toMatchObject({ uid: 'uid-2', displayName: null, email: 'bob@test.com' })
  })

  it('isAdmin est true si uid === adminId', async () => {
    mockGetDoc.mockResolvedValueOnce(makeUserSnap('Alice', 'a@test.com'))

    const { result } = renderHook(() => useCircle())

    await act(async () => {
      const snapshotCallback = mockOnSnapshot.mock.calls[0][1]
      await snapshotCallback(makeCircleSnap('uid-1', ['uid-1']))
    })

    expect(result.current.isAdmin).toBe(true)
  })

  it('isAdmin est false si uid !== adminId', async () => {
    mockGetDoc.mockResolvedValueOnce(makeUserSnap('Bob', 'b@test.com'))

    const { result } = renderHook(() => useCircle())

    await act(async () => {
      const snapshotCallback = mockOnSnapshot.mock.calls[0][1]
      await snapshotCallback(makeCircleSnap('other-uid', ['uid-1']))
    })

    expect(result.current.isAdmin).toBe(false)
  })

  it('appelle unsubscribe au démontage (cleanup)', () => {
    const { unmount } = renderHook(() => useCircle())
    unmount()
    expect(mockUnsubscribe).toHaveBeenCalled()
  })

  it("affiche une erreur si le cercle n'existe pas", async () => {
    const { result } = renderHook(() => useCircle())

    await act(async () => {
      const snapshotCallback = mockOnSnapshot.mock.calls[0][1]
      await snapshotCallback({ exists: () => false, data: () => null })
    })

    expect(result.current.error).toBe('Cercle introuvable')
    expect(result.current.loading).toBe(false)
  })
})
