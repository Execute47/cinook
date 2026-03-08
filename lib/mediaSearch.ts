import { searchMovies, searchTv, searchByEan } from './tmdb'
import { searchBooks, searchByIsbn } from './googleBooks'
import type { FunctionResponse, MediaResult, SearchParams } from '@/types/api'

const TIMEOUT_MS = 2500

function isISBN(barcode: string): boolean {
  return barcode.startsWith('978') || barcode.startsWith('979')
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout>
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`Timeout après ${ms}ms`)), ms)
  })
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId!))
}

export async function searchMedia(
  params: SearchParams
): Promise<FunctionResponse<MediaResult[]>> {
  const { query, type } = params

  if (!query || !type) {
    return { success: false, error: 'Paramètres manquants : query et type requis' }
  }

  try {
    let results: MediaResult[]

    if (type === 'film') {
      results = await searchMovies(query)
    } else if (type === 'serie') {
      results = await searchTv(query)
    } else if (type === 'livre') {
      results = await searchBooks(query)
    } else {
      return { success: false, error: `Type inconnu : ${type}` }
    }

    return { success: true, data: results }
  } catch {
    return { success: false, error: 'Service temporairement indisponible' }
  }
}

export async function getMediaByBarcode(
  barcode: string
): Promise<FunctionResponse<MediaResult>> {
  if (!barcode) {
    return { success: false, error: 'Paramètre manquant : barcode requis' }
  }

  try {
    let result: MediaResult | null

    if (isISBN(barcode)) {
      result = await withTimeout(searchByIsbn(barcode), TIMEOUT_MS)
    } else {
      result = await withTimeout(searchByEan(barcode), TIMEOUT_MS)
    }

    if (!result) {
      return { success: false, error: 'Aucun résultat trouvé pour ce code-barres' }
    }

    return { success: true, data: result }
  } catch {
    return { success: false, error: 'Service temporairement indisponible' }
  }
}
