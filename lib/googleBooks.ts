import type { MediaResult } from '@/types/api'

const BASE_URL = 'https://www.googleapis.com/books/v1/volumes'

function apiKey(): string {
  return process.env.EXPO_PUBLIC_GOOGLE_BOOKS_API_KEY ?? ''
}

export async function searchBooks(query: string): Promise<MediaResult[]> {
  const url = `${BASE_URL}?q=${encodeURIComponent(query)}&key=${apiKey()}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Google Books search failed: ${res.status}`)
  const json = await res.json()
  return (json.items ?? []).map(mapVolume)
}

export async function searchByIsbn(isbn: string): Promise<MediaResult | null> {
  const url = `${BASE_URL}?q=isbn:${encodeURIComponent(isbn)}&key=${apiKey()}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Google Books ISBN search failed: ${res.status}`)
  const json = await res.json()
  const first = (json.items ?? [])[0]
  return first ? mapVolume(first) : null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapVolume(item: any): MediaResult {
  const info = item.volumeInfo ?? {}
  return {
    title: info.title ?? '',
    type: 'livre',
    poster: info.imageLinks?.thumbnail ?? undefined,
    synopsis: info.description || undefined,
    author: (info.authors ?? []).join(', ') || undefined,
    year: info.publishedDate ? parseInt(info.publishedDate.slice(0, 4), 10) : undefined,
    googleBooksId: item.id,
    isbn: (info.industryIdentifiers ?? []).find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (id: any) => id.type === 'ISBN_13' || id.type === 'ISBN_10'
    )?.identifier,
  }
}
