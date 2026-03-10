import { View, Text, ScrollView, ActivityIndicator } from 'react-native'
import { useAuthStore } from '@/stores/authStore'
import { useRecommendations } from '@/hooks/useRecommendations'
import { useCineclub } from '@/hooks/useCineclub'
import { addItem } from '@/lib/firestore'
import RecoCard from '@/components/circle/RecoCard'
import CineclubBanner from '@/components/circle/CineclubBanner'

export default function HomeScreen() {
  const uid = useAuthStore((s) => s.uid)
  const { recommendations, loading: recoLoading } = useRecommendations()
  const { cineclub, loading: cineclubLoading } = useCineclub()

  const handleAddRecoToWishlist = async (reco: ReturnType<typeof useRecommendations>['recommendations'][number]) => {
    if (!uid) return
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

      {/* Cinéclub */}
      {!cineclubLoading && cineclub && (
        <CineclubBanner cineclub={cineclub} onAddToWishlist={handleAddCineclubToWishlist} />
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
