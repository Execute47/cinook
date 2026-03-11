import { useState, useEffect } from 'react'
import { onSnapshot, doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuthStore } from '@/stores/authStore'

export interface Member {
  uid: string
  displayName: string | null
  email: string
}

export function useCircle() {
  const circleId = useAuthStore((s) => s.activeCircleId)
  const uid = useAuthStore((s) => s.uid)
  const [members, setMembers] = useState<Member[]>([])
  const [adminId, setAdminId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const isAdmin = adminId === uid

  useEffect(() => {
    if (!circleId) {
      setLoading(false)
      return
    }

    setLoading(true)
    const unsub = onSnapshot(
      doc(db, 'circles', circleId),
      async (snap) => {
        if (!snap.exists()) {
          setError('Cercle introuvable')
          setLoading(false)
          return
        }
        const data = snap.data()
        setAdminId(data.adminId)
        try {
          const memberProfiles = await Promise.all(
            (data.members as string[]).map(async (memberId: string) => {
              const userSnap = await getDoc(doc(db, 'users', memberId))
              const userData = userSnap.data()
              return {
                uid: memberId,
                displayName: userData?.displayName ?? null,
                email: userData?.email ?? '',
              } as Member
            })
          )
          setMembers(memberProfiles)
        } catch {
          setError('Impossible de charger les membres')
        }
        setLoading(false)
      },
      (err) => {
        setError(err.message)
        setLoading(false)
      }
    )

    return unsub
  }, [circleId, uid])

  return { members, isAdmin, adminId, loading, error }
}
