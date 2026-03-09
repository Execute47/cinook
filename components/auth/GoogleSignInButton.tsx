import { TouchableOpacity, Text, View, ActivityIndicator } from 'react-native'

interface Props {
  onPress: () => void
  isLoading?: boolean
}

export default function GoogleSignInButton({ onPress, isLoading = false }: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isLoading}
      className="bg-[#1C1717] border border-[#3D3535] rounded-lg py-3 flex-row items-center justify-center gap-3"
    >
      {isLoading ? (
        <ActivityIndicator size="small" color="#ffffff" />
      ) : (
        <>
          <View className="w-5 h-5 rounded-full bg-white items-center justify-center">
            <Text className="text-[#1C1717] font-bold text-xs">G</Text>
          </View>
          <Text className="text-white font-medium">Continuer avec Google</Text>
        </>
      )}
    </TouchableOpacity>
  )
}
