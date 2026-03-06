import { View, Text } from 'react-native'
import { useLocalSearchParams } from 'expo-router'

// Stub — implémenté en Story 4.1

export default function InviteScreen() {
  const { token } = useLocalSearchParams<{ token: string }>()

  return (
    <View className="flex-1 bg-[#0E0B0B] items-center justify-center">
      <Text className="text-white text-xl">Invitation</Text>
      <Text className="text-gray-400">{token}</Text>
    </View>
  )
}
