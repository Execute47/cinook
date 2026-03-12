import { useState, useEffect } from 'react'
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuthStore } from '@/stores/authStore'
import type { Playlist } from '@/types/playlist'

export function usePlaylists() {
  const uid = useAuthStore((s) => s.uid)
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!uid) { setPlaylists([]); setLoading(false); return }
    const q = query(collection(db, 'users', uid, 'playlists'), orderBy('createdAt', 'desc'))
    return onSnapshot(
      q,
      (snap) => { setPlaylists(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Playlist))); setLoading(false) },
      (err) => { setError(err.message); setLoading(false) }
    )
  }, [uid])

  return { playlists, loading, error }
}
