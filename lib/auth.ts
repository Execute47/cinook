import { Platform } from 'react-native'
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin'
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'

export async function signInWithGoogle(): Promise<boolean> {
  try {
    if (Platform.OS === 'android') {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true })
    }

    const { data } = await GoogleSignin.signIn()
    if (!data?.idToken) throw new Error('No idToken returned')

    const credential = GoogleAuthProvider.credential(data.idToken)
    const { user } = await signInWithCredential(auth, credential)

    // Créer le profil Firestore si premier login Google
    const userRef = doc(db, 'users', user.uid)
    const userSnap = await getDoc(userRef)
    if (!userSnap.exists()) {
      await setDoc(userRef, {
        displayName: user.displayName ?? null,
        email: user.email ?? '',
        circleId: null,
        createdAt: serverTimestamp(),
      })
    }

    const data2 = userSnap.exists() ? userSnap.data() : null
    useAuthStore.getState().setUser(user.uid, user.email ?? '', user.displayName ?? null)
    if (data2?.circleId) {
      useAuthStore.getState().setCircle(data2.circleId, false)
    }

    return true
  } catch (error: unknown) {
    const e = error as { code?: string }
    if (e.code === statusCodes.SIGN_IN_CANCELLED || e.code === statusCodes.IN_PROGRESS) {
      return false // Annulation silencieuse
    }
    useUIStore.getState().addToast('Erreur de connexion Google', 'error')
    return false
  }
}
