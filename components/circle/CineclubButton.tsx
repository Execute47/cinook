import { TouchableOpacity, Text } from 'react-native'
import { setDoc, doc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuthStore } from '@/stores/authStore'
import type { MediaItem } from '@/types/media'

interface Props {
  item: MediaItem
}

export default function CineclubButton({ item }: Props) {
  const uid = useAuthStore((s) => s.uid)
  const displayName = useAuthStore((s) => s.displayName)
  const circleId = useAuthStore((s) => s.circleId)

  if (!circleId) return null

  const handlePress = async () => {
    if (!uid || !circleId) return
    await setDoc(doc(db, 'circles', circleId, 'cineclub', 'current'), {
      itemId: item.id,
      itemTitle: item.title,
      itemPoster: item.poster ?? null,
      postedBy: displayName ?? uid,
      postedAt: serverTimestamp(),
    })
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      className="bg-[#1C1717] border border-amber-500 rounded-lg px-4 py-2"
    >
      <Text className="text-amber-400 font-semibold text-sm">⭐ Mettre en Cinéclub</Text>
    </TouchableOpacity>
  )
}
