import type { MediaItem, MediaType } from '@/types/media'

export interface DuplicateCandidate {
  title: string
  type: MediaType
  tmdbId?: string
  googleBooksId?: string
  isbn?: string
}

export function findDuplicate(
  items: MediaItem[],
  candidate: DuplicateCandidate
): MediaItem | undefined {
  // Règle 1 : tmdbId
  if (candidate.tmdbId) {
    const match = items.find(i => i.tmdbId === candidate.tmdbId)
    if (match) return match
  }
  // Règle 2 : googleBooksId
  if (candidate.googleBooksId) {
    const match = items.find(i => i.googleBooksId === candidate.googleBooksId)
    if (match) return match
  }
  // Règle 3 : isbn
  if (candidate.isbn) {
    const match = items.find(i => i.isbn === candidate.isbn)
    if (match) return match
  }
  // Règle 4 : titre + type (fallback)
  const normalizedTitle = candidate.title.trim().toLowerCase()
  return items.find(
    i => i.type === candidate.type && i.title.trim().toLowerCase() === normalizedTitle
  )
}
