import { useState, useEffect } from 'react'
import { onSnapshot, doc } from 'firebase/firestore'
import type { Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuthStore } from '@/stores/authStore'
import type { MediaType } from '@/types/media'

export interface Cineclub {
  itemId: string
  itemTitle: string
  itemPoster: string | null
  itemType: MediaType
  postedBy: string
  postedAt: Timestamp | null
}

export function useCineclub() {
  const circleId = useAuthStore((s) => s.circleId)
  const [cineclub, setCineclub] = useState<Cineclub | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!circleId) {
      setCineclub(null)
      setLoading(false)
      return
    }

    const unsub = onSnapshot(doc(db, 'circles', circleId, 'cineclub', 'current'), (snap) => {
      if (snap.exists()) {
        const d = snap.data()
        setCineclub({
          itemId: d.itemId,
          itemTitle: d.itemTitle,
          itemPoster: d.itemPoster ?? null,
          itemType: d.itemType ?? 'film',
          postedBy: d.postedBy,
          postedAt: d.postedAt ?? null,
        })
      } else {
        setCineclub(null)
      }
      setLoading(false)
    })

    return unsub
  }, [circleId])

  return { cineclub, loading }
}
