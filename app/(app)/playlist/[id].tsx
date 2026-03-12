import { View, Text, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { usePlaylists } from '@/hooks/usePlaylists'
import { useCollection } from '@/hooks/useCollection'
import { removeItemFromPlaylist } from '@/lib/playlists'
import { useAuthStore } from '@/stores/authStore'
import ItemCard from '@/components/media/ItemCard'

export default function PlaylistDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const uid = useAuthStore((s) => s.uid)
  const { playlists, loading: playlistsLoading } = usePlaylists()
  const { items, loading: itemsLoading } = useCollection()

  const playlist = playlists.find((p) => p.id === id)
  const playlistItems = items.filter((item) => playlist?.itemIds.includes(item.id))

  if (playlistsLoading || itemsLoading) {
    return (
      <View className="flex-1 bg-[#0E0B0B] items-center justify-center">
        <ActivityIndicator size="large" color="#f59e0b" />
      </View>
    )
  }

  if (!playlist) {
    return (
      <View className="flex-1 bg-[#0E0B0B] items-center justify-center px-6">
        <Text className="text-red-400 text-lg font-bold mb-2">Playlist introuvable</Text>
        <TouchableOpacity onPress={() => router.push('/(app)/playlists')}>
          <View className="flex-row items-center gap-1">
            <Ionicons name="chevron-back" size={16} color="#FBBF24" />
            <Text className="text-amber-400">Retour aux playlists</Text>
          </View>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View className="flex-1 bg-[#0E0B0B]">
      {/* Header */}
      <View className="flex-row items-center px-4 pt-12 pb-3">
        <TouchableOpacity onPress={() => router.push('/(app)/playlists')} className="mr-3">
          <Ionicons name="chevron-back" size={22} color="#FBBF24" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-white text-2xl font-bold">{playlist.name}</Text>
          <Text className="text-[#6B5E5E] text-xs">
            {playlistItems.length} item{playlistItems.length !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      {playlistItems.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="film-outline" size={48} color="#3D3535" />
          <Text className="text-[#6B5E5E] text-center mt-4">
            Cette playlist est vide.{'\n'}Ajoute des items depuis leur fiche.
          </Text>
        </View>
      ) : (
        <FlatList
          data={playlistItems}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          renderItem={({ item, index }) => (
            <View className="flex-row items-center">
              <View className="flex-1">
                <ItemCard
                  item={item}
                  onPress={(itemId) => router.push(`/(app)/item/${itemId}`)}
                  animationIndex={index}
                />
              </View>
              <TouchableOpacity
                onPress={() => uid && removeItemFromPlaylist(uid, playlist.id, item.id)}
                className="ml-2 p-2"
              >
                <Ionicons name="close-circle" size={20} color="#6B5E5E" />
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  )
}
