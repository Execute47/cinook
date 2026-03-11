import { renderHook, waitFor } from '@testing-library/react-native'

const mockOnSnapshot = jest.fn()
const mockDoc = jest.fn((_db, ...segments) => ({ path: segments.join('/') }))
jest.mock('firebase/firestore', () => ({
  doc: (...args: unknown[]) => mockDoc(...args),
  onSnapshot: (...args: unknown[]) => mockOnSnapshot(...args),
  getFirestore: jest.fn(),
}))

jest.mock('@/lib/firebase', () => ({ db: {} }))

let mockCircleId: string | null = 'circle-1'
jest.mock('@/stores/authStore', () => ({
  useAuthStore: (selector: (s: object) => unknown) =>
    selector({ activeCircleId: mockCircleId }),
}))

import { useCineclub } from './useCineclub'

beforeEach(() => {
  jest.clearAllMocks()
  mockCircleId = 'circle-1'
})

describe('useCineclub', () => {
  it('configure un listener onSnapshot avec cleanup', async () => {
    const mockUnsub = jest.fn()
    mockOnSnapshot.mockReturnValueOnce(mockUnsub)

    const { unmount } = renderHook(() => useCineclub())

    await waitFor(() => expect(mockOnSnapshot).toHaveBeenCalledTimes(1))

    unmount()
    expect(mockUnsub).toHaveBeenCalledTimes(1)
  })

  it('retourne le cineclub si le document existe', async () => {
    const fakeData = {
      itemId: 'item-1', itemTitle: 'Matrix', itemPoster: null,
      itemType: 'film', postedBy: 'Alice', postedAt: null,
    }

    mockOnSnapshot.mockImplementationOnce(
      (_ref: unknown, onNext: (snap: { exists: () => boolean; data: () => typeof fakeData }) => void) => {
        onNext({ exists: () => true, data: () => fakeData })
        return jest.fn()
      }
    )

    const { result } = renderHook(() => useCineclub())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.cineclub?.itemTitle).toBe('Matrix')
      expect(result.current.cineclub?.itemType).toBe('film')
    })
  })

  it('utilise le fallback "film" si itemType absent du document', async () => {
    const fakeData = {
      itemId: 'item-1', itemTitle: 'Matrix', itemPoster: null,
      postedBy: 'Alice', postedAt: null,
      // pas de itemType
    }

    mockOnSnapshot.mockImplementationOnce(
      (_ref: unknown, onNext: (snap: { exists: () => boolean; data: () => typeof fakeData }) => void) => {
        onNext({ exists: () => true, data: () => fakeData })
        return jest.fn()
      }
    )

    const { result } = renderHook(() => useCineclub())

    await waitFor(() => {
      expect(result.current.cineclub?.itemType).toBe('film')
    })
  })

  it('retourne null si le document nexiste pas', async () => {
    mockOnSnapshot.mockImplementationOnce(
      (_ref: unknown, onNext: (snap: { exists: () => boolean }) => void) => {
        onNext({ exists: () => false })
        return jest.fn()
      }
    )

    const { result } = renderHook(() => useCineclub())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.cineclub).toBeNull()
    })
  })

  it('retourne null et loading false si pas de circleId', async () => {
    mockCircleId = null

    const { result } = renderHook(() => useCineclub())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.cineclub).toBeNull()
    })
    expect(mockOnSnapshot).not.toHaveBeenCalled()
  })
})
