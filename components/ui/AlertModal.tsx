import { Modal, View, Text, TouchableOpacity } from 'react-native'
import { useUIStore } from '@/stores/uiStore'

export function AlertModal() {
  const { alert, dismissAlert } = useUIStore()

  if (!alert) return null

  const handlePress = (onPress?: () => void) => {
    dismissAlert()
    onPress?.()
  }

  return (
    <Modal visible transparent animationType="fade">
      <View
        className="flex-1 justify-center items-center px-6"
        style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
      >
        <View className="bg-[#1C1717] border border-[#3D3535] rounded-xl p-6 w-full">
          <Text className="text-white text-lg font-bold mb-2">{alert.title}</Text>
          {alert.message ? (
            <Text className="text-[#6B5E5E] text-sm mb-6">{alert.message}</Text>
          ) : null}

          <View className="flex-row gap-3 justify-end">
            {alert.buttons.map((btn, i) => {
              const isDestructive = btn.style === 'destructive'
              const isCancel = btn.style === 'cancel'
              return (
                <TouchableOpacity
                  key={i}
                  onPress={() => handlePress(btn.onPress)}
                  className={
                    isDestructive
                      ? 'px-6 py-2 rounded-lg border border-red-500'
                      : isCancel
                        ? 'px-4 py-2'
                        : 'px-6 py-2 rounded-lg bg-amber-500'
                  }
                >
                  <Text
                    className={
                      isDestructive
                        ? 'text-red-400 font-semibold'
                        : isCancel
                          ? 'text-[#6B5E5E]'
                          : 'text-black font-semibold'
                    }
                  >
                    {btn.label}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>
      </View>
    </Modal>
  )
}
