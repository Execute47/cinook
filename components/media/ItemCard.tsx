import { View, Text, Image, TouchableOpacity } from 'react-native'
import type { MediaItem } from '@/types/media'

interface Props {
  item: MediaItem
  onPress: (id: string) => void
}

const TYPE_LABEL: Record<string, string> = { film: 'Film', serie: 'Série', livre: 'Livre' }
const STATUS_LABEL: Record<string, string> = {
  owned: 'Possédé',
  watched: 'Vu',
  loaned: 'Prêté',
  wishlist: 'Souhaité',
  favorite: 'Favori',
}

export default function ItemCard({ item, onPress }: Props) {
  return (
    <TouchableOpacity
      onPress={() => onPress(item.id)}
      className="flex-row items-center bg-[#1C1717] border border-[#3D3535] rounded-lg px-3 py-3 mb-2"
    >
      {item.poster ? (
        <Image
          source={{ uri: item.poster }}
          className="w-12 h-16 rounded mr-3"
          resizeMode="cover"
        />
      ) : (
        <View className="w-12 h-16 rounded mr-3 bg-[#3D3535] items-center justify-center">
          <Text className="text-[#6B5E5E] text-xs">?</Text>
        </View>
      )}
      <View className="flex-1">
        <Text className="text-white font-semibold" numberOfLines={2}>{item.title}</Text>
        <View className="flex-row items-center gap-2 mt-1 flex-wrap">
          {item.year && <Text className="text-[#6B5E5E] text-sm">{item.year}</Text>}
          <View className="bg-[#3D3535] px-2 py-0.5 rounded">
            <Text className="text-amber-400 text-xs">{TYPE_LABEL[item.type] ?? item.type}</Text>
          </View>
          <View className="bg-[#2A2222] px-2 py-0.5 rounded">
            <Text className="text-gray-300 text-xs">{STATUS_LABEL[item.status] ?? item.status}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  )
}
