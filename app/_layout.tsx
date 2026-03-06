import '../global.css'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { Stack } from 'expo-router'

// Root layout — auth guard sera implémenté en Story 1.3
// La navigation vers (auth) ou (app) selon l'état Firebase Auth

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </SafeAreaProvider>
  )
}
