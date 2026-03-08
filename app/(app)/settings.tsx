import { View, Text, TouchableOpacity } from 'react-native'
import { router } from 'expo-router'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'

export default function SettingsScreen() {
  const handleSignOut = async () => {
    try {
      await signOut(auth)
      useAuthStore.getState().reset()
      router.replace('/(auth)/login')
    } catch (e) {
      console.error('Sign out error:', e)
      useUIStore.getState().addToast('Erreur lors de la déconnexion', 'error')
    }
  }

  return (
    <View className="flex-1 bg-[#0E0B0B] px-6 pt-16">
      <Text className="text-amber-400 text-2xl font-bold mb-8">Paramètres</Text>

      <TouchableOpacity
        onPress={handleSignOut}
        className="bg-[#1C1717] border border-[#3D3535] rounded-lg px-4 py-4"
      >
        <Text className="text-red-400 font-semibold text-center">Se déconnecter</Text>
      </TouchableOpacity>
    </View>
  )
}
