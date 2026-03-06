import { View, Text } from 'react-native'

// Stub — implémenté en Story 2.2
// IMPORTANT: Nécessite un Development Build (expo-camera ne fonctionne pas sur Expo Go)

export default function ScanScreen() {
  return (
    <View className="flex-1 bg-black items-center justify-center">
      <Text className="text-white text-xl">Scanner</Text>
      <Text className="text-gray-400 text-sm mt-2">Development build requis</Text>
    </View>
  )
}
