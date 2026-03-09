import { useState, useEffect } from 'react'
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native'
import { getDocs, collection, query, orderBy } from 'firebase/firestore'
import { useLocalSearchParams, router } from 'expo-router'
import { db } from '@/lib/firebase'
import { useCircle } from '@/hooks/useCircle'
import ItemCard from '@/components/media/ItemCard'
import type { MediaItem } from '@/types/media'

export default function MemberCollectionScreen() {
  const { uid: memberUid } = useLocalSearchParams<{ uid: string }>()
  const { members } = useCircle()
  const [items, setItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)

  const member = members.find((m) => m.uid === memberUid)

  useEffect(() => {
    if (!memberUid) return

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

  return (
    <View className="flex-1 bg-[#0E0B0B]">
      <View className="flex-row items-center px-4 pt-12 pb-4">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Text className="text-amber-400">←</Text>
        </TouchableOpacity>
        <Text className="text-white text-xl font-bold flex-1">
          {member?.displayName ?? member?.email ?? 'Membre'}
        </Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#f59e0b" />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ItemCard item={item} onPress={() => {}} />}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          ListEmptyComponent={
            <Text className="text-[#6B5E5E] text-center mt-8">Collection vide</Text>
          }
        />
      )}
    </View>
  )
}
