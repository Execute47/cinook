import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native'
import { router } from 'expo-router'
import { addItem } from '@/lib/firestore'
import { useAuthStore } from '@/stores/authStore'
import { useCollection } from '@/hooks/useCollection'
import { findDuplicate } from '@/lib/duplicates'
import type { MediaType } from '@/types/media'

const TYPES: { value: MediaType; label: string }[] = [
  { value: 'film', label: 'Film' },
  { value: 'serie', label: 'Série' },
  { value: 'livre', label: 'Livre' },
]

export default function NewItemScreen() {
  const uid = useAuthStore((s) => s.uid)
  const { items } = useCollection()

  const [title, setTitle] = useState('')
  const [mediaType, setMediaType] = useState<MediaType>('film')
  const [year, setYear] = useState('')
  const [director, setDirector] = useState('')
  const [author, setAuthor] = useState('')
  const [synopsis, setSynopsis] = useState('')
  const [titleError, setTitleError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const duplicateItem = title.trim()
    ? findDuplicate(items, { title, type: mediaType })
    : undefined

  const handleAdd = async () => {
    if (!title.trim()) {
      setTitleError('Le titre est obligatoire')
      return
    }
    if (!uid) return

    setTitleError(null)
    setIsLoading(true)

    const item: Record<string, unknown> = {
      title: title.trim(),
      type: mediaType,
      statuses: [],
      tier: 'none',
      addedVia: 'manual',
    }
    const parsedYear = parseInt(year, 10)
    if (year && !isNaN(parsedYear)) item.year = parsedYear
    if (mediaType === 'livre' && author.trim()) item.author = author.trim()
    if (mediaType !== 'livre' && director.trim()) item.director = director.trim()
    if (synopsis.trim()) item.synopsis = synopsis.trim()

    await addItem(uid, item as never)
    setIsLoading(false)
    router.back()
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-[#0E0B0B]"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={{ padding: 24 }} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View className="flex-row items-center mb-6">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Text className="text-amber-400 text-base">✕</Text>
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold">Créer manuellement</Text>
        </View>

        {/* Sélecteur type */}
        <Text className="text-[#6B5E5E] text-sm mb-2">Type de média</Text>
        <View className="flex-row mb-5 gap-2">
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
              <Text className={`font-medium text-sm ${mediaType === t.value ? 'text-black' : 'text-white'}`}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Titre (requis) */}
        <Text className="text-[#6B5E5E] text-sm mb-1">Titre *</Text>
        <TextInput
          placeholder="Titre"
          placeholderTextColor="#6B5E5E"
          value={title}
          onChangeText={(v) => { setTitle(v); setTitleError(null) }}
          className="bg-[#1C1717] text-white border border-[#3D3535] rounded-lg px-4 py-3 mb-1"
        />
        {titleError && <Text className="text-red-400 text-sm mb-3">{titleError}</Text>}
        {!titleError && duplicateItem ? (
          <View className="mb-3">
            <Text className="text-amber-400 text-xs">
              Un item similaire existe déjà dans votre collection.{' '}
            </Text>
            <TouchableOpacity onPress={() => router.push(`/(app)/item/${duplicateItem.id}`)}>
              <Text className="text-amber-400 text-xs underline">Voir la fiche</Text>
            </TouchableOpacity>
          </View>
        ) : (
          !titleError && <View className="mb-3" />
        )}

        {/* Année */}
        <Text className="text-[#6B5E5E] text-sm mb-1">Année (optionnel)</Text>
        <TextInput
          placeholder="Ex : 1999"
          placeholderTextColor="#6B5E5E"
          value={year}
          onChangeText={setYear}
          keyboardType="numeric"
          className="bg-[#1C1717] text-white border border-[#3D3535] rounded-lg px-4 py-3 mb-4"
        />

        {/* Réalisateur / Auteur */}
        <Text className="text-[#6B5E5E] text-sm mb-1">
          {mediaType === 'livre' ? 'Auteur (optionnel)' : 'Réalisateur (optionnel)'}
        </Text>
        <TextInput
          placeholder={mediaType === 'livre' ? 'Auteur' : 'Réalisateur'}
          placeholderTextColor="#6B5E5E"
          value={mediaType === 'livre' ? author : director}
          onChangeText={mediaType === 'livre' ? setAuthor : setDirector}
          className="bg-[#1C1717] text-white border border-[#3D3535] rounded-lg px-4 py-3 mb-4"
        />

        {/* Synopsis */}
        <Text className="text-[#6B5E5E] text-sm mb-1">Synopsis (optionnel)</Text>
        <TextInput
          placeholder="Synopsis..."
          placeholderTextColor="#6B5E5E"
          value={synopsis}
          onChangeText={setSynopsis}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          className="bg-[#1C1717] text-white border border-[#3D3535] rounded-lg px-4 py-3 mb-6"
          style={{ minHeight: 100 }}
        />

        {/* Bouton */}
        <TouchableOpacity
          onPress={handleAdd}
          disabled={isLoading}
          className="bg-amber-500 py-4 rounded-xl"
        >
          <Text className="text-black font-bold text-center text-lg">
            {isLoading ? 'Ajout...' : 'Ajouter à ma collection'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
