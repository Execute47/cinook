import { useEffect } from 'react'
import { View, Text } from 'react-native'
import { useUIStore } from '@/stores/uiStore'

const TYPE_COLORS: Record<string, string> = {
  success: '#22c55e',
  error: '#ef4444',
  info: '#FBBF24',
}

export function ToastContainer() {
  const { toastQueue, removeToast } = useUIStore()

  useEffect(() => {
    if (toastQueue.length === 0) return
    const latest = toastQueue[toastQueue.length - 1]
    const timer = setTimeout(() => removeToast(latest.id), 3000)
    return () => clearTimeout(timer)
  }, [toastQueue])

  if (toastQueue.length === 0) return null

  return (
    <View
      style={{
        position: 'absolute',
        bottom: 90,
        left: 16,
        right: 16,
        zIndex: 9999,
        pointerEvents: 'none',
      }}
    >
      {toastQueue.map((toast) => (
        <View
          key={toast.id}
          style={{
            backgroundColor: '#1C1717',
            borderLeftWidth: 3,
            borderLeftColor: TYPE_COLORS[toast.type] ?? TYPE_COLORS.info,
            borderRadius: 8,
            paddingHorizontal: 14,
            paddingVertical: 10,
            marginTop: 8,
          }}
        >
          <Text style={{ color: '#F5F0F0', fontSize: 14 }}>{toast.message}</Text>
        </View>
      ))}
    </View>
  )
}
