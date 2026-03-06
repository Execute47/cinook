import { View, Text } from 'react-native'

// Stub — Accueil avec bannière Cinéclub + recommandations reçues
// Implémenté en Story 4.4 et 4.5

export default function HomeScreen() {
  return (
    <View className="flex-1 bg-[#0E0B0B] items-center justify-center">
      <Text className="text-amber-400 text-2xl font-bold">Cinook</Text>
      <Text className="text-gray-400 mt-2">Accueil</Text>
    </View>
  )
}
