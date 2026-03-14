import { View, Text, TouchableOpacity } from 'react-native'
import type { ItemStatus, MediaType } from '@/types/media'
import { getStatusLabel } from '@/constants/statuses'

export const STATUS_OPTIONS: { value: ItemStatus; label: string; color: string }[] = [
  { value: 'owned', label: 'Possédé', color: '#60A5FA' },
  { value: 'watched', label: 'Vu', color: '#34D399' },
  { value: 'loaned', label: 'Prêté', color: '#FBBF24' },
  { value: 'borrowed', label: 'Emprunté', color: '#22D3EE' },
  { value: 'wishlist', label: 'À voir', color: '#A78BFA' },
  { value: 'favorite', label: 'Favori', color: '#F87171' },
  { value: 'wanted', label: 'Souhaité', color: '#FB923C' },
]

interface Props {
  current: ItemStatus[]
  onSelect: (status: ItemStatus) => void
  mediaType?: MediaType
}

export default function StatusPicker({ current, onSelect, mediaType = 'film' }: Props) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {STATUS_OPTIONS.map((s) => {
        const isActive = current.includes(s.value)
        return (
          <TouchableOpacity
            key={s.value}
            onPress={() => onSelect(s.value)}
            className={`px-4 py-2 rounded-full border ${
              isActive ? 'border-transparent' : 'border-[#3D3535] bg-[#1C1717]'
            }`}
            style={isActive ? { backgroundColor: s.color } : undefined}
          >
            <Text
              className="text-sm font-medium"
              style={{ color: isActive ? '#0E0B0B' : s.color }}
            >
              {getStatusLabel(s.value, mediaType)}
            </Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}
