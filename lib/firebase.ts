import { Platform } from 'react-native'
import { initializeApp, getApps } from 'firebase/app'
import { initializeFirestore, persistentLocalCache, getFirestore } from 'firebase/firestore'
import {
  initializeAuth,
  getReactNativePersistence,
  browserLocalPersistence,
  getAuth,
} from 'firebase/auth'
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

let _db
try {
  _db = initializeFirestore(app, { localCache: persistentLocalCache() })
} catch {
  _db = getFirestore(app)
}
export const db = _db

// Auth : browser persistence sur web, AsyncStorage sur natif
const isWeb = typeof document !== 'undefined'
let _auth
try {
  _auth = initializeAuth(app, {
    persistence: isWeb
      ? browserLocalPersistence
      : getReactNativePersistence(AsyncStorage),
  })
} catch {
  _auth = getAuth(app)
}
export const auth = _auth

// GoogleSignin uniquement sur natif
// typeof document est plus fiable que Platform.OS avec unstable_conditionNames
if (typeof document === 'undefined') {
  GoogleSignin.configure({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  })
}
