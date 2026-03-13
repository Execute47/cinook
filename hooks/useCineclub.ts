import { useState, useEffect } from 'react'
import { onSnapshot, collection } from 'firebase/firestore'
import type { Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuthStore } from '@/stores/authStore'
import type { MediaType } from '@/types/media'

export interface Cineclub {
  itemId: string
  itemTitle: string
  itemPoster: string | null
  itemType: MediaType
  synopsis?: string | null
  year?: number | null
  director?: string | null
  author?: string | null
  tmdbId?: string | null
  googleBooksId?: string | null
  isbn?: string | null
  postedBy: string
  postedAt: Timestamp | null
}

export const CINECLUB_MAX = 5

export function useCineclub() {
  const circleId = useAuthStore((s) => s.activeCircleId)
  const [cineclubs, setCineclubs] = useState<Cineclub[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!circleId) {
      setCineclubs([])
      setLoading(false)
      return
    }

    const unsub = onSnapshot(collection(db, 'circles', circleId, 'cineclub'), (snap) => {
      const items: Cineclub[] = snap.docs
        .filter((doc) => doc.data().itemId && doc.id !== 'current')
        .map((doc) => {
          const d = doc.data()
          return {
            itemId: d.itemId,
            itemTitle: d.itemTitle,
            itemPoster: d.itemPoster ?? null,
            itemType: d.itemType ?? 'film',
            synopsis: d.synopsis ?? null,
            year: d.year ?? null,
            director: d.director ?? null,
            author: d.author ?? null,
            tmdbId: d.tmdbId ?? null,
            googleBooksId: d.googleBooksId ?? null,
            isbn: d.isbn ?? null,
            postedBy: d.postedBy,
            postedAt: d.postedAt ?? null,
          }
        })
        .sort((a, b) => {
          if (!a.postedAt) return -1
          if (!b.postedAt) return 1
          return a.postedAt.seconds - b.postedAt.seconds
        })
      setCineclubs(items)
      setLoading(false)
    })

    return unsub
  }, [circleId])

  return { cineclubs, loading }
}
