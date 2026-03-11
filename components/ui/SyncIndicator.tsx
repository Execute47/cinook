import { View, Text } from 'react-native'
import { useUIStore } from '@/stores/uiStore'

export function SyncIndicator() {
  const syncPending = useUIStore((s) => s.syncPending)

  if (!syncPending) return null

  return (
    <View className="bg-[#1C1717] border-b border-[#3A2E2E] px-4 py-1 items-center">
      <Text className="text-[#6B5E5E] text-xs">Synchronisation en attente…</Text>
    </View>
  )
}
