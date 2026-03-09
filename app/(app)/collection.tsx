import { View, Text, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { useCollection } from '@/hooks/useCollection'
import ItemCard from '@/components/media/ItemCard'

export default function CollectionScreen() {
  const router = useRouter()
  const { items, loading } = useCollection()

  return (
    <View className="flex-1 bg-[#0E0B0B]">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pt-12 pb-4">
        <Text className="text-white text-2xl font-bold">Ma Collection</Text>
        <View className="flex-row gap-2">
          <TouchableOpacity
            onPress={() => router.push('/item/search')}
            className="bg-amber-500 px-3 py-2 rounded-lg"
          >
            <Text className="text-black font-semibold text-sm">🔍</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/scan')}
            className="bg-[#1C1717] border border-[#3D3535] px-3 py-2 rounded-lg"
          >
            <Text className="text-white text-sm">📷</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/item/new')}
            className="bg-[#1C1717] border border-[#3D3535] px-3 py-2 rounded-lg"
          >
            <Text className="text-white text-sm">✏️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Contenu */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#f59e0b" />
        </View>
      ) : items.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-white text-lg text-center mb-2">Collection vide</Text>
          <Text className="text-[#6B5E5E] text-sm text-center mb-6">
            Ajoute ton premier item via la recherche, le scan ou la saisie manuelle.
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/item/search')}
            className="bg-amber-500 px-6 py-3 rounded-xl"
          >
            <Text className="text-black font-semibold">Commencer</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ItemCard item={item} onPress={(id) => router.push(`/(app)/item/${id}`)} />
          )}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  )
}
