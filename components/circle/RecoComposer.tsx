import { useState } from 'react'
import { View, Text, TouchableOpacity, Modal, FlatList, ActivityIndicator } from 'react-native'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuthStore } from '@/stores/authStore'
import { useCircle } from '@/hooks/useCircle'
import type { MediaItem } from '@/types/media'

interface Props {
  item: MediaItem
  visible: boolean
  onClose: () => void
}

export default function RecoComposer({ item, visible, onClose }: Props) {
  const uid = useAuthStore((s) => s.uid)
  const displayName = useAuthStore((s) => s.displayName)
  const circleId = useAuthStore((s) => s.circleId)
  const { members } = useCircle()

  const [selected, setSelected] = useState<string[]>([])
  const [sending, setSending] = useState(false)

  const otherMembers = members.filter((m) => m.uid !== uid)

  const toggle = (memberId: string) => {
    setSelected((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]
    )
  }

  const handleSend = async () => {
    if (!uid || !circleId || selected.length === 0) return
    setSending(true)
    try {
      await addDoc(collection(db, 'circles', circleId, 'recommendations'), {
        fromUserId: uid,
        fromUserName: displayName ?? 'Anonyme',
        toUserIds: selected,
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
        createdAt: serverTimestamp(),
      })
      setSelected([])
      onClose()
    } finally {
      setSending(false)
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/60">
        <View className="bg-[#1C1717] rounded-t-2xl px-6 pt-6 pb-10">
          <Text className="text-white text-lg font-bold mb-1">Recommander</Text>
          <Text className="text-[#6B5E5E] text-sm mb-4" numberOfLines={1}>{item.title}</Text>

          {otherMembers.length === 0 ? (
            <Text className="text-[#6B5E5E] text-center py-6">
              Aucun autre membre dans le cercle
            </Text>
          ) : (
            <FlatList
              data={otherMembers}
              keyExtractor={(m) => m.uid}
              scrollEnabled={false}
              renderItem={({ item: member }) => {
                const isSelected = selected.includes(member.uid)
                return (
                  <TouchableOpacity
                    onPress={() => toggle(member.uid)}
                    className={`flex-row items-center py-3 px-4 rounded-lg mb-2 border ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-500'
                        : 'bg-[#0E0B0B] border-[#3D3535]'
                    }`}
                  >
                    <View
                      className={`w-5 h-5 rounded border mr-3 items-center justify-center ${
                        isSelected ? 'bg-amber-500 border-amber-500' : 'border-[#6B5E5E]'
                      }`}
                    >
                      {isSelected && <Text className="text-black text-xs font-bold">✓</Text>}
                    </View>
                    <Text className="text-white flex-1">
                      {member.displayName ?? member.email}
                    </Text>
                  </TouchableOpacity>
                )
              }}
            />
          )}

          <TouchableOpacity
            onPress={handleSend}
            disabled={selected.length === 0 || sending}
            className={`rounded-lg py-3 items-center mt-4 ${
              selected.length === 0 || sending ? 'bg-[#3D3535]' : 'bg-amber-500'
            }`}
          >
            {sending ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text
                className={`font-semibold ${
                  selected.length === 0 ? 'text-[#6B5E5E]' : 'text-black'
                }`}
              >
                {selected.length > 0
                  ? `Envoyer à ${selected.length} membre${selected.length > 1 ? 's' : ''}`
                  : 'Sélectionner des membres'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose} className="mt-3 items-center">
            <Text className="text-[#6B5E5E]">Annuler</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}
