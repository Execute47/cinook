import { Alert, Platform, TouchableOpacity, Text } from 'react-native'
import { setDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuthStore } from '@/stores/authStore'
import type { MediaItem, MediaType } from '@/types/media'

interface Props {
  item: MediaItem
  currentCineclubItemId?: string
}

const getLabel = (type: MediaType): string =>
  type === 'livre' ? 'Coin lecture' : 'Cinéclub'

const showAlert = (title: string, message: string) => {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`)
  } else {
    Alert.alert(title, message, [{ text: 'OK' }])
  }
}

export default function CineclubButton({ item, currentCineclubItemId }: Props) {
  const uid = useAuthStore((s) => s.uid)
  const displayName = useAuthStore((s) => s.displayName)
  const circleId = useAuthStore((s) => s.circleId)

  if (!circleId) return null

  const label = getLabel(item.type)
  const isActive = currentCineclubItemId === item.id

  const handleSet = async () => {
    if (!uid || !circleId) return
    await setDoc(doc(db, 'circles', circleId, 'cineclub', 'current'), {
      itemId: item.id,
      itemTitle: item.title,
      itemPoster: item.poster ?? null,
      itemType: item.type,
      synopsis: item.synopsis ?? null,
      year: item.year ?? null,
      director: item.director ?? null,
      author: item.author ?? null,
      tmdbId: item.tmdbId ?? null,
      googleBooksId: item.googleBooksId ?? null,
      isbn: item.isbn ?? null,
      postedBy: displayName ?? uid,
      postedAt: serverTimestamp(),
    })
    showAlert(label, `\u00AB\u00A0${item.title}\u00A0\u00BB a été mis en avant pour votre cercle.`)
  }

  const handleRemove = async () => {
    if (!circleId) return
    await deleteDoc(doc(db, 'circles', circleId, 'cineclub', 'current'))
  }

  if (isActive) {
    return (
      <TouchableOpacity
        onPress={handleRemove}
        className="bg-[#1C1717] border border-[#3D3535] rounded-lg px-4 py-2"
      >
        <Text className="text-[#6B5E5E] font-semibold text-sm">Retirer du {label}</Text>
      </TouchableOpacity>
    )
  }

  return (
    <TouchableOpacity
      onPress={handleSet}
      className="bg-[#1C1717] border border-amber-500 rounded-lg px-4 py-2"
    >
      <Text className="text-amber-400 font-semibold text-sm">⭐ Mettre en {label}</Text>
    </TouchableOpacity>
  )
}
