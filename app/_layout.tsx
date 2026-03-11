import '../global.css'
import { useEffect, useState } from 'react'
import { View, ActivityIndicator } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { Stack, useRouter, useSegments } from 'expo-router'
import { ToastContainer } from '@/components/ui/Toast'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { useAuthStore } from '@/stores/authStore'

type AuthState = 'loading' | 'authenticated' | 'unauthenticated'

export default function RootLayout() {
  const [authState, setAuthState] = useState<AuthState>('loading')
  const segments = useSegments()
  const router = useRouter()

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        useAuthStore.getState().reset()
        setAuthState('unauthenticated')
      } else {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid))
          const data = userDoc.data()
          useAuthStore.getState().setUser(user.uid, user.email ?? '', data?.displayName ?? null)
          const circleIds: string[] = data?.circleIds ?? (data?.circleId ? [data.circleId] : [])
          if (circleIds.length > 0) {
            useAuthStore.getState().setCircleIds(circleIds)
            useAuthStore.getState().setActiveCircle(circleIds[0])
          }
        } catch (e) {
          console.error('Failed to load user profile:', e)
          useAuthStore.getState().setUser(user.uid, user.email ?? '', null)
        }
        setAuthState('authenticated')
      }
    })
    return unsub
  }, [])

  useEffect(() => {
    if (authState === 'loading') return

    const inAuthGroup = segments[0] === '(auth)'
    const inInviteRoute = segments[0] === 'invite'

    if (authState === 'unauthenticated' && !inAuthGroup && !inInviteRoute) {
      router.replace('/(auth)/login')
    } else if (authState === 'authenticated' && inAuthGroup) {
      router.replace('/(app)/')
    }
  }, [authState, segments])

  if (authState === 'loading') {
    return (
      <SafeAreaProvider>
        <View className="flex-1 bg-[#0E0B0B] items-center justify-center">
          <ActivityIndicator color="#FBBF24" size="large" />
        </View>
      </SafeAreaProvider>
    )
  }

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }} />
      <ToastContainer />
    </SafeAreaProvider>
  )
}
