import { initializeApp, getApps } from 'firebase/app'
import { initializeFirestore, persistentLocalCache, getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
}

// Prevent re-initialization in hot-reload environments
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]

// Offline persistence via persistentLocalCache (React Native compatible — Firebase SDK v10+)
// Falls back gracefully if persistence is already enabled or unavailable
let db
try {
  db = initializeFirestore(app, {
    localCache: persistentLocalCache(),
  })
} catch {
  // Already initialized (e.g. hot reload) — use existing instance
  db = getFirestore(app)
}

export { db }
export const auth = getAuth(app)
