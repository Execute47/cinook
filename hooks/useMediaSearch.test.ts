import { renderHook, act, waitFor } from '@testing-library/react-native'

const mockSearchMedia = jest.fn()
jest.mock('@/lib/mediaSearch', () => ({
  searchMedia: (...args: unknown[]) => mockSearchMedia(...args),
}))

const mockAddToast = jest.fn()
const mockSetLoading = jest.fn()
jest.mock('@/stores/uiStore', () => ({
  useUIStore: {
    getState: () => ({ addToast: mockAddToast, setLoading: mockSetLoading }),
  },
}))

import { useMediaSearch } from './useMediaSearch'

beforeEach(() => {
  jest.clearAllMocks()
  jest.useFakeTimers()
})

afterEach(() => {
  jest.useRealTimers()
})

describe('useMediaSearch', () => {
  describe('AC1 — Debounce et appel searchMedia', () => {
    it('ne pas appeler searchMedia si query < 2 caractères', async () => {
      const { result } = renderHook(() => useMediaSearch())

      act(() => result.current.setQuery('a'))
      act(() => jest.runAllTimers())

      expect(mockSearchMedia).not.toHaveBeenCalled()
    })

    it('appelle searchMedia après 400ms si query >= 2 caractères', async () => {
      mockSearchMedia.mockResolvedValueOnce({ success: true, data: [] })

      const { result } = renderHook(() => useMediaSearch())

      act(() => result.current.setQuery('ma'))
      act(() => jest.advanceTimersByTime(400))

      await waitFor(() => {
        expect(mockSearchMedia).toHaveBeenCalledWith({ query: 'ma', type: 'film' })
      })
    })

    it('stocke les résultats si success: true', async () => {
      const fakeResults = [
        { title: 'Matrix', type: 'film', year: 1999, tmdbId: '603' },
      ]
      mockSearchMedia.mockResolvedValueOnce({ success: true, data: fakeResults })

      const { result } = renderHook(() => useMediaSearch())

      act(() => result.current.setQuery('matrix'))
      act(() => jest.advanceTimersByTime(400))

      await waitFor(() => {
        expect(result.current.results).toEqual(fakeResults)
      })
    })
  })

  describe('AC3 — Gestion des erreurs', () => {
    it('stocke error et affiche toast si success: false', async () => {
      mockSearchMedia.mockResolvedValueOnce({ success: false, error: 'Service indisponible' })

      const { result } = renderHook(() => useMediaSearch())

      act(() => result.current.setQuery('test'))
      act(() => jest.advanceTimersByTime(400))

      await waitFor(() => {
        expect(result.current.error).toBe('Service indisponible')
        expect(result.current.results).toEqual([])
        expect(mockAddToast).toHaveBeenCalledWith('Service indisponible', 'error')
      })
    })
  })

  describe('Reset', () => {
    it('remet query, results et error à zéro', async () => {
      mockSearchMedia.mockResolvedValueOnce({ success: true, data: [{ title: 'X', type: 'film' }] })

      const { result } = renderHook(() => useMediaSearch())

      act(() => result.current.setQuery('matrix'))
      act(() => jest.advanceTimersByTime(400))
      await waitFor(() => expect(result.current.results.length).toBe(1))

      act(() => result.current.reset())

      expect(result.current.query).toBe('')
      expect(result.current.results).toEqual([])
      expect(result.current.error).toBeNull()
    })
  })
})
