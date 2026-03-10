import { View, Text, Image, TouchableOpacity } from 'react-native'
import type { Timestamp } from 'firebase/firestore'
import type { Cineclub } from '@/hooks/useCineclub'

interface Props {
  cineclub: Cineclub
  onAddToWishlist: () => void
}

const formatDate = (ts: Timestamp | null): string => {
  if (!ts) return ''
  return ts.toDate().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

export default function CineclubBanner({ cineclub, onAddToWishlist }: Props) {
  return (
    <View className="bg-[#1C1717] border border-amber-500 rounded-xl p-4 mb-6">
      <Text className="text-amber-400 font-bold text-xs uppercase tracking-widest mb-3">
        ⭐ Cinéclub
      </Text>
      <View className="flex-row">
        {cineclub.itemPoster ? (
          <Image
            source={{ uri: cineclub.itemPoster }}
            className="w-16 h-24 rounded-lg mr-4"
            resizeMode="cover"
          />
        ) : (
          <View className="w-16 h-24 rounded-lg mr-4 bg-[#0E0B0B] items-center justify-center">
            <Text className="text-[#6B5E5E] text-xs">?</Text>
          </View>
        )}
        <View className="flex-1 justify-between">
          <View>
            <Text className="text-white font-bold text-base mb-1" numberOfLines={2}>
              {cineclub.itemTitle}
            </Text>
            <Text className="text-[#6B5E5E] text-xs">
              Mis en avant par {cineclub.postedBy}
              {cineclub.postedAt ? ` · ${formatDate(cineclub.postedAt)}` : ''}
            </Text>
          </View>
          <TouchableOpacity
            onPress={onAddToWishlist}
            className="bg-amber-500/20 border border-amber-500 rounded px-3 py-1.5 self-start mt-3"
          >
            <Text className="text-amber-400 text-xs font-semibold">+ À voir</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}
