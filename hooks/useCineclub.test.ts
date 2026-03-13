import { renderHook, waitFor } from '@testing-library/react-native'

const mockOnSnapshot = jest.fn()
const mockCollection = jest.fn((_db, ...segments) => ({ path: segments.join('/') }))
jest.mock('firebase/firestore', () => ({
  collection: (...args: unknown[]) => mockCollection(...args),
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

  it('retourne les cineclubs si des documents existent', async () => {
    const fakeDoc = {
      data: () => ({
        itemId: 'item-1', itemTitle: 'Matrix', itemPoster: null,
        itemType: 'film', postedBy: 'Alice', postedAt: null,
      }),
    }

    mockOnSnapshot.mockImplementationOnce(
      (_ref: unknown, onNext: (snap: { docs: typeof fakeDoc[] }) => void) => {
        onNext({ docs: [fakeDoc] })
        return jest.fn()
      }
    )

    const { result } = renderHook(() => useCineclub())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.cineclubs).toHaveLength(1)
      expect(result.current.cineclubs[0].itemTitle).toBe('Matrix')
      expect(result.current.cineclubs[0].itemType).toBe('film')
    })
  })

  it('utilise le fallback "film" si itemType absent du document', async () => {
    const fakeDoc = {
      data: () => ({
        itemId: 'item-1', itemTitle: 'Matrix', itemPoster: null,
        postedBy: 'Alice', postedAt: null,
        // pas de itemType
      }),
    }

    mockOnSnapshot.mockImplementationOnce(
      (_ref: unknown, onNext: (snap: { docs: typeof fakeDoc[] }) => void) => {
        onNext({ docs: [fakeDoc] })
        return jest.fn()
      }
    )

    const { result } = renderHook(() => useCineclub())

    await waitFor(() => {
      expect(result.current.cineclubs[0].itemType).toBe('film')
    })
  })

  it('ignore le document legacy avec id "current"', async () => {
    const legacyDoc = {
      id: 'current',
      data: () => ({
        itemId: 'item-old', itemTitle: 'OldFilm', itemPoster: null,
        itemType: 'film', postedBy: 'Alice', postedAt: null,
      }),
    }

    mockOnSnapshot.mockImplementationOnce(
      (_ref: unknown, onNext: (snap: { docs: typeof legacyDoc[] }) => void) => {
        onNext({ docs: [legacyDoc] })
        return jest.fn()
      }
    )

    const { result } = renderHook(() => useCineclub())

    await waitFor(() => {
      expect(result.current.cineclubs).toHaveLength(0)
    })
  })

  it('ignore les documents sans itemId', async () => {
    const validDoc = {
      data: () => ({
        itemId: 'item-1', itemTitle: 'Matrix', itemPoster: null,
        itemType: 'film', postedBy: 'Alice', postedAt: null,
      }),
    }
    const invalidDoc = {
      data: () => ({ itemTitle: 'Orphan', postedBy: 'Bob', postedAt: null }),
    }

    mockOnSnapshot.mockImplementationOnce(
      (_ref: unknown, onNext: (snap: { docs: (typeof validDoc | typeof invalidDoc)[] }) => void) => {
        onNext({ docs: [validDoc, invalidDoc] })
        return jest.fn()
      }
    )

    const { result } = renderHook(() => useCineclub())

    await waitFor(() => {
      expect(result.current.cineclubs).toHaveLength(1)
      expect(result.current.cineclubs[0].itemId).toBe('item-1')
    })
  })

  it('retourne un tableau vide si aucun document', async () => {
    mockOnSnapshot.mockImplementationOnce(
      (_ref: unknown, onNext: (snap: { docs: [] }) => void) => {
        onNext({ docs: [] })
        return jest.fn()
      }
    )

    const { result } = renderHook(() => useCineclub())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.cineclubs).toEqual([])
    })
  })

  it('retourne un tableau vide et loading false si pas de circleId', async () => {
    mockCircleId = null

    const { result } = renderHook(() => useCineclub())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.cineclubs).toEqual([])
    })
    expect(mockOnSnapshot).not.toHaveBeenCalled()
  })
})
