import { View, Text, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'

// Stub — liste de la collection implémentée en Story 2.5

export default function CollectionScreen() {
  const router = useRouter()

  return (
    <View className="flex-1 bg-[#0E0B0B] items-center justify-center gap-4">
      <Text className="text-white text-xl">Ma Collection</Text>
      <View className="flex-row gap-3">
        <TouchableOpacity
          onPress={() => router.push('/item/search')}
          className="bg-amber-500 px-5 py-3 rounded-xl"
        >
          <Text className="text-black font-semibold">🔍 Rechercher</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push('/scan')}
          className="bg-[#1C1717] border border-[#3D3535] px-5 py-3 rounded-xl"
        >
          <Text className="text-white font-semibold">📷 Scanner</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}
