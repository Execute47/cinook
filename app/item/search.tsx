import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, Image, ActivityIndicator, ScrollView,
} from 'react-native'
import { router } from 'expo-router'
import { useMediaSearch } from '@/hooks/useMediaSearch'
import { addItem } from '@/lib/firestore'
import { getMovieDirector } from '@/lib/tmdb'
import { useAuthStore } from '@/stores/authStore'
import { useCollection } from '@/hooks/useCollection'
import { findDuplicate } from '@/lib/duplicates'
import SearchResultCard from '@/components/media/SearchResultCard'
import type { MediaResult } from '@/types/api'
import type { MediaType } from '@/types/media'

const TYPES: { value: MediaType; label: string }[] = [
  { value: 'film', label: 'Film' },
  { value: 'serie', label: 'Série' },
  { value: 'livre', label: 'Livre' },
]

export default function SearchScreen() {
  const uid = useAuthStore((s) => s.uid)
  const { items } = useCollection()
  const { results, isLoading, error, query, mediaType, setQuery, setMediaType, reset } =
    useMediaSearch()
  const [selected, setSelected] = useState<MediaResult | null>(null)
  const [isAdding, setIsAdding] = useState(false)

  const existingItem = selected
    ? findDuplicate(items, {
        title: selected.title,
        type: selected.type,
        tmdbId: selected.tmdbId,
        googleBooksId: selected.googleBooksId,
        isbn: selected.isbn,
      })
    : undefined

  const handleAdd = async () => {
    if (!selected || !uid) return
    setIsAdding(true)
    const item: Record<string, unknown> = {
      title: selected.title,
      type: selected.type,
      statuses: [],
      tier: 'none',
      addedVia: 'search',
    }
    if (selected.poster !== undefined) item.poster = selected.poster
    if (selected.synopsis !== undefined) item.synopsis = selected.synopsis
    const director = selected.director ?? (selected.type === 'film' && selected.tmdbId ? await getMovieDirector(selected.tmdbId) : undefined)
    if (director !== undefined) item.director = director
    if (selected.author !== undefined) item.author = selected.author
    if (selected.year !== undefined) item.year = selected.year
    if (selected.tmdbId !== undefined) item.tmdbId = selected.tmdbId
    if (selected.googleBooksId !== undefined) item.googleBooksId = selected.googleBooksId
    if (selected.isbn !== undefined) item.isbn = selected.isbn

    await addItem(uid, item as never)
    setIsAdding(false)
    router.back()
  }

  // Vue fiche détail après sélection
  if (selected) {
    return (
      <ScrollView className="flex-1 bg-[#0E0B0B]" contentContainerStyle={{ padding: 24 }}>
        <TouchableOpacity onPress={() => setSelected(null)} className="mb-4">
          <Text className="text-amber-400">← Retour aux résultats</Text>
        </TouchableOpacity>
        <Text className="text-white text-2xl font-bold mb-4 text-center">{selected.title}</Text>
        {selected.poster && (
          <Image
            source={{ uri: selected.poster }}
            className="w-40 h-60 rounded-lg mb-4 self-center"
            resizeMode="cover"
          />
        )}
        {selected.year && (
          <Text className="text-[#6B5E5E] text-center mb-1">{selected.year}</Text>
        )}
        {(selected.director || selected.author) && (
          <Text className="text-gray-300 text-center mb-1">
            {selected.director ?? selected.author}
          </Text>
        )}
        {selected.synopsis && (
          <Text className="text-gray-300 text-sm text-center mb-6 px-2" numberOfLines={5}>
            {selected.synopsis}
          </Text>
        )}
        {existingItem ? (
          <View className="items-center gap-3">
            <View className="bg-[#1C1717] border border-[#3D3535] rounded-lg px-4 py-2">
              <Text className="text-[#6B5E5E] text-sm text-center">Déjà dans votre collection</Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push(`/(app)/item/${existingItem.id}`)}
              className="bg-amber-500 py-4 rounded-xl w-full"
            >
              <Text className="text-black font-bold text-center">Voir la fiche</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            onPress={handleAdd}
            disabled={isAdding}
            className="bg-amber-500 py-4 rounded-xl mb-3"
          >
            <Text className="text-black font-bold text-center text-lg">
              {isAdding ? 'Ajout...' : 'Ajouter à ma collection'}
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={() => setSelected(null)} className="py-3">
          <Text className="text-[#6B5E5E] text-center">Annuler</Text>
        </TouchableOpacity>
      </ScrollView>
    )
  }

  return (
    <View className="flex-1 bg-[#0E0B0B] px-4 pt-12">
      {/* Header */}
      <View className="flex-row items-center mb-4">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Text className="text-amber-400 text-base">✕</Text>
        </TouchableOpacity>
        <Text className="text-white text-xl font-bold">Rechercher</Text>
      </View>

      {/* Sélecteur type */}
      <View className="flex-row mb-4 gap-2">
        {TYPES.map((t) => (
          <TouchableOpacity
            key={t.value}
            onPress={() => setMediaType(t.value)}
            className={`flex-1 py-2 rounded-lg items-center border ${
              mediaType === t.value
                ? 'bg-amber-500 border-amber-500'
                : 'bg-[#1C1717] border-[#3D3535]'
            }`}
          >
            <Text
              className={`font-medium text-sm ${
                mediaType === t.value ? 'text-black' : 'text-white'
              }`}
            >
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Input recherche */}
      <TextInput
        placeholder="Titre du film, série ou livre..."
        placeholderTextColor="#6B5E5E"
        value={query}
        onChangeText={setQuery}
        autoFocus
        className="bg-[#1C1717] text-white border border-[#3D3535] rounded-lg px-4 py-3 mb-4"
      />

      {/* Résultats */}
      {isLoading && (
        <View className="items-center py-8">
          <ActivityIndicator size="large" color="#f59e0b" />
        </View>
      )}

      {!isLoading && query.length >= 2 && results.length === 0 && !error && (
        <View className="items-center py-8 px-4">
          <Text className="text-white text-base text-center mb-2">Aucun résultat</Text>
          <Text className="text-[#6B5E5E] text-sm text-center mb-6">
            Aucun résultat — créer manuellement ?
          </Text>
          <TouchableOpacity
            onPress={() => { reset(); router.push('/item/new') }}
            className="bg-[#1C1717] border border-[#3D3535] px-6 py-3 rounded-lg"
          >
            <Text className="text-white">Créer manuellement</Text>
          </TouchableOpacity>
        </View>
      )}

      {!isLoading && results.length > 0 && (
        <FlatList
          data={results}
          keyExtractor={(item, index) => `${item.tmdbId ?? item.googleBooksId ?? index}`}
          renderItem={({ item }) => (
            <SearchResultCard item={item} onPress={setSelected} />
          )}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  )
}
