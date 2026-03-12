import { useMemo, useRef } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, ActivityIndicator, ScrollView, Animated,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
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

interface FilterChipProps {
  label: string
  active: boolean
  onPress: () => void
}

function FilterChip({ label, active, onPress }: FilterChipProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true }).start()
  }
  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start()
  }

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        className={`px-3 py-1.5 rounded-full border ${
          active ? 'bg-amber-500 border-amber-500' : 'bg-[#1C1717] border-[#3D3535]'
        }`}
      >
        <Text className={`text-sm ${active ? 'text-black font-semibold' : 'text-white'}`}>
          {label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  )
}

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
            <Ionicons name="search" size={20} color="#000000" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/scan')}
            className="bg-[#1C1717] border border-[#3D3535] px-3 py-2 rounded-lg"
          >
            <Ionicons name="barcode" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/item/new')}
            className="bg-[#1C1717] border border-[#3D3535] px-3 py-2 rounded-lg"
          >
            <Ionicons name="create-outline" size={20} color="#FFFFFF" />
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
          <FilterChip
            key={t.value}
            label={t.label}
            active={mediaType === t.value}
            onPress={() => setMediaType(mediaType === t.value ? null : t.value)}
          />
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
          <FilterChip
            key={s.value}
            label={s.label}
            active={status === s.value}
            onPress={() => setStatus(status === s.value ? null : s.value)}
          />
        ))}
      </ScrollView>

      {/* Bouton effacer filtres */}
      {hasActiveFilters && (
        <TouchableOpacity onPress={clearFilters} className="mx-4 mb-2 flex-row items-center gap-1">
          <Ionicons name="close-circle" size={16} color="#FBBF24" />
          <Text className="text-amber-400 text-sm">Effacer</Text>
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
          renderItem={({ item, index }) => (
            <ItemCard
              item={item}
              onPress={(id) => router.push(`/(app)/item/${id}`)}
              animationIndex={index}
            />
          )}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  )
}
