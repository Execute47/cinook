import { View, Text, TouchableOpacity } from 'react-native'
import type { TierLevel } from '@/types/media'

export const TIER_LEVELS: { value: TierLevel; label: string; color: string; emoji: string }[] = [
  { value: 'none', label: 'Non noté', color: '#6B7280', emoji: '—' },
  { value: 'disliked', label: "J'ai pas aimé", color: '#EF4444', emoji: '👎' },
  { value: 'seen', label: 'Vu aussi', color: '#9CA3AF', emoji: '👀' },
  { value: 'bronze', label: 'Bronze', color: '#CD7F32', emoji: '🥉' },
  { value: 'silver', label: 'Argent', color: '#C0C0C0', emoji: '🥈' },
  { value: 'gold', label: 'Or', color: '#FFD700', emoji: '🥇' },
  { value: 'diamond', label: 'Diamant', color: '#B9F2FF', emoji: '💎' },
]

interface Props {
  current: TierLevel
  onSelect: (tier: TierLevel) => void
}

export default function TierPicker({ current, onSelect }: Props) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {TIER_LEVELS.filter((t) => t.value !== 'none').map((t) => (
        <TouchableOpacity
          key={t.value}
          onPress={() => onSelect(current === t.value ? 'none' : t.value)}
          className={`px-3 py-2 rounded-lg border flex-row items-center gap-1 ${
            current === t.value ? 'border-transparent' : 'border-[#3D3535] bg-[#1C1717]'
          }`}
          style={current === t.value ? { backgroundColor: t.color + '33', borderColor: t.color } : undefined}
        >
          <Text className="text-sm">{t.emoji}</Text>
          <Text className="text-sm font-medium" style={{ color: current === t.value ? t.color : '#9CA3AF' }}>
            {t.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  )
}
