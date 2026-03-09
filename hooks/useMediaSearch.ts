import { useState, useEffect } from 'react'
import { searchMedia } from '@/lib/mediaSearch'
import { useUIStore } from '@/stores/uiStore'
import type { MediaResult } from '@/types/api'
import type { MediaType } from '@/types/media'

interface UseMediaSearchReturn {
  results: MediaResult[]
  isLoading: boolean
  error: string | null
  query: string
  mediaType: MediaType
  setQuery: (q: string) => void
  setMediaType: (t: MediaType) => void
  reset: () => void
}

export function useMediaSearch(): UseMediaSearchReturn {
  const [results, setResults] = useState<MediaResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [mediaType, setMediaType] = useState<MediaType>('film')

  useEffect(() => {
    if (query.length < 2) {
      setResults([])
      setError(null)
      return
    }

    const timer = setTimeout(async () => {
      setIsLoading(true)
      useUIStore.getState().setLoading('search', true)
      setError(null)

      const res = await searchMedia({ query, type: mediaType })

      if (res.success) {
        setResults(res.data)
      } else {
        setResults([])
        setError(res.error)
        useUIStore.getState().addToast(res.error, 'error')
      }

      setIsLoading(false)
      useUIStore.getState().setLoading('search', false)
    }, 400)

    return () => clearTimeout(timer)
  }, [query, mediaType])

  const reset = () => {
    setQuery('')
    setResults([])
    setError(null)
    setIsLoading(false)
  }

  return { results, isLoading, error, query, mediaType, setQuery, setMediaType, reset }
}
