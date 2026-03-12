import { useState } from 'react'
import {
  View, Text, Image, TouchableOpacity, ScrollView,
  TextInput, Alert, ActivityIndicator, Platform,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, router } from 'expo-router'
import { useCollection } from '@/hooks/useCollection'
import { updateItem, deleteItem } from '@/lib/firestore'
import { useAuthStore } from '@/stores/authStore'
import StatusPicker, { STATUS_OPTIONS } from '@/components/media/StatusPicker'
import { getStatusLabel } from '@/constants/statuses'
import RatingWidget from '@/components/media/RatingWidget'
import TierPicker from '@/components/media/TierPicker'
import TierBadge from '@/components/media/TierBadge'
import CommentInput from '@/components/media/CommentInput'
import LoanModal from '@/components/media/LoanModal'
import WatchDateModal from '@/components/media/WatchDateModal'
import MemberOpinions from '@/components/circle/MemberOpinions'
import RecoComposer from '@/components/circle/RecoComposer'
import CineclubButton from '@/components/circle/CineclubButton'
import { useCineclub } from '@/hooks/useCineclub'
import { usePlaylists } from '@/hooks/usePlaylists'
import { addItemToPlaylist, removeItemFromPlaylist } from '@/lib/playlists'
import type { MediaType, ItemStatus, TierLevel } from '@/types/media'
import { deleteField, Timestamp } from 'firebase/firestore'

const TYPE_LABEL: Record<string, string> = { film: 'Film', serie: 'Série', livre: 'Livre' }
const TYPES: { value: MediaType; label: string }[] = [
  { value: 'film', label: 'Film' },
  { value: 'serie', label: 'Série' },
  { value: 'livre', label: 'Livre' },
]

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const uid = useAuthStore((s) => s.uid)
  const { items, loading: collectionLoading } = useCollection()
  const { cineclub } = useCineclub()
  const { playlists } = usePlaylists()
  const item = items.find((i) => i.id === id)

  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showLoanModal, setShowLoanModal] = useState(false)
  const [showWatchDateModal, setShowWatchDateModal] = useState(false)
  const [showRecoComposer, setShowRecoComposer] = useState(false)

  const handleStatusChange = async (newStatus: ItemStatus) => {
    if (!uid || !item) return
    if (newStatus === 'loaned' && item.status !== 'loaned') {
      setShowLoanModal(true)
      return
    }
    if (newStatus === 'watched') {
      setShowWatchDateModal(true)
      return
    }
    const updates: Record<string, unknown> = { status: newStatus }
    if (item.status === 'loaned' && newStatus !== 'loaned') {
      updates.loanTo = deleteField()
      updates.loanDate = deleteField()
    }
    if (item.status === 'watched' && newStatus !== 'watched') {
      updates.startedAt = deleteField()
      updates.endedAt = deleteField()
    }
    await updateItem(uid, item.id, updates as never)
  }

  const handleLoanValidate = async (loanTo: string, loanDate: Timestamp) => {
    if (!uid || !item) return
    setShowLoanModal(false)
    await updateItem(uid, item.id, { status: 'loaned', loanTo, loanDate } as never)
  }

  const handleWatchDateValidate = async (endedAt: Timestamp, startedAt?: Timestamp) => {
    if (!uid || !item) return
    setShowWatchDateModal(false)
    const updates: Record<string, unknown> = { status: 'watched', endedAt }
    if (startedAt) updates.startedAt = startedAt
    if (item.status === 'loaned') {
      updates.loanTo = deleteField()
      updates.loanDate = deleteField()
    }
    await updateItem(uid, item.id, updates as never)
  }

  const STATUS_MAP = Object.fromEntries(STATUS_OPTIONS.map((s) => [s.value, s]))

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
    const doDelete = async () => {
      await deleteItem(uid, item.id)
      router.push('/(app)/collection')
    }
    if (Platform.OS === 'web') {
      if (window.confirm('Supprimer cet item ?\n\nCette action est irréversible.')) doDelete()
    } else {
      Alert.alert('Supprimer cet item', 'Cette action est irréversible.', [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: doDelete },
      ])
    }
  }

  if (collectionLoading) {
    return (
      <View className="flex-1 bg-[#0E0B0B] items-center justify-center">
        <ActivityIndicator size="large" color="#f59e0b" />
      </View>
    )
  }

  if (!item) {
    return (
      <View className="flex-1 bg-[#0E0B0B] items-center justify-center px-6">
        <Text className="text-red-400 text-lg font-bold mb-2">Item introuvable</Text>
        <TouchableOpacity onPress={() => router.push('/(app)/collection')}>
          <View className="flex-row items-center gap-1">
            <Ionicons name="chevron-back" size={16} color="#FBBF24" />
            <Text className="text-amber-400">Retour à la collection</Text>
          </View>
        </TouchableOpacity>
      </View>
    )
  }

  if (isEditing) {
    return (
      <ScrollView className="flex-1 bg-[#0E0B0B]" contentContainerStyle={{ padding: 24 }}>
        <View className="flex-row items-center mb-6">
          <TouchableOpacity onPress={() => setIsEditing(false)} className="mr-3">
            <View className="flex-row items-center gap-1">
              <Ionicons name="chevron-back" size={16} color="#FBBF24" />
              <Text className="text-amber-400">Annuler</Text>
            </View>
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
      <View className="mb-4">
        <View className="flex-row items-center mb-3">
          <TouchableOpacity onPress={() => router.push('/(app)/collection')} className="mr-3">
            <Ionicons name="chevron-back" size={22} color="#FBBF24" />
          </TouchableOpacity>
          <View className="flex-1" />
          <CineclubButton item={item} currentCineclubItemId={cineclub?.itemId} />
        </View>
        <View className="flex-row justify-end gap-4">
          <TouchableOpacity onPress={() => setShowRecoComposer(true)}>
            <Text className="text-amber-400">Recommander</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={startEditing}>
            <Text className="text-amber-400">Modifier</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete}>
            <Text className="text-red-400">Supprimer</Text>
          </TouchableOpacity>
        </View>
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

      {/* Statut */}
      <View className="bg-[#1C1717] border border-[#3D3535] rounded-lg p-4 mt-2">
        <View className="flex-row items-center mb-3">
          <Text className="text-[#6B5E5E] text-sm mr-2">Statut :</Text>
          <View className="px-2 py-0.5 rounded" style={{ backgroundColor: '#2A2222' }}>
            <Text className="text-sm font-medium" style={{ color: STATUS_MAP[item.status]?.color ?? '#9CA3AF' }}>
              {getStatusLabel(item.status, item.type)}
            </Text>
          </View>
        </View>
        <StatusPicker current={item.status} onSelect={handleStatusChange} mediaType={item.type} />
        {item.status === 'loaned' && item.loanTo && (
          <View className="mt-3 pt-3 border-t border-[#3D3535]">
            <Text className="text-[#6B5E5E] text-sm">
              Prêté à : <Text className="text-amber-400">{item.loanTo}</Text>
            </Text>
            {item.loanDate && (
              <Text className="text-[#6B5E5E] text-sm mt-0.5">
                Depuis le : {item.loanDate.toDate().toLocaleDateString('fr-FR')}
              </Text>
            )}
          </View>
        )}
        {item.status === 'watched' && item.endedAt && (
          <View className="mt-3 pt-3 border-t border-[#3D3535]">
            {item.type === 'film' ? (
              <Text className="text-[#6B5E5E] text-sm">
                Vu le : <Text className="text-white">{item.endedAt.toDate().toLocaleDateString('fr-FR')}</Text>
              </Text>
            ) : (
              <>
                {item.startedAt && (
                  <Text className="text-[#6B5E5E] text-sm">
                    Commencé le : <Text className="text-white">{item.startedAt.toDate().toLocaleDateString('fr-FR')}</Text>
                  </Text>
                )}
                <Text className="text-[#6B5E5E] text-sm mt-0.5">
                  Terminé le : <Text className="text-white">{item.endedAt.toDate().toLocaleDateString('fr-FR')}</Text>
                </Text>
              </>
            )}
            <TouchableOpacity
              onPress={() => setShowWatchDateModal(true)}
              className="mt-2"
            >
              <Text className="text-amber-400 text-xs">Modifier les dates</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <LoanModal
        visible={showLoanModal}
        onValidate={handleLoanValidate}
        onCancel={() => setShowLoanModal(false)}
      />
      <WatchDateModal
        visible={showWatchDateModal}
        type={item.type}
        initialEndedAt={item.endedAt}
        initialStartedAt={item.startedAt}
        onValidate={handleWatchDateValidate}
        onCancel={() => setShowWatchDateModal(false)}
      />

      {/* Mon avis */}
      <View className="bg-[#1C1717] border border-[#3D3535] rounded-lg p-4 mt-2">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-white font-semibold">Mon avis</Text>
          <TierBadge tier={item.tier} />
        </View>

        <Text className="text-[#6B5E5E] text-sm mb-2">Note</Text>
        <RatingWidget
          value={item.rating ?? null}
          onRate={async (val) => {
            if (!uid) return
            await updateItem(uid, item.id, { rating: val === null ? deleteField() : val } as never)
          }}
        />

        <Text className="text-[#6B5E5E] text-sm mt-4 mb-2">Tier</Text>
        <TierPicker
          current={item.tier}
          onSelect={async (tier: TierLevel) => {
            if (!uid) return
            await updateItem(uid, item.id, { tier } as never)
          }}
        />

        <Text className="text-[#6B5E5E] text-sm mt-4 mb-2">Commentaire</Text>
        <CommentInput
          value={item.comment}
          onSave={async (comment) => {
            if (!uid) return
            await updateItem(uid, item.id, { comment } as never)
          }}
          onClear={async () => {
            if (!uid) return
            await updateItem(uid, item.id, { comment: deleteField() } as never)
          }}
        />
      </View>

      {/* Playlists */}
      <View className="bg-[#1C1717] border border-[#3D3535] rounded-lg p-4 mt-2">
        <Text className="text-white font-semibold mb-3">Playlists</Text>
        {playlists.map((playlist) => {
          const isIn = playlist.itemIds.includes(item.id)
          return (
            <TouchableOpacity
              key={playlist.id}
              onPress={() => uid && (isIn
                ? removeItemFromPlaylist(uid, playlist.id, item.id)
                : addItemToPlaylist(uid, playlist.id, item.id)
              )}
              className="flex-row items-center justify-between py-2 border-b border-[#2A2020]"
            >
              <Text className="text-white">{playlist.name}</Text>
              <Ionicons
                name={isIn ? 'checkmark-circle' : 'add-circle-outline'}
                size={20}
                color={isIn ? '#FBBF24' : '#6B5E5E'}
              />
            </TouchableOpacity>
          )
        })}
        {playlists.length === 0 && (
          <TouchableOpacity onPress={() => router.push('/(app)/playlists')}>
            <Text className="text-[#6B5E5E] text-sm">Créer une playlist →</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Notes des membres du cercle */}
      <MemberOpinions item={item} />

      <RecoComposer
        item={item}
        visible={showRecoComposer}
        onClose={() => setShowRecoComposer(false)}
      />
    </ScrollView>
  )
}
