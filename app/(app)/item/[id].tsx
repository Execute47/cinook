import { View, Text } from 'react-native'
import { useLocalSearchParams } from 'expo-router'

// Stub — implémenté en Story 2.5, 3.x

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()

  return (
    <View className="flex-1 bg-[#0E0B0B] items-center justify-center">
      <Text className="text-white text-xl">Fiche item</Text>
      <Text className="text-gray-400">{id}</Text>
    </View>
  )
}
