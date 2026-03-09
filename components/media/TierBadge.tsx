import { View, Text } from 'react-native'
import { TIER_LEVELS } from '@/components/media/TierPicker'
import type { TierLevel } from '@/types/media'

interface Props {
  tier: TierLevel
}

export default function TierBadge({ tier }: Props) {
  const t = TIER_LEVELS.find((l) => l.value === tier)
  if (!t || tier === 'none') return null

  return (
    <View className="flex-row items-center gap-1 px-2 py-0.5 rounded" style={{ backgroundColor: t.color + '22' }}>
      <Text className="text-xs">{t.emoji}</Text>
      <Text className="text-xs font-medium" style={{ color: t.color }}>{t.label}</Text>
    </View>
  )
}
