import { useState } from 'react'
import { View, Text, Image, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useAuthStore } from '@/stores/authStore'
import { useCollection } from '@/hooks/useCollection'
import { addItem } from '@/lib/firestore'
import { findDuplicate } from '@/lib/duplicates'
import type { MediaType } from '@/types/media'

export default function PreviewScreen() {
  const router = useRouter()
  const uid = useAuthStore((s) => s.uid)
  const { items } = useCollection()
  const [adding, setAdding] = useState(false)

  const params = useLocalSearchParams<{
    title: string
    type: string
    poster?: string
    synopsis?: string
    year?: string
    director?: string
    author?: string
    tmdbId?: string
    googleBooksId?: string
    isbn?: string
    source?: string
    sourceName?: string
  }>()

  const title = params.title ?? ''
  const type = (params.type ?? 'film') as MediaType
  const poster = params.poster || undefined
  const synopsis = params.synopsis || undefined
  const year = params.year ? parseInt(params.year, 10) : undefined
  const director = params.director || undefined
  const author = params.author || undefined
  const tmdbId = params.tmdbId || undefined
  const googleBooksId = params.googleBooksId || undefined
  const isbn = params.isbn || undefined
  const source = params.source
  const sourceName = params.sourceName || undefined

  const typeLabel = type === 'film' ? 'Film' : type === 'serie' ? 'Série' : 'Livre'

  const existing = findDuplicate(items, { title, type, tmdbId, googleBooksId, isbn })

  const handleAdd = async () => {
    if (!uid) return
    setAdding(true)
    try {
      const newId = await addItem(uid, {
        title,
        type,
        poster,
        synopsis,
        year,
        director,
        author,
        tmdbId,
        googleBooksId,
        isbn,
        statuses: ['owned'],
        tier: 'none',
        addedVia: 'discover',
      })
      router.replace(`/(app)/item/${newId}` as never)
    } finally {
      setAdding(false)
    }
  }

  return (
    <ScrollView className="flex-1 bg-[#0E0B0B]" contentContainerStyle={{ padding: 16, paddingTop: 48 }}>
      <TouchableOpacity onPress={() => router.back()} className="mb-6">
        <Text className="text-amber-400 text-sm">← Retour</Text>
      </TouchableOpacity>

      <View className="flex-row mb-6">
        {poster ? (
          <Image
            source={{ uri: poster }}
            className="w-28 h-40 rounded-lg mr-4"
            resizeMode="cover"
          />
        ) : (
          <View className="w-28 h-40 rounded-lg mr-4 bg-[#1C1717] items-center justify-center">
            <Text className="text-[#6B5E5E] text-xs">?</Text>
          </View>
        )}

        <View className="flex-1 justify-start">
          <Text className="text-white text-xl font-bold mb-2">{title}</Text>
          <View className="bg-[#3D3535] rounded px-2 py-0.5 self-start mb-2">
            <Text className="text-[#6B5E5E] text-xs">{typeLabel}</Text>
          </View>
          {year ? <Text className="text-[#6B5E5E] text-sm mb-1">{year}</Text> : null}
          {director ? (
            <Text className="text-[#6B5E5E] text-sm mb-1">Réal. {director}</Text>
          ) : null}
          {author ? (
            <Text className="text-[#6B5E5E] text-sm mb-1">Par {author}</Text>
          ) : null}
        </View>
      </View>

      {synopsis ? (
        <View className="mb-6">
          <Text className="text-white font-semibold mb-2">Synopsis</Text>
          <Text className="text-[#6B5E5E] text-sm leading-5">{synopsis}</Text>
        </View>
      ) : null}

      {sourceName ? (
        <View className="bg-[#1C1717] border border-[#3D3535] rounded-lg px-4 py-3 mb-6">
          <Text className="text-[#6B5E5E] text-xs">
            {source === 'cineclub'
              ? `En ${type === 'livre' ? 'Coin lecture' : 'Cinéclub'} · Mis en avant par ${sourceName}`
              : `Recommandé par ${sourceName}`}
          </Text>
        </View>
      ) : null}

      {existing ? (
        <TouchableOpacity
          onPress={() => router.push(`/(app)/item/${existing.id}` as never)}
          className="bg-amber-500 rounded-lg py-3 items-center"
        >
          <Text className="text-black font-semibold">Voir dans ma collection</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          onPress={handleAdd}
          disabled={adding}
          className={`rounded-lg py-3 items-center ${adding ? 'bg-[#3D3535]' : 'bg-amber-500'}`}
        >
          {adding ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text className="text-black font-semibold">Ajouter à ma collection</Text>
          )}
        </TouchableOpacity>
      )}
    </ScrollView>
  )
}
