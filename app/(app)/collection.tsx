import { View, Text, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'

// Stub — implémenté en Stories 2.x et 3.x

export default function CollectionScreen() {
  const router = useRouter()

  return (
    <View className="flex-1 bg-[#0E0B0B] items-center justify-center gap-4">
      <Text className="text-white text-xl">Ma Collection</Text>
      {/* TODO: supprimer ce bouton temporaire après test */}
      <TouchableOpacity
        onPress={() => router.push('/scan')}
        className="bg-amber-500 px-6 py-3 rounded-xl"
      >
        <Text className="text-black font-semibold">📷 Scanner un code-barres</Text>
      </TouchableOpacity>
    </View>
  )
}
