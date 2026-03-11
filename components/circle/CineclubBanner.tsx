import { View, Text, Image, TouchableOpacity } from 'react-native'
import type { Timestamp } from 'firebase/firestore'
import type { Cineclub } from '@/hooks/useCineclub'

interface Props {
  cineclub: Cineclub
  onAddToWishlist: () => void
  onRemove: () => void
  onPress?: () => void
}

const formatDate = (ts: Timestamp | null): string => {
  if (!ts) return ''
  return ts.toDate().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

const getLabel = (cineclub: Cineclub): string =>
  cineclub.itemType === 'livre' ? 'Coin lecture' : 'Cinéclub'

export default function CineclubBanner({ cineclub, onAddToWishlist, onRemove, onPress }: Props) {
  const label = getLabel(cineclub)

  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.8 : 1}
      onPress={onPress}
      disabled={!onPress}
      className="bg-[#1C1717] border border-amber-500 rounded-xl p-4 mb-6"
    >
      <Text className="text-amber-400 font-bold text-xs uppercase tracking-widest mb-3">
        ⭐ {label}
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
          <View className="flex-row items-center gap-3 mt-3">
            <TouchableOpacity
              onPress={onAddToWishlist}
              className="bg-amber-500/20 border border-amber-500 rounded px-3 py-1.5"
            >
              <Text className="text-amber-400 text-xs font-semibold">+ À voir</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onRemove}>
              <Text className="text-[#6B5E5E] text-xs">Retirer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  )
}

