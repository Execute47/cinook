import { useState, useEffect } from 'react'
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuthStore } from '@/stores/authStore'
import type { MediaItem } from '@/types/media'

interface UseCollectionReturn {
  items: MediaItem[]
  loading: boolean
  error: string | null
}

export function useCollection(): UseCollectionReturn {
  const uid = useAuthStore((s) => s.uid)
  const [items, setItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!uid) {
      setItems([])
      setLoading(false)
      return
    }

    const q = query(
      collection(db, 'users', uid, 'items'),
      orderBy('addedAt', 'desc')
    )

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setItems(snap.docs.map((d) => {
          const data = d.data()
          return {
            id: d.id,
            ...data,
            statuses: data.statuses || (data.status ? [data.status] : []),
          } as MediaItem
        }))
        setLoading(false)
      },
      (err) => {
        setError(err.message)
        setLoading(false)
        console.error(err)
      }
    )

    return unsubscribe
  }, [uid])

  return { items, loading, error }
}
