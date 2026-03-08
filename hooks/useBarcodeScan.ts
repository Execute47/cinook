import { useState, useRef } from 'react'
import { getMediaByBarcode } from '@/lib/mediaSearch'
import type { MediaResult } from '@/types/api'

interface UseBarcodeScanReturn {
  isScanning: boolean
  result: MediaResult | null
  error: string | null
  isLoading: boolean
  onBarcodeScanned: (barcode: string) => void
  reset: () => void
}

export function useBarcodeScan(): UseBarcodeScanReturn {
  const [isScanning, setIsScanning] = useState(true)
  const [result, setResult] = useState<MediaResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const scannedRef = useRef(false)

  const onBarcodeScanned = async (barcode: string) => {
    if (scannedRef.current || isLoading) return
    scannedRef.current = true
    setIsLoading(true)
    setIsScanning(false)

    const response = await getMediaByBarcode(barcode)

    if (response.success) {
      setResult(response.data)
    } else {
      setError(response.error)
    }

    setIsLoading(false)
  }

  const reset = () => {
    scannedRef.current = false
    setResult(null)
    setError(null)
    setIsScanning(true)
    setIsLoading(false)
  }

  return { isScanning, result, error, isLoading, onBarcodeScanned, reset }
}
