import { useState, useRef } from 'react'
import {
  View, Text, ScrollView, ActivityIndicator,
  Modal, TouchableOpacity, Image,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useAuthStore } from '@/stores/authStore'
import { useRecommendations } from '@/hooks/useRecommendations'
import type { Recommendation } from '@/hooks/useRecommendations'
import { useCineclub } from '@/hooks/useCineclub'
import { useCollection } from '@/hooks/useCollection'
import { useUIStore } from '@/stores/uiStore'
import { findDuplicate } from '@/lib/duplicates'
import { addItem } from '@/lib/firestore'
import { getMovieDirector } from '@/lib/tmdb'
import { deleteDoc, doc, updateDoc, arrayRemove } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import RecoCard from '@/components/circle/RecoCard'
import CineclubBanner from '@/components/circle/CineclubBanner'
import { NowPlayingSection } from '@/components/discovery/NowPlayingSection'
import type { MediaResult } from '@/types/api'

export default function HomeScreen() {
  const router = useRouter()
  const uid = useAuthStore((s) => s.uid)
  const circleId = useAuthStore((s) => s.activeCircleId)
  const { items } = useCollection()
  const { recommendations, loading: recoLoading } = useRecommendations()
  const { cineclubs, loading: cineclubLoading } = useCineclub()
  const { addToast } = useUIStore()
  const [duplicateMessage, setDuplicateMessage] = useState<string | null>(null)
  const duplicateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Film à l'affiche sélectionné
  const [selectedFilm, setSelectedFilm] = useState<MediaResult | null>(null)
  const [addingFilm, setAddingFilm] = useState(false)

  const handleSelectFilm = async (film: MediaResult) => {
    setSelectedFilm(film)
    if (film.tmdbId) {
      const director = await getMovieDirector(film.tmdbId)
      if (director) setSelectedFilm((prev) => prev ? { ...prev, director } : prev)
    }
  }

  const showDuplicateMessage = () => {
    if (duplicateTimerRef.current) clearTimeout(duplicateTimerRef.current)
    setDuplicateMessage('Déjà dans votre collection')
    duplicateTimerRef.current = setTimeout(() => setDuplicateMessage(null), 3000)
  }

  const handleCineclubPress = (cineclub: (typeof cineclubs)[number]) => {
    router.push({
      pathname: '/item/preview',
      params: {
        title: cineclub.itemTitle,
        type: cineclub.itemType ?? 'film',
        poster: cineclub.itemPoster ?? '',
        synopsis: cineclub.synopsis ?? '',
        year: String(cineclub.year ?? ''),
        director: cineclub.director ?? '',
        author: cineclub.author ?? '',
        tmdbId: cineclub.tmdbId ?? '',
        googleBooksId: cineclub.googleBooksId ?? '',
        isbn: cineclub.isbn ?? '',
        source: 'cineclub',
        sourceName: cineclub.postedBy,
      },
    })
  }

  const handleRecoPress = (reco: Recommendation) => {
    router.push({
      pathname: '/item/preview',
      params: {
        title: reco.itemTitle,
        type: reco.itemType ?? 'film',
        poster: reco.itemPoster ?? '',
        synopsis: reco.synopsis ?? '',
        year: String(reco.year ?? ''),
        director: reco.director ?? '',
        author: reco.author ?? '',
        tmdbId: reco.tmdbId ?? '',
        googleBooksId: reco.googleBooksId ?? '',
        isbn: reco.isbn ?? '',
        source: 'reco',
        sourceName: reco.fromUserName,
      },
    })
  }

  const handleAddRecoToWishlist = async (reco: Recommendation) => {
    if (!uid) return
    const type = reco.itemType ?? 'film'
    const duplicate = findDuplicate(items, { title: reco.itemTitle, type, tmdbId: reco.tmdbId ?? undefined, googleBooksId: reco.googleBooksId ?? undefined, isbn: reco.isbn ?? undefined })
    if (duplicate) { showDuplicateMessage(); return }
    await addItem(uid, {
      title: reco.itemTitle,
      type,
      poster: reco.itemPoster ?? undefined,
      status: 'wishlist',
      tier: 'none',
      addedVia: 'search',
    })
  }

  const handleDismissReco = async (reco: Recommendation) => {
    if (!uid || !circleId) return
    await updateDoc(doc(db, 'circles', circleId, 'recommendations', reco.id), {
      toUserIds: arrayRemove(uid),
    })
  }

  const handleAddCineclubToWishlist = async (cineclub: (typeof cineclubs)[number]) => {
    if (!uid) return
    const type = cineclub.itemType ?? 'film'
    const duplicate = findDuplicate(items, { title: cineclub.itemTitle, type, tmdbId: cineclub.tmdbId ?? undefined, googleBooksId: cineclub.googleBooksId ?? undefined, isbn: cineclub.isbn ?? undefined })
    if (duplicate) { showDuplicateMessage(); return }
    await addItem(uid, {
      title: cineclub.itemTitle,
      type,
      poster: cineclub.itemPoster ?? undefined,
      status: 'wishlist',
      tier: 'none',
      addedVia: 'discover',
    })
  }

  const handleAddFilm = async (status: 'owned' | 'wishlist') => {
    if (!uid || !selectedFilm) return
    setAddingFilm(true)
    try {
      const duplicate = findDuplicate(items, { title: selectedFilm.title, type: 'film', tmdbId: selectedFilm.tmdbId ?? undefined })
      if (duplicate) { showDuplicateMessage(); setSelectedFilm(null); return }
      await addItem(uid, {
        title: selectedFilm.title,
        type: 'film',
        poster: selectedFilm.poster,
        synopsis: selectedFilm.synopsis,
        director: selectedFilm.tmdbId ? await getMovieDirector(selectedFilm.tmdbId) : undefined,
        year: selectedFilm.year,
        tmdbId: selectedFilm.tmdbId,
        status,
        tier: 'none',
        addedVia: 'discover',
      })
      addToast(status === 'owned' ? 'Ajouté à ta collection !' : 'Ajouté à ta liste À voir !', 'success')
      setSelectedFilm(null)
    } catch {
      addToast('Erreur lors de l\'ajout', 'error')
    } finally {
      setAddingFilm(false)
    }
  }

  return (
    <ScrollView className="flex-1 bg-[#0E0B0B]" contentContainerStyle={{ padding: 16, paddingTop: 48 }}>
      <Text className="text-amber-400 text-2xl font-bold mb-6">Cinook</Text>
      {duplicateMessage && (
        <View className="bg-[#1C1717] border border-[#3D3535] rounded-lg px-4 py-2 mb-3">
          <Text className="text-[#6B5E5E] text-sm text-center">{duplicateMessage}</Text>
        </View>
      )}

      {/* Cinéclub */}
      {!cineclubLoading && cineclubs.map((cineclub) => (
        <CineclubBanner
          key={cineclub.itemId}
          cineclub={cineclub}
          onAddToWishlist={() => handleAddCineclubToWishlist(cineclub)}
          onRemove={async () => {
            if (!circleId) return
            await deleteDoc(doc(db, 'circles', circleId, 'cineclub', cineclub.itemId))
          }}
          onPress={() => handleCineclubPress(cineclub)}
        />
      ))}

      {/* Recommandations */}
      <Text className="text-white font-semibold mb-3">Recommandations reçues</Text>

      {recoLoading ? (
        <View className="items-center py-6">
          <ActivityIndicator color="#f59e0b" />
        </View>
      ) : recommendations.length === 0 ? (
        <Text className="text-[#6B5E5E] text-sm text-center py-6">
          Aucune recommandation pour l'instant
        </Text>
      ) : (
        recommendations.map((reco) => (
          <RecoCard
            key={reco.id}
            reco={reco}
            onAddToWishlist={() => handleAddRecoToWishlist(reco)}
            onPress={() => handleRecoPress(reco)}
            onDismiss={() => handleDismissReco(reco)}
          />
        ))
      )}

      {/* Films à l'affiche */}
      <NowPlayingSection onSelectFilm={handleSelectFilm} />

      {/* Modal détail film */}
      <Modal
        visible={selectedFilm !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedFilm(null)}
      >
        <View className="flex-1 justify-end bg-black/60">
          <View className="bg-[#181212] rounded-t-2xl">
            <ScrollView className="p-5" bounces={false}>
              <View className="flex-row gap-4 mb-4">
                {selectedFilm?.poster ? (
                  <Image
                    source={{ uri: selectedFilm.poster }}
                    style={{ width: 80, height: 120 }}
                    className="rounded-lg"
                    resizeMode="cover"
                  />
                ) : (
                  <View style={{ width: 80, height: 120 }} className="rounded-lg bg-[#2A2020]" />
                )}
                <View className="flex-1 justify-center">
                  <Text className="text-white text-lg font-bold mb-1" numberOfLines={3}>
                    {selectedFilm?.title}
                  </Text>
                  {selectedFilm?.year && (
                    <Text className="text-[#6B5E5E] text-sm">{selectedFilm.year}</Text>
                  )}
                  {selectedFilm?.director && (
                    <Text className="text-[#6B5E5E] text-sm">Réal. {selectedFilm.director}</Text>
                  )}
                </View>
              </View>

              {selectedFilm?.synopsis && (
                <Text className="text-[#B0A0A0] text-sm leading-5 mb-5">
                  {selectedFilm.synopsis}
                </Text>
              )}

              <TouchableOpacity
                className="bg-[#FBBF24] rounded-xl py-3 items-center mb-3"
                onPress={() => handleAddFilm('owned')}
                disabled={addingFilm}
              >
                <Text className="text-[#0E0B0B] font-bold">Ajouter à ma collection</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="bg-[#1C1717] border border-[#3A2E2E] rounded-xl py-3 items-center mb-3"
                onPress={() => handleAddFilm('wishlist')}
                disabled={addingFilm}
              >
                <Text className="text-white font-semibold">Ajouter à À voir</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="py-3 items-center"
                onPress={() => setSelectedFilm(null)}
                disabled={addingFilm}
              >
                <Text className="text-[#6B5E5E]">Fermer</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  )
}
