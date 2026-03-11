import { useState, useEffect } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import type { Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuthStore } from '@/stores/authStore'
import type { MediaType } from '@/types/media'

export interface Recommendation {
  id: string
  fromUserId: string
  fromUserName: string
  toUserIds: string[]
  itemId: string
  itemTitle: string
  itemPoster?: string | null
  itemType?: MediaType
  synopsis?: string | null
  year?: number | null
  director?: string | null
  author?: string | null
  tmdbId?: string | null
  googleBooksId?: string | null
  isbn?: string | null
  createdAt: Timestamp
}

export function useRecommendations() {
  const uid = useAuthStore((s) => s.uid)
  const circleId = useAuthStore((s) => s.activeCircleId)
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!uid || !circleId) {
      setRecommendations([])
      setLoading(false)
      return
    }

    const unsub = onSnapshot(
      collection(db, 'circles', circleId, 'recommendations'),
      (snap) => {
        const all = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Recommendation))
        setRecommendations(all.filter((r) => r.toUserIds.includes(uid)))
        setLoading(false)
      },
      (err) => {
        setError(err.message)
        setLoading(false)
      }
    )

    return unsub
  }, [uid, circleId])

  return { recommendations, loading, error }
}
