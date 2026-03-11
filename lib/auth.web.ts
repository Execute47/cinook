import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'

async function hydrateUser(user: { uid: string; email: string | null; displayName: string | null }) {
  const userRef = doc(db, 'users', user.uid)
  const userSnap = await getDoc(userRef)
  if (!userSnap.exists()) {
    await setDoc(userRef, {
      displayName: user.displayName ?? null,
      email: user.email ?? '',
      circleIds: [],
      createdAt: serverTimestamp(),
    })
  }
  const profile = userSnap.exists() ? userSnap.data() : null
  useAuthStore.getState().setUser(user.uid, user.email ?? '', user.displayName ?? null)
  const circleIds: string[] = profile?.circleIds ?? (profile?.circleId ? [profile.circleId] : [])
  if (circleIds.length > 0) {
    useAuthStore.getState().setCircleIds(circleIds)
    useAuthStore.getState().setActiveCircle(circleIds[0])
  }
}

export async function signInWithGoogle(): Promise<boolean> {
  try {
    const provider = new GoogleAuthProvider()
    const { user } = await signInWithPopup(auth, provider)
    await hydrateUser(user)
    return true
  } catch (error: unknown) {
    const e = error as { code?: string }
    if (e.code === 'auth/popup-closed-by-user' || e.code === 'auth/cancelled-popup-request') {
      return false
    }
    useUIStore.getState().addToast('Erreur de connexion Google', 'error')
    return false
  }
}
