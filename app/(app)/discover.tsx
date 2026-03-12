import { useState, useEffect } from 'react'
import {
  View, Text, ScrollView, Modal, TouchableOpacity,
  Image, ActivityIndicator,
} from 'react-native'
import { getNowPlaying, getMovieDirector } from '@/lib/tmdb'
import { addItem } from '@/lib/firestore'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'
import { NowPlayingCard } from '@/components/discovery/NowPlayingCard'
import type { MediaResult } from '@/types/api'

export default function DiscoverScreen() {
  const uid = useAuthStore((s) => s.uid)
  const { setLoading, loading, addToast } = useUIStore()
  const [films, setFilms] = useState<MediaResult[]>([])
  const [offlineError, setOfflineError] = useState(false)
  const [selected, setSelected] = useState<MediaResult | null>(null)
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading('search', true)
    setOfflineError(false)

    getNowPlaying()
      .then((results) => {
        if (!cancelled) setFilms(results)
      })
      .catch(() => {
        if (!cancelled) setOfflineError(true)
      })
      .finally(() => {
        if (!cancelled) setLoading('search', false)
      })

    return () => { cancelled = true }
  }, [])

  async function handleAdd(status: 'owned' | 'wishlist') {
    if (!uid || !selected) return
    setAdding(true)
    try {
      const director = selected.tmdbId ? await getMovieDirector(selected.tmdbId) : undefined
      await addItem(uid, {
        title: selected.title,
        type: 'film',
        poster: selected.poster,
        synopsis: selected.synopsis,
        director,
        year: selected.year,
        tmdbId: selected.tmdbId,
        status,
        tier: 'none',
        addedVia: 'discover',
      })
      addToast(
        status === 'owned' ? 'Ajouté à ta collection !' : 'Ajouté à ta liste À voir !',
        'success'
      )
      setSelected(null)
    } catch {
      addToast('Erreur lors de l\'ajout', 'error')
    } finally {
      setAdding(false)
    }
  }

  return (
    <View className="flex-1 bg-[#0E0B0B]">
      <View className="px-4 pt-12 pb-3">
        <Text className="text-white text-2xl font-bold">Découverte</Text>
        <Text className="text-[#6B5E5E] text-sm mt-1">Films à l'affiche</Text>
      </View>

      {loading.search && (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#FBBF24" />
        </View>
      )}

      {offlineError && !loading.search && (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-[#6B5E5E] text-center text-base">
            Connexion requise pour les films à l'affiche
          </Text>
        </View>
      )}

      {!loading.search && !offlineError && (
        <ScrollView className="px-4">
          {films.map((film, i) => (
            <NowPlayingCard key={film.tmdbId ?? i} film={film} onPress={async () => {
              setSelected(film)
              if (film.tmdbId) {
                const director = await getMovieDirector(film.tmdbId)
                if (director) setSelected((prev) => prev ? { ...prev, director } : prev)
              }
            }} />
          ))}
        </ScrollView>
      )}

      {/* Modal fiche film */}
      <Modal
        visible={selected !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setSelected(null)}
      >
        <View className="flex-1 justify-end bg-black/60">
          <View className="bg-[#181212] rounded-t-2xl">
            <ScrollView className="p-5" bounces={false}>
              {/* Header fiche */}
              <View className="flex-row gap-4 mb-4">
                {selected?.poster ? (
                  <Image
                    source={{ uri: selected.poster }}
                    className="w-20 h-30 rounded-lg"
                    style={{ width: 80, height: 120 }}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={{ width: 80, height: 120 }} className="rounded-lg bg-[#2A2020]" />
                )}
                <View className="flex-1 justify-center">
                  <Text className="text-white text-lg font-bold mb-1" numberOfLines={3}>
                    {selected?.title}
                  </Text>
                  {selected?.year && (
                    <Text className="text-[#6B5E5E] text-sm">{selected.year}</Text>
                  )}
                  {selected?.director && (
                    <Text className="text-[#6B5E5E] text-sm">Réal. {selected.director}</Text>
                  )}
                </View>
              </View>

              {selected?.synopsis && (
                <Text className="text-[#B0A0A0] text-sm leading-5 mb-5">
                  {selected.synopsis}
                </Text>
              )}

              {/* Actions */}
              <TouchableOpacity
                className="bg-[#FBBF24] rounded-xl py-3 items-center mb-3"
                onPress={() => handleAdd('owned')}
                disabled={adding}
              >
                <Text className="text-[#0E0B0B] font-bold">Ajouter à ma collection</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="bg-[#1C1717] border border-[#3A2E2E] rounded-xl py-3 items-center mb-3"
                onPress={() => handleAdd('wishlist')}
                disabled={adding}
              >
                <Text className="text-white font-semibold">Ajouter à À voir</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="py-3 items-center"
                onPress={() => setSelected(null)}
                disabled={adding}
              >
                <Text className="text-[#6B5E5E]">Fermer</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  )
}
