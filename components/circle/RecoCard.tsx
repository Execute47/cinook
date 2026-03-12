import { View, Text, Image, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import type { Timestamp } from 'firebase/firestore'
import type { Recommendation } from '@/hooks/useRecommendations'

interface Props {
  reco: Recommendation
  onAddToWishlist: () => void
  onPress?: () => void
  onDismiss?: () => void
}

const formatDate = (ts: Timestamp | null | undefined): string => {
  if (!ts) return ''
  return ts.toDate().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

export default function RecoCard({ reco, onAddToWishlist, onPress, onDismiss }: Props) {
  return (
    <View className="bg-[#1C1717] border border-[#3D3535] rounded-lg p-3 mb-3 flex-row">
      <TouchableOpacity
        activeOpacity={onPress ? 0.7 : 1}
        onPress={onPress}
        disabled={!onPress}
        className="flex-row flex-1"
      >
        {reco.itemPoster ? (
          <Image
            source={{ uri: reco.itemPoster }}
            className="w-12 h-16 rounded mr-3"
            resizeMode="cover"
          />
        ) : (
          <View className="w-12 h-16 rounded mr-3 bg-[#0E0B0B] items-center justify-center">
            <Text className="text-[#6B5E5E] text-xs">?</Text>
          </View>
        )}

        <View className="flex-1">
          <Text className="text-white font-semibold mb-0.5" numberOfLines={2}>
            {reco.itemTitle}
          </Text>
          <Text className="text-[#6B5E5E] text-xs mb-3">
            De {reco.fromUserName} · {formatDate(reco.createdAt)}
          </Text>
        </View>
      </TouchableOpacity>

      <View className="items-end justify-between">
        {onDismiss && (
          <TouchableOpacity onPress={onDismiss} hitSlop={8} testID="dismiss-reco">
            <Ionicons name="close-circle" size={18} color="#6B5E5E" />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={onAddToWishlist}
          className="bg-amber-500/20 border border-amber-500 rounded px-3 py-1 mt-1"
        >
          <Text className="text-amber-400 text-xs font-semibold">+ À voir</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}
