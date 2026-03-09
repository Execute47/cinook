import { useState } from 'react'
import {
  View, Text, Image, TouchableOpacity, ScrollView,
  TextInput, Alert, ActivityIndicator,
} from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { useCollection } from '@/hooks/useCollection'
import { updateItem, deleteItem } from '@/lib/firestore'
import { useAuthStore } from '@/stores/authStore'
import type { MediaType } from '@/types/media'

const TYPE_LABEL: Record<string, string> = { film: 'Film', serie: 'Série', livre: 'Livre' }
const TYPES: { value: MediaType; label: string }[] = [
  { value: 'film', label: 'Film' },
  { value: 'serie', label: 'Série' },
  { value: 'livre', label: 'Livre' },
]

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const uid = useAuthStore((s) => s.uid)
  const { items } = useCollection()
  const item = items.find((i) => i.id === id)

  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Champs éditables
  const [title, setTitle] = useState('')
  const [mediaType, setMediaType] = useState<MediaType>('film')
  const [year, setYear] = useState('')
  const [director, setDirector] = useState('')
  const [author, setAuthor] = useState('')
  const [synopsis, setSynopsis] = useState('')

  const startEditing = () => {
    if (!item) return
    setTitle(item.title)
    setMediaType(item.type)
    setYear(item.year?.toString() ?? '')
    setDirector(item.director ?? '')
    setAuthor(item.author ?? '')
    setSynopsis(item.synopsis ?? '')
    setIsEditing(true)
  }

  const handleSave = async () => {
    if (!uid || !item || !title.trim()) return
    setIsSaving(true)

    const updates: Record<string, unknown> = { title: title.trim(), type: mediaType }
    const parsedYear = parseInt(year, 10)
    if (year && !isNaN(parsedYear)) updates.year = parsedYear
    if (mediaType === 'livre') { updates.author = author.trim() || null }
    else { updates.director = director.trim() || null }
    if (synopsis.trim()) updates.synopsis = synopsis.trim()

    await updateItem(uid, item.id, updates as never)
    setIsSaving(false)
    setIsEditing(false)
  }

  const handleDelete = () => {
    if (!uid || !item) return
    Alert.alert(
      'Supprimer cet item',
      'Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            await deleteItem(uid, item.id)
            router.back()
          },
        },
      ]
    )
  }

  if (!item) {
    return (
      <View className="flex-1 bg-[#0E0B0B] items-center justify-center">
        <ActivityIndicator size="large" color="#f59e0b" />
      </View>
    )
  }

  if (isEditing) {
    return (
      <ScrollView className="flex-1 bg-[#0E0B0B]" contentContainerStyle={{ padding: 24 }}>
        <View className="flex-row items-center mb-6">
          <TouchableOpacity onPress={() => setIsEditing(false)} className="mr-3">
            <Text className="text-amber-400">← Annuler</Text>
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold flex-1">Modifier</Text>
          <TouchableOpacity onPress={handleSave} disabled={isSaving}>
            <Text className="text-amber-400 font-semibold">
              {isSaving ? 'Enregistrement...' : 'Enregistrer'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Type */}
        <View className="flex-row mb-5 gap-2">
          {TYPES.map((t) => (
            <TouchableOpacity
              key={t.value}
              onPress={() => setMediaType(t.value)}
              className={`flex-1 py-2 rounded-lg items-center border ${
                mediaType === t.value ? 'bg-amber-500 border-amber-500' : 'bg-[#1C1717] border-[#3D3535]'
              }`}
            >
              <Text className={`font-medium text-sm ${mediaType === t.value ? 'text-black' : 'text-white'}`}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text className="text-[#6B5E5E] text-sm mb-1">Titre *</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          className="bg-[#1C1717] text-white border border-[#3D3535] rounded-lg px-4 py-3 mb-4"
        />

        <Text className="text-[#6B5E5E] text-sm mb-1">Année</Text>
        <TextInput
          value={year}
          onChangeText={setYear}
          keyboardType="numeric"
          className="bg-[#1C1717] text-white border border-[#3D3535] rounded-lg px-4 py-3 mb-4"
        />

        <Text className="text-[#6B5E5E] text-sm mb-1">
          {mediaType === 'livre' ? 'Auteur' : 'Réalisateur'}
        </Text>
        <TextInput
          value={mediaType === 'livre' ? author : director}
          onChangeText={mediaType === 'livre' ? setAuthor : setDirector}
          className="bg-[#1C1717] text-white border border-[#3D3535] rounded-lg px-4 py-3 mb-4"
        />

        <Text className="text-[#6B5E5E] text-sm mb-1">Synopsis</Text>
        <TextInput
          value={synopsis}
          onChangeText={setSynopsis}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          className="bg-[#1C1717] text-white border border-[#3D3535] rounded-lg px-4 py-3"
          style={{ minHeight: 100 }}
        />
      </ScrollView>
    )
  }

  return (
    <ScrollView className="flex-1 bg-[#0E0B0B]" contentContainerStyle={{ padding: 24 }}>
      {/* Header */}
      <View className="flex-row items-center mb-4">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Text className="text-amber-400">←</Text>
        </TouchableOpacity>
        <View className="flex-1" />
        <TouchableOpacity onPress={startEditing} className="mr-4">
          <Text className="text-amber-400">Modifier</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDelete}>
          <Text className="text-red-400">Supprimer</Text>
        </TouchableOpacity>
      </View>

      {/* Affiche */}
      {item.poster ? (
        <Image
          source={{ uri: item.poster }}
          className="w-40 h-60 rounded-lg mb-4 self-center"
          resizeMode="cover"
        />
      ) : (
        <View className="w-40 h-60 rounded-lg mb-4 self-center bg-[#1C1717] items-center justify-center">
          <Text className="text-[#6B5E5E]">Pas d'affiche</Text>
        </View>
      )}

      {/* Titre + badges */}
      <Text className="text-white text-2xl font-bold text-center mb-2">{item.title}</Text>
      <View className="flex-row justify-center gap-2 mb-4 flex-wrap">
        <View className="bg-[#3D3535] px-3 py-1 rounded-full">
          <Text className="text-amber-400 text-sm">{TYPE_LABEL[item.type] ?? item.type}</Text>
        </View>
        {item.year && (
          <View className="bg-[#3D3535] px-3 py-1 rounded-full">
            <Text className="text-gray-300 text-sm">{item.year}</Text>
          </View>
        )}
      </View>

      {/* Métadonnées */}
      {(item.director || item.author) && (
        <Text className="text-gray-300 text-center mb-2">{item.director ?? item.author}</Text>
      )}

      {/* Synopsis */}
      {item.synopsis && (
        <Text className="text-gray-300 text-sm leading-5 mb-4">{item.synopsis}</Text>
      )}

      {/* Statut / Note — stubs pour Story 3.x */}
      <View className="bg-[#1C1717] border border-[#3D3535] rounded-lg p-4 mt-2">
        <Text className="text-[#6B5E5E] text-sm text-center">Statut & notation — Story 3.x</Text>
      </View>
    </ScrollView>
  )
}
