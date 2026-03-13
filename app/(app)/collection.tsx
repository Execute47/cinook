import { useMemo, useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  ActivityIndicator, Modal, Pressable,
} from 'react-native'
import { FlashList } from '@shopify/flash-list'
import Fuse from 'fuse.js'
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

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`px-4 py-2 rounded-full border mr-2 mb-2 ${
        active ? 'bg-amber-500 border-amber-500' : 'bg-[#1C1717] border-[#3D3535]'
      }`}
    >
      <Text className={`text-sm ${active ? 'text-black font-semibold' : 'text-white'}`}>
        {label}
      </Text>
    </TouchableOpacity>
  )
}

export default function CollectionScreen() {
  const router = useRouter()
  const { items, loading } = useCollection()
  const { searchQuery, mediaType, status, setSearchQuery, setMediaType, setStatus, clearFilters } =
    useFiltersStore()
  const [filterModalVisible, setFilterModalVisible] = useState(false)

  const fuse = useMemo(
    () => new Fuse(items, {
      keys: ['title', 'director', 'author'],
      threshold: 0.35,
      ignoreLocation: true,
      minMatchCharLength: 2,
    }),
    [items]
  )

  const filteredItems = useMemo(() => {
    const searched = searchQuery.length >= 2
      ? fuse.search(searchQuery).map((r) => r.item)
      : items

    return searched.filter((item) => {
      const matchesType = !mediaType || item.type === mediaType
      const matchesStatus = !status || item.statuses.includes(status)
      return matchesType && matchesStatus
    })
  }, [fuse, items, searchQuery, mediaType, status])

  const hasActiveFilters = !!mediaType || !!status

  return (
    <View className="flex-1 bg-[#0E0B0B]">
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 48, paddingBottom: 12 }}>
        <Text className="text-white text-2xl font-bold" style={{ flex: 1, marginRight: 8 }} numberOfLines={1}>Ma Collection</Text>
        <View style={{ flexDirection: 'row', gap: 8, flexShrink: 0 }}>
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
          <TouchableOpacity
            onPress={() => router.push('/(app)/playlists')}
            className="bg-[#1C1717] border border-[#3D3535] px-3 py-2 rounded-lg"
          >
            <Ionicons name="bookmarks" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Barre de recherche + bouton filtre */}
      <View className="px-4 mb-3 flex-row items-center gap-2">
        <TextInput
          placeholder="Rechercher dans ma collection..."
          placeholderTextColor="#6B5E5E"
          value={searchQuery}
          onChangeText={setSearchQuery}
          className="bg-[#1C1717] text-white border border-[#3D3535] rounded-lg px-4 py-2"
          style={{ flex: 1 }}
        />
        <TouchableOpacity
          onPress={() => setFilterModalVisible(true)}
          className={`px-3 rounded-lg border ${
            hasActiveFilters ? 'bg-amber-500 border-amber-500' : 'bg-[#1C1717] border-[#3D3535]'
          }`}
          style={{ alignSelf: 'stretch', justifyContent: 'center' }}
        >
          <Ionicons
            name="options-outline"
            size={20}
            color={hasActiveFilters ? '#000000' : '#FFFFFF'}
          />
        </TouchableOpacity>
      </View>

      {/* Liste */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#f59e0b" />
        </View>
      ) : filteredItems.length === 0 ? (
        <EmptyState
          message={
            hasActiveFilters || searchQuery
              ? 'Aucun item ne correspond à ces filtres.'
              : 'Ta collection est vide. Ajoute ton premier item !'
          }
          ctaLabel={hasActiveFilters || searchQuery ? undefined : 'Commencer'}
          onCtaPress={hasActiveFilters || searchQuery ? undefined : () => router.push('/item/search')}
        />
      ) : (
        <FlashList
          data={filteredItems}
          keyExtractor={(item) => item.id}
          estimatedItemSize={70}
          renderItem={({ item }) => (
            <ItemCard
              item={item}
              onPress={(id) => router.push(`/(app)/item/${id}`)}
            />
          )}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Modale filtres */}
      <Modal
        visible={filterModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}
          onPress={() => setFilterModalVisible(false)}
        />
        <View className="bg-[#0E0B0B] border-t border-[#3D3535] px-6 pt-5 pb-8">
          {/* Titre + fermer */}
          <View className="flex-row items-center justify-between mb-5">
            <Text className="text-white text-lg font-bold">Filtres</Text>
            <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
              <Ionicons name="close" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Type */}
          <Text className="text-[#6B5E5E] text-xs font-semibold uppercase mb-2 tracking-wider">Type</Text>
          <View className="flex-row flex-wrap mb-4">
            {TYPE_OPTIONS.map((t) => (
              <Chip
                key={t.value}
                label={t.label}
                active={mediaType === t.value}
                onPress={() => setMediaType(mediaType === t.value ? null : t.value)}
              />
            ))}
          </View>

          {/* Statut */}
          <Text className="text-[#6B5E5E] text-xs font-semibold uppercase mb-2 tracking-wider">Statut</Text>
          <View className="flex-row flex-wrap mb-5">
            {STATUS_OPTIONS.map((s) => (
              <Chip
                key={s.value}
                label={s.label}
                active={status === s.value}
                onPress={() => setStatus(status === s.value ? null : s.value)}
              />
            ))}
          </View>

          {/* Effacer */}
          {hasActiveFilters && (
            <TouchableOpacity
              onPress={() => { clearFilters(); setFilterModalVisible(false) }}
              className="flex-row items-center justify-center gap-1 py-3"
            >
              <Ionicons name="close-circle" size={16} color="#FBBF24" />
              <Text className="text-amber-400 text-sm">Effacer les filtres</Text>
            </TouchableOpacity>
          )}
        </View>
      </Modal>
    </View>
  )
}
