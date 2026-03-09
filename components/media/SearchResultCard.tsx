import { View, Text, Image, TouchableOpacity } from 'react-native'
import type { MediaResult } from '@/types/api'

interface Props {
  item: MediaResult
  onPress: (item: MediaResult) => void
}

const TYPE_LABEL: Record<string, string> = {
  film: 'Film',
  serie: 'Série',
  livre: 'Livre',
}

export default function SearchResultCard({ item, onPress }: Props) {
  return (
    <TouchableOpacity
      onPress={() => onPress(item)}
      className="flex-row items-center bg-[#1C1717] border border-[#3D3535] rounded-lg px-3 py-3 mb-2"
    >
      {item.poster ? (
        <Image
          source={{ uri: item.poster }}
          className="w-10 h-14 rounded mr-3"
          resizeMode="cover"
        />
      ) : (
        <View className="w-10 h-14 rounded mr-3 bg-[#3D3535] items-center justify-center">
          <Text className="text-[#6B5E5E] text-xs">?</Text>
        </View>
      )}
      <View className="flex-1">
        <Text className="text-white font-medium" numberOfLines={2}>{item.title}</Text>
        <View className="flex-row items-center gap-2 mt-1">
          {item.year && (
            <Text className="text-[#6B5E5E] text-sm">{item.year}</Text>
          )}
          <View className="bg-[#3D3535] px-2 py-0.5 rounded">
            <Text className="text-amber-400 text-xs">{TYPE_LABEL[item.type] ?? item.type}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  )
}
