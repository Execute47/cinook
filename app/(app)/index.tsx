import { View, Text, ScrollView, ActivityIndicator } from 'react-native'
import { useAuthStore } from '@/stores/authStore'
import { useRecommendations } from '@/hooks/useRecommendations'
import { addItem } from '@/lib/firestore'
import RecoCard from '@/components/circle/RecoCard'

export default function HomeScreen() {
  const uid = useAuthStore((s) => s.uid)
  const { recommendations, loading } = useRecommendations()

  const handleAddToWishlist = async (reco: ReturnType<typeof useRecommendations>['recommendations'][number]) => {
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

  return (
    <ScrollView className="flex-1 bg-[#0E0B0B]" contentContainerStyle={{ padding: 16, paddingTop: 48 }}>
      <Text className="text-amber-400 text-2xl font-bold mb-6">Cinook</Text>

      <Text className="text-white font-semibold mb-3">Recommandations reçues</Text>

      {loading ? (
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
            onAddToWishlist={() => handleAddToWishlist(reco)}
          />
        ))
      )}
    </ScrollView>
  )
}
