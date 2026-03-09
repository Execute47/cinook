import { View, Text, TouchableOpacity } from 'react-native'

interface Props {
  value: number | null | undefined
  onRate: (value: number | null) => void
}

export default function RatingWidget({ value, onRate }: Props) {
  return (
    <View>
      <View className="flex-row flex-wrap gap-1">
        {Array.from({ length: 11 }, (_, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => onRate(value === i ? null : i)}
            className={`w-8 h-8 rounded-lg items-center justify-center ${
              value === i ? 'bg-amber-500' : 'bg-[#1C1717] border border-[#3D3535]'
            }`}
          >
            <Text className={`text-sm font-semibold ${value === i ? 'text-black' : 'text-white'}`}>
              {i}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {value != null && (
        <TouchableOpacity onPress={() => onRate(null)} className="mt-2">
          <Text className="text-[#6B5E5E] text-xs">✕ Effacer la note</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}
