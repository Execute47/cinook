import { useEffect } from 'react'
import NetInfo from '@react-native-community/netinfo'
import { onSnapshotsInSync } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useUIStore } from '@/stores/uiStore'

export function useNetworkStatus() {
  useEffect(() => {
    const { setSyncPending } = useUIStore.getState()

    const unsubNetInfo = NetInfo.addEventListener((state) => {
      if (!state.isConnected) setSyncPending(true)
    })

    const unsubSync = onSnapshotsInSync(db, () => {
      setSyncPending(false)
    })

    return () => {
      unsubNetInfo()
      unsubSync()
    }
  }, [])
}
