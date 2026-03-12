import { useEffect, useRef } from 'react'
import { View, Text, Image, TouchableOpacity, Animated } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import type { MediaItem } from '@/types/media'
import { STATUS_OPTIONS } from '@/components/media/StatusPicker'
import { getStatusLabel } from '@/constants/statuses'

interface Props {
  item: MediaItem
  onPress: (id: string) => void
  animationIndex?: number
}

const TYPE_LABEL: Record<string, string> = { film: 'Film', serie: 'Série', livre: 'Livre' }
const STATUS_MAP = Object.fromEntries(STATUS_OPTIONS.map((s) => [s.value, s]))

const MAX_ANIMATED = 6

export default function ItemCard({ item, onPress, animationIndex }: Props) {
  const shouldAnimate = animationIndex !== undefined && animationIndex < MAX_ANIMATED
  const fadeAnim = useRef(new Animated.Value(shouldAnimate ? 0 : 1)).current
  const slideAnim = useRef(new Animated.Value(shouldAnimate ? 12 : 0)).current

  useEffect(() => {
    if (!shouldAnimate) return
    const delay = (animationIndex ?? 0) * 40
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, delay, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 200, delay, useNativeDriver: true }),
    ]).start()
  }, [])

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
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
          {item.type === 'film' && item.director && (
            <Text className="text-[#6B5E5E] text-xs mt-0.5" numberOfLines={1}>{item.director}</Text>
          )}
          <View className="flex-row items-center gap-2 mt-1 flex-wrap">
            {item.year && <Text className="text-[#6B5E5E] text-sm">{item.year}</Text>}
            <View className="bg-[#3D3535] px-2 py-0.5 rounded">
              <Text className="text-amber-400 text-xs">{TYPE_LABEL[item.type] ?? item.type}</Text>
            </View>
            <View className="px-2 py-0.5 rounded" style={{ backgroundColor: '#2A2222' }}>
              <Text className="text-xs" style={{ color: STATUS_MAP[item.status]?.color ?? '#9CA3AF' }}>
                {getStatusLabel(item.status, item.type)}
              </Text>
            </View>
          </View>
          {item.status === 'loaned' && item.loanTo && (
            <View className="flex-row items-center gap-1 mt-1">
              <Ionicons name="arrow-forward" size={12} color="#FBBF24" />
              <Text className="text-amber-400 text-xs">{item.loanTo}</Text>
            </View>
          )}
          {item.status === 'watched' && item.endedAt && (
            <Text className="text-[#6B5E5E] text-xs mt-1">
              {item.type === 'livre' ? 'Lu le' : 'Vu le'} {item.endedAt.toDate().toLocaleDateString('fr-FR')}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  )
}
