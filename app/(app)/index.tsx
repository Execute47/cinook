import { useState, useRef } from 'react'
import { View, Text, ScrollView, ActivityIndicator } from 'react-native'
import { useAuthStore } from '@/stores/authStore'
import { useRecommendations } from '@/hooks/useRecommendations'
import { useCineclub } from '@/hooks/useCineclub'
import { useCollection } from '@/hooks/useCollection'
import { findDuplicate } from '@/lib/duplicates'
import { addItem } from '@/lib/firestore'
import { deleteDoc, doc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import RecoCard from '@/components/circle/RecoCard'
import CineclubBanner from '@/components/circle/CineclubBanner'

export default function HomeScreen() {
  const uid = useAuthStore((s) => s.uid)
  const circleId = useAuthStore((s) => s.circleId)
  const { items } = useCollection()
  const { recommendations, loading: recoLoading } = useRecommendations()
  const { cineclub, loading: cineclubLoading } = useCineclub()
  const [duplicateMessage, setDuplicateMessage] = useState<string | null>(null)
  const duplicateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showDuplicateMessage = () => {
    if (duplicateTimerRef.current) clearTimeout(duplicateTimerRef.current)
    setDuplicateMessage('Déjà dans votre collection')
    duplicateTimerRef.current = setTimeout(() => setDuplicateMessage(null), 3000)
  }

  const handleAddRecoToWishlist = async (reco: ReturnType<typeof useRecommendations>['recommendations'][number]) => {
    if (!uid) return
    const duplicate = findDuplicate(items, { title: reco.itemTitle, type: 'film' })
    if (duplicate) {
      showDuplicateMessage()
      return
    }
    await addItem(uid, {
      title: reco.itemTitle,
      type: 'film',
      poster: reco.itemPoster ?? undefined,
      status: 'wishlist',
      tier: 'none',
      addedVia: 'search',
    })
  }

  const handleAddCineclubToWishlist = async () => {
    if (!uid || !cineclub) return
    const duplicate = findDuplicate(items, { title: cineclub.itemTitle, type: 'film' })
    if (duplicate) {
      showDuplicateMessage()
      return
    }
    await addItem(uid, {
      title: cineclub.itemTitle,
      type: 'film',
      poster: cineclub.itemPoster ?? undefined,
      status: 'wishlist',
      tier: 'none',
      addedVia: 'discover',
    })
  }

  return (
    <ScrollView className="flex-1 bg-[#0E0B0B]" contentContainerStyle={{ padding: 16, paddingTop: 48 }}>
      <Text className="text-amber-400 text-2xl font-bold mb-6">Cinook</Text>
      {duplicateMessage && (
        <View className="bg-[#1C1717] border border-[#3D3535] rounded-lg px-4 py-2 mb-3">
          <Text className="text-[#6B5E5E] text-sm text-center">{duplicateMessage}</Text>
        </View>
      )}

      {/* Cinéclub */}
      {!cineclubLoading && cineclub && (
        <CineclubBanner
          cineclub={cineclub}
          onAddToWishlist={handleAddCineclubToWishlist}
          onRemove={async () => {
            if (!circleId) return
            await deleteDoc(doc(db, 'circles', circleId, 'cineclub', 'current'))
          }}
        />
      )}

      {/* Recommandations */}
      <Text className="text-white font-semibold mb-3">Recommandations reçues</Text>

      {recoLoading ? (
        <View className="items-center py-6">
          <ActivityIndicator color="#f59e0b" />
        </View>
      ) : recommendations.length === 0 ? (
        <Text className="text-[#6B5E5E] text-sm text-center py-6">
          Aucune recommandation pour l'instant
        </Text>
      ) : (
        recommendations.map((reco) => (
          <RecoCard
            key={reco.id}
            reco={reco}
            onAddToWishlist={() => handleAddRecoToWishlist(reco)}
          />
        ))
      )}
    </ScrollView>
  )
}
