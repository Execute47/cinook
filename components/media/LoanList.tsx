import { View, Text, FlatList, TouchableOpacity } from 'react-native'
import type { MediaItem } from '@/types/media'

interface Props {
  items: MediaItem[]
  onPress: (id: string) => void
}

export default function LoanList({ items, onPress }: Props) {
  if (items.length === 0) {
    return (
      <View className="items-center py-8">
        <Text className="text-[#6B5E5E]">Aucun prêt en cours</Text>
      </View>
    )
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.id}
      scrollEnabled={false}
      renderItem={({ item }) => {
        const date = item.loanDate?.toDate()
        const dateStr = date?.toLocaleDateString('fr-FR') ?? '—'
        return (
          <TouchableOpacity
            onPress={() => onPress(item.id)}
            className="flex-row items-center justify-between bg-[#1C1717] border border-[#3D3535] rounded-lg px-4 py-3 mb-2"
          >
            <View className="flex-1">
              <Text className="text-white font-semibold" numberOfLines={1}>
                {item.title}
              </Text>
              <Text className="text-amber-400 text-sm mt-0.5">→ {item.loanTo}</Text>
            </View>
            <Text className="text-[#6B5E5E] text-sm ml-3">{dateStr}</Text>
          </TouchableOpacity>
        )
      }}
    />
  )
}
