import { renderHook, waitFor } from '@testing-library/react-native'

const mockOnSnapshot = jest.fn()
const mockQuery = jest.fn()
const mockCollection = jest.fn()
const mockOrderBy = jest.fn()
jest.mock('firebase/firestore', () => ({
  collection: (...args: unknown[]) => mockCollection(...args),
  query: (...args: unknown[]) => mockQuery(...args),
  orderBy: (...args: unknown[]) => mockOrderBy(...args),
  onSnapshot: (...args: unknown[]) => mockOnSnapshot(...args),
  getFirestore: jest.fn(),
}))

jest.mock('@/lib/firebase', () => ({ db: {} }))
jest.mock('@/lib/auth', () => ({ signInWithGoogle: jest.fn() }))

jest.mock('@/stores/authStore', () => ({
  useAuthStore: (selector: (s: { uid: string }) => unknown) =>
    selector({ uid: 'uid-test' }),
}))

import { useCollection } from './useCollection'

beforeEach(() => jest.clearAllMocks())

describe('useCollection', () => {
  it('configure un listener onSnapshot avec cleanup', async () => {
    const mockUnsubscribe = jest.fn()
    mockOnSnapshot.mockReturnValueOnce(mockUnsubscribe)

    const { unmount } = renderHook(() => useCollection())

    await waitFor(() => expect(mockOnSnapshot).toHaveBeenCalledTimes(1))

    unmount()
    expect(mockUnsubscribe).toHaveBeenCalledTimes(1)
  })

  it('mappe les docs Firestore en MediaItem avec id', async () => {
    const fakeDocs = [
      { id: 'item-1', data: () => ({ title: 'Matrix', type: 'film', status: 'owned', tier: 'none', addedVia: 'search' }) },
    ]
    mockOnSnapshot.mockImplementationOnce((q, onNext) => {
      onNext({ docs: fakeDocs })
      return jest.fn()
    })

    const { result } = renderHook(() => useCollection())

    await waitFor(() => {
      expect(result.current.items).toEqual([
        { id: 'item-1', title: 'Matrix', type: 'film', status: 'owned', tier: 'none', addedVia: 'search' },
      ])
      expect(result.current.loading).toBe(false)
    })
  })
})
