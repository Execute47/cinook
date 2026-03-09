import { useMemo } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, ActivityIndicator, ScrollView,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useCollection } from '@/hooks/useCollection'
import { useFiltersStore } from '@/stores/filtersStore'
import ItemCard from '@/components/media/ItemCard'
import EmptyState from '@/components/ui/EmptyState'
import type { MediaType, ItemStatus } from '@/types/media'

const TYPE_OPTIONS: { value: MediaType; label: string }[] = [
  { value: 'film', label: 'Films' },
  { value: 'serie', label: 'Séries' },
  { value: 'livre', label: 'Livres' },
]

const STATUS_OPTIONS: { value: ItemStatus; label: string }[] = [
  { value: 'owned', label: 'Possédé' },
  { value: 'watched', label: 'Vu' },
  { value: 'wishlist', label: 'Souhaité' },
  { value: 'loaned', label: 'Prêté' },
  { value: 'favorite', label: 'Favori' },
]

export default function CollectionScreen() {
  const router = useRouter()
  const { items, loading } = useCollection()
  const { searchQuery, mediaType, status, setSearchQuery, setMediaType, setStatus, clearFilters } =
    useFiltersStore()

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesQuery =
        !searchQuery || item.title.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesType = !mediaType || item.type === mediaType
      const matchesStatus = !status || item.status === status
      return matchesQuery && matchesType && matchesStatus
    })
  }, [items, searchQuery, mediaType, status])

  const hasActiveFilters = !!searchQuery || !!mediaType || !!status

  return (
    <View className="flex-1 bg-[#0E0B0B]">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pt-12 pb-3">
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

      {/* Barre de recherche */}
      <View className="px-4 mb-2">
        <TextInput
          placeholder="Rechercher dans ma collection..."
          placeholderTextColor="#6B5E5E"
          value={searchQuery}
          onChangeText={setSearchQuery}
          className="bg-[#1C1717] text-white border border-[#3D3535] rounded-lg px-4 py-2"
        />
      </View>

      {/* Chips type */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="px-4 mb-2"
        contentContainerStyle={{ gap: 8 }}
      >
        {TYPE_OPTIONS.map((t) => (
          <TouchableOpacity
            key={t.value}
            onPress={() => setMediaType(mediaType === t.value ? null : t.value)}
            className={`px-3 py-1.5 rounded-full border ${
              mediaType === t.value
                ? 'bg-amber-500 border-amber-500'
                : 'bg-[#1C1717] border-[#3D3535]'
            }`}
          >
            <Text className={`text-sm ${mediaType === t.value ? 'text-black font-semibold' : 'text-white'}`}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Chips statut */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="px-4 mb-2"
        contentContainerStyle={{ gap: 8 }}
      >
        {STATUS_OPTIONS.map((s) => (
          <TouchableOpacity
            key={s.value}
            onPress={() => setStatus(status === s.value ? null : s.value)}
            className={`px-3 py-1.5 rounded-full border ${
              status === s.value
                ? 'bg-amber-500 border-amber-500'
                : 'bg-[#1C1717] border-[#3D3535]'
            }`}
          >
            <Text className={`text-sm ${status === s.value ? 'text-black font-semibold' : 'text-white'}`}>
              {s.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Bouton effacer filtres */}
      {hasActiveFilters && (
        <TouchableOpacity onPress={clearFilters} className="mx-4 mb-2">
          <Text className="text-amber-400 text-sm">✕ Effacer les filtres</Text>
        </TouchableOpacity>
      )}

      {/* Liste */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#f59e0b" />
        </View>
      ) : filteredItems.length === 0 ? (
        <EmptyState
          message={
            hasActiveFilters
              ? 'Aucun item ne correspond à ces filtres.'
              : 'Ta collection est vide. Ajoute ton premier item !'
          }
          ctaLabel={hasActiveFilters ? undefined : 'Commencer'}
          onCtaPress={hasActiveFilters ? undefined : () => router.push('/item/search')}
        />
      ) : (
        <FlatList
          data={filteredItems}
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
