import { renderHook, waitFor } from '@testing-library/react-native'

const mockOnSnapshot = jest.fn()
const mockCollection = jest.fn()
jest.mock('firebase/firestore', () => ({
  collection: (...args: unknown[]) => mockCollection(...args),
  onSnapshot: (...args: unknown[]) => mockOnSnapshot(...args),
  getFirestore: jest.fn(),
}))

jest.mock('@/lib/firebase', () => ({ db: {} }))

let mockUid = 'uid-me'
let mockCircleId = 'circle-1'
jest.mock('@/stores/authStore', () => ({
  useAuthStore: (selector: (s: object) => unknown) =>
    selector({ uid: mockUid, circleId: mockCircleId }),
}))

import { useRecommendations } from './useRecommendations'

beforeEach(() => {
  jest.clearAllMocks()
  mockUid = 'uid-me'
  mockCircleId = 'circle-1'
})

describe('useRecommendations', () => {
  it('configure un listener onSnapshot avec cleanup', async () => {
    const mockUnsub = jest.fn()
    mockOnSnapshot.mockReturnValueOnce(mockUnsub)

    const { unmount } = renderHook(() => useRecommendations())

    await waitFor(() => expect(mockOnSnapshot).toHaveBeenCalledTimes(1))

    unmount()
    expect(mockUnsub).toHaveBeenCalledTimes(1)
  })

  it('filtre les recommandations où toUserIds contient uid', async () => {
    const fakeDocs = [
      {
        id: 'reco-1',
        data: () => ({
          fromUserId: 'uid-other',
          fromUserName: 'Alice',
          toUserIds: ['uid-me'],
          itemId: 'item-1',
          itemTitle: 'Matrix',
          itemPoster: null,
          createdAt: null,
        }),
      },
      {
        id: 'reco-2',
        data: () => ({
          fromUserId: 'uid-other',
          fromUserName: 'Alice',
          toUserIds: ['uid-bob'],  // pas pour moi
          itemId: 'item-2',
          itemTitle: 'Inception',
          itemPoster: null,
          createdAt: null,
        }),
      },
    ]

    mockOnSnapshot.mockImplementationOnce((_col: unknown, onNext: (snap: { docs: typeof fakeDocs }) => void) => {
      onNext({ docs: fakeDocs })
      return jest.fn()
    })

    const { result } = renderHook(() => useRecommendations())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.recommendations).toHaveLength(1)
      expect(result.current.recommendations[0].id).toBe('reco-1')
    })
  })

  it('retourne un tableau vide et loading false si pas de circleId', async () => {
    mockCircleId = null as unknown as string

    const { result } = renderHook(() => useRecommendations())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.recommendations).toEqual([])
    })
    expect(mockOnSnapshot).not.toHaveBeenCalled()
  })
})
