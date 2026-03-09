import { useState, useEffect } from 'react'
import { View, Text, ActivityIndicator, TouchableOpacity } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { useAuthStore } from '@/stores/authStore'
import { joinCircle } from '@/lib/circle'

export default function InviteScreen() {
  const { token } = useLocalSearchParams<{ token: string }>()
  const uid = useAuthStore((s) => s.uid)
  const setCircle = useAuthStore((s) => s.setCircle)

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')

  useEffect(() => {
    if (!uid || !token) {
      setStatus('error')
      return
    }

    const join = async () => {
      const circleId = await joinCircle(uid, token)
      if (circleId) {
        setCircle(circleId, false)
        setStatus('success')
        setTimeout(() => router.replace('/(app)/'), 1500)
      } else {
        setStatus('error')
      }
    }

    join()
  }, [uid, token])

  if (status === 'loading') {
    return (
      <View className="flex-1 bg-[#0E0B0B] items-center justify-center">
        <ActivityIndicator size="large" color="#f59e0b" />
        <Text className="text-white mt-4">Validation du lien...</Text>
      </View>
    )
  }

  if (status === 'error') {
    return (
      <View className="flex-1 bg-[#0E0B0B] items-center justify-center px-6">
        <Text className="text-red-400 text-xl font-bold mb-2">Lien invalide ou expiré</Text>
        <Text className="text-[#6B5E5E] text-center mb-6">
          Ce lien d'invitation n'est plus valide.
        </Text>
        <TouchableOpacity
          onPress={() => router.replace('/(app)/')}
          className="bg-amber-500 px-6 py-3 rounded-lg"
        >
          <Text className="text-black font-semibold">Retour à l'accueil</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View className="flex-1 bg-[#0E0B0B] items-center justify-center">
      <Text className="text-green-400 text-xl font-bold mb-2">Bienvenue dans le cercle !</Text>
      <Text className="text-[#6B5E5E]">Redirection en cours...</Text>
    </View>
  )
}
