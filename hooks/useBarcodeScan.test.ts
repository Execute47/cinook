import { renderHook, act, waitFor } from '@testing-library/react-native'
import { useBarcodeScan } from './useBarcodeScan'

jest.mock('@/lib/mediaSearch', () => ({
  getMediaByBarcode: jest.fn(),
}))

import { getMediaByBarcode } from '@/lib/mediaSearch'
const mockGetMediaByBarcode = getMediaByBarcode as jest.MockedFunction<typeof getMediaByBarcode>

const filmResult = { title: 'Inception', type: 'film' as const, tmdbId: '27205' }
const bookResult = { title: 'Clean Code', type: 'livre' as const, googleBooksId: 'abc' }

describe('useBarcodeScan', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('barcode valide → getMediaByBarcode appelé, result stocké, error null', async () => {
    mockGetMediaByBarcode.mockResolvedValue({ success: true, data: filmResult })

    const { result } = renderHook(() => useBarcodeScan())

    act(() => {
      result.current.onBarcodeScanned('3700259822718')
    })

    await waitFor(() => {
      expect(result.current.result).toEqual(filmResult)
    })

    expect(mockGetMediaByBarcode).toHaveBeenCalledWith('3700259822718')
    expect(result.current.error).toBeNull()
    expect(result.current.isLoading).toBe(false)
  })

  it('réponse success: false → error stocké, result null', async () => {
    mockGetMediaByBarcode.mockResolvedValue({ success: false, error: 'Code non reconnu' })

    const { result } = renderHook(() => useBarcodeScan())

    act(() => {
      result.current.onBarcodeScanned('0000000000000')
    })

    await waitFor(() => {
      expect(result.current.error).toBe('Code non reconnu')
    })

    expect(result.current.result).toBeNull()
    expect(result.current.isLoading).toBe(false)
  })

  it('scans multiples ignorés via scannedRef', async () => {
    mockGetMediaByBarcode.mockResolvedValue({ success: true, data: filmResult })

    const { result } = renderHook(() => useBarcodeScan())

    act(() => {
      result.current.onBarcodeScanned('3700259822718')
      result.current.onBarcodeScanned('3700259822718')
      result.current.onBarcodeScanned('3700259822718')
    })

    await waitFor(() => {
      expect(result.current.result).toEqual(filmResult)
    })

    expect(mockGetMediaByBarcode).toHaveBeenCalledTimes(1)
  })

  it('reset() remet l\'état initial et permet un nouveau scan', async () => {
    mockGetMediaByBarcode.mockResolvedValue({ success: true, data: filmResult })

    const { result } = renderHook(() => useBarcodeScan())

    act(() => {
      result.current.onBarcodeScanned('3700259822718')
    })

    await waitFor(() => {
      expect(result.current.result).toEqual(filmResult)
    })

    act(() => {
      result.current.reset()
    })

    expect(result.current.result).toBeNull()
    expect(result.current.error).toBeNull()
    expect(result.current.isScanning).toBe(true)

    // Nouveau scan possible après reset
    mockGetMediaByBarcode.mockResolvedValue({ success: true, data: bookResult })
    act(() => {
      result.current.onBarcodeScanned('9780132350884')
    })

    await waitFor(() => {
      expect(result.current.result).toEqual(bookResult)
    })
  })
})
