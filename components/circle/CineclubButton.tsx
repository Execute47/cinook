import { useState } from 'react'
import { TouchableOpacity, Text, View, Modal, ScrollView, ActivityIndicator } from 'react-native'
import { setDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore'
import { Ionicons } from '@expo/vector-icons'
import { db } from '@/lib/firebase'
import { useAuthStore } from '@/stores/authStore'
import { useAlert } from '@/hooks/useAlert'
import { CINECLUB_MAX } from '@/hooks/useCineclub'
import { getCircle } from '@/lib/circle'
import type { MediaItem, MediaType } from '@/types/media'

interface Props {
  item: MediaItem
  cineclubItemIds?: string[]
}

const getLabel = (type: MediaType): string =>
  type === 'livre' ? 'Coin lecture' : 'Cinéclub'

export default function CineclubButton({ item, cineclubItemIds = [] }: Props) {
  const uid = useAuthStore((s) => s.uid)
  const displayName = useAuthStore((s) => s.displayName)
  const circleId = useAuthStore((s) => s.activeCircleId)
  const circleIds = useAuthStore((s) => s.circleIds)
  const { alert } = useAlert()

  const [showPicker, setShowPicker] = useState(false)
  const [circleOptions, setCircleOptions] = useState<{ id: string; name: string }[]>([])
  const [loadingPicker, setLoadingPicker] = useState(false)

  if (!circleId) return null

  const label = getLabel(item.type)
  const isActive = cineclubItemIds.includes(item.id)

  const doPost = async (targetCircleId: string) => {
    if (!uid) return
    await setDoc(doc(db, 'circles', targetCircleId, 'cineclub', item.id), {
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
    alert(label, `\u00AB\u00A0${item.title}\u00A0\u00BB a été mis en avant pour votre cercle.`)
  }

  const handleSet = async () => {
    if (!uid || !circleId) return
    if (cineclubItemIds.length >= CINECLUB_MAX) {
      alert(label, `Vous avez atteint la limite de ${CINECLUB_MAX} œuvres en avant. Retirez-en une pour en ajouter une nouvelle.`)
      return
    }
    if (!circleIds || circleIds.length <= 1) {
      await doPost(circleId)
      return
    }
    // Plusieurs cercles : afficher le sélecteur
    if (circleOptions.length > 0) {
      setShowPicker(true)
      return
    }
    setLoadingPicker(true)
    try {
      const results = await Promise.all(circleIds.map((id) => getCircle(id)))
      const options = results
        .filter((c): c is NonNullable<typeof c> => c !== null)
        .map((c) => ({ id: c.id, name: c.name }))
      setCircleOptions(options)
      setShowPicker(true)
    } catch {
      alert(label, 'Impossible de charger vos cercles.')
    } finally {
      setLoadingPicker(false)
    }
  }

  const handleRemove = async () => {
    if (!circleId) return
    await deleteDoc(doc(db, 'circles', circleId, 'cineclub', item.id))
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
    <>
      <TouchableOpacity
        onPress={handleSet}
        className="bg-[#1C1717] border border-amber-500 rounded-lg px-4 py-2"
      >
        <View className="flex-row items-center gap-1">
          {loadingPicker
            ? <ActivityIndicator size="small" color="#FBBF24" />
            : <Ionicons name="star" size={14} color="#FBBF24" />
          }
          <Text className="text-amber-400 font-semibold text-sm">Mettre en {label}</Text>
        </View>
      </TouchableOpacity>

      <Modal visible={showPicker} transparent animationType="fade">
        <View
          className="flex-1 justify-center items-center px-6"
          style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
        >
          <View className="bg-[#1C1717] border border-[#3D3535] rounded-xl p-6 w-full">
            <Text className="text-white text-lg font-bold mb-2">Choisir un cercle</Text>
            <Text className="text-[#6B5E5E] text-sm mb-4">
              Dans quel cercle souhaitez-vous mettre en avant cette œuvre ?
            </Text>
            <ScrollView style={{ maxHeight: 200 }} className="mb-4">
              {circleOptions.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  onPress={async () => {
                    setShowPicker(false)
                    await doPost(option.id)
                  }}
                  className="flex-row items-center px-3 py-3 rounded-lg mb-1 border border-[#3D3535]"
                >
                  <Text className="text-white text-sm flex-1">{option.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              onPress={() => setShowPicker(false)}
              className="py-2 items-center"
            >
              <Text className="text-[#6B5E5E]">Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  )
}
