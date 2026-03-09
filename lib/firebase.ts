import { initializeApp, getApps } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { initializeAuth, getReactNativePersistence, getAuth } from 'firebase/auth'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { GoogleSignin } from '@react-native-google-signin/google-signin'

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
}

export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]

// persistentLocalCache() requiert IndexedDB (web uniquement) — on utilise getFirestore() sans cache en React Native
export const db = getFirestore(app)

// getAuth() échoue si initializeAuth n'a pas encore été appelé dans cette session Metro
// On tente getAuth() d'abord (hot-reload), sinon on initialise avec la persistance AsyncStorage
let _auth
try {
  _auth = getAuth(app)
} catch {
  _auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  })
}
export const auth = _auth

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
})
