import { View, Text, TouchableOpacity } from 'react-native'

interface Props {
  message: string
  ctaLabel?: string
  onCtaPress?: () => void
}

export default function EmptyState({ message, ctaLabel, onCtaPress }: Props) {
  return (
    <View className="flex-1 items-center justify-center px-8">
      <Text className="text-4xl mb-4">🎬</Text>
      <Text className="text-white text-base text-center mb-2">{message}</Text>
      {ctaLabel && onCtaPress && (
        <TouchableOpacity
          onPress={onCtaPress}
          className="bg-amber-500 px-6 py-3 rounded-xl mt-4"
        >
          <Text className="text-black font-semibold">{ctaLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}
