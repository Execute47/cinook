import { useState, useEffect, useMemo } from 'react'
import {
  View, Text, ActivityIndicator, TouchableOpacity,
  TextInput, Modal, Pressable,
} from 'react-native'
import { FlashList } from '@shopify/flash-list'
import Fuse from 'fuse.js'
import { Ionicons } from '@expo/vector-icons'
import { getDocs, collection, query, orderBy } from 'firebase/firestore'
import { useLocalSearchParams, router } from 'expo-router'
import { db } from '@/lib/firebase'
import { useCircle } from '@/hooks/useCircle'
import ItemCard from '@/components/media/ItemCard'
import type { MediaItem, MediaType, ItemStatus } from '@/types/media'
import { STATUS_OPTIONS } from '@/constants/statuses'

const TYPE_OPTIONS: { value: MediaType; label: string }[] = [
  { value: 'film', label: 'Films' },
  { value: 'serie', label: 'Séries' },
  { value: 'livre', label: 'Livres' },
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

export default function MemberCollectionScreen() {
  const { uid: memberUid } = useLocalSearchParams<{ uid: string }>()
  const { members } = useCircle()
  const [items, setItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [mediaType, setMediaType] = useState<MediaType | null>(null)
  const [status, setStatus] = useState<ItemStatus | null>(null)
  const [filterModalVisible, setFilterModalVisible] = useState(false)

  const member = members.find((m) => m.uid === memberUid)

  useEffect(() => {
    if (!memberUid) {
      setLoading(false)
      return
    }

    const load = async () => {
      try {
        const q = query(
          collection(db, 'users', memberUid, 'items'),
          orderBy('addedAt', 'desc')
        )
        const snap = await getDocs(q)
        setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() } as MediaItem)))
      } catch {
        // Firestore rules block access if not in same circle
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [memberUid])

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

    return searched
      .filter((item) => {
        const matchesType = !mediaType || item.type === mediaType
        const matchesStatus = !status || item.statuses.includes(status)
        return matchesType && matchesStatus
      })
      .sort((a, b) => (b.endedAt?.toMillis() ?? -Infinity) - (a.endedAt?.toMillis() ?? -Infinity))
  }, [fuse, items, searchQuery, mediaType, status])

  const hasActiveFilters = !!mediaType || !!status

  return (
    <View className="flex-1 bg-[#0E0B0B]">
      <View className="flex-row items-center px-4 pt-12 pb-4">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="chevron-back" size={22} color="#FBBF24" />
        </TouchableOpacity>
        <Text className="text-white text-xl font-bold flex-1">
          {member?.displayName ?? member?.email ?? 'Membre'}
        </Text>
      </View>

      {/* Barre de recherche + bouton filtre */}
      <View className="px-4 mb-3 flex-row items-center gap-2">
        <TextInput
          placeholder="Rechercher dans cette collection..."
          placeholderTextColor="#6B5E5E"
          value={searchQuery}
          onChangeText={setSearchQuery}
          className="bg-[#1C1717] text-white border border-[#3D3535] rounded-lg px-4 py-2"
          style={{ flex: 1 }}
        />
        <TouchableOpacity
          testID="filter-button"
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

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#f59e0b" />
        </View>
      ) : (
        <FlashList
          data={filteredItems}
          keyExtractor={(item) => item.id}
          estimatedItemSize={70}
          renderItem={({ item }) => (
            <ItemCard item={item} onPress={(id) => router.push(`/(app)/item/${id}?memberUid=${memberUid}`)} />
          )}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          ListEmptyComponent={
            <Text className="text-[#6B5E5E] text-center mt-8">
              {hasActiveFilters || searchQuery ? 'Aucun item ne correspond.' : 'Collection vide'}
            </Text>
          }
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
            {Object.entries(STATUS_OPTIONS).map(([value, { label }]) => (
              <Chip
                key={value}
                label={label}
                active={status === value}
                onPress={() => setStatus(status === (value as ItemStatus) ? null : (value as ItemStatus))}
              />
            ))}
          </View>

          {/* Effacer */}
          {hasActiveFilters && (
            <TouchableOpacity
              onPress={() => { setMediaType(null); setStatus(null); setFilterModalVisible(false) }}
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
