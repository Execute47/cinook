import { useState, useEffect } from 'react'
import { View, Text, ScrollView, ActivityIndicator, Platform } from 'react-native'
import { getNowPlaying } from '@/lib/tmdb'
import { NowPlayingCard } from '@/components/discovery/NowPlayingCard'
import type { MediaResult } from '@/types/api'

interface Props {
  onSelectFilm: (film: MediaResult) => void
}

export function NowPlayingSection({ onSelectFilm }: Props) {
  const [films, setFilms] = useState<MediaResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    getNowPlaying()
      .then((results) => { if (!cancelled) setFilms(results) })
      .catch(() => { if (!cancelled) setError(true) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  return (
    <View className="mb-6">
      <Text className="text-white font-semibold mb-3">Films à l'affiche</Text>
      {loading && <ActivityIndicator color="#f59e0b" />}
      {error && !loading && (
        <Text className="text-[#6B5E5E] text-sm">Connexion requise</Text>
      )}
      {!loading && !error && (
        Platform.OS === 'web' ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {films.map((film) => (
              <NowPlayingCard
                key={String(film.tmdbId ?? film.title)}
                film={film}
                onPress={() => onSelectFilm(film)}
                compact
              />
            ))}
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 10 }}
          >
            {films.map((film) => (
              <NowPlayingCard
                key={String(film.tmdbId ?? film.title)}
                film={film}
                onPress={() => onSelectFilm(film)}
                compact
              />
            ))}
          </ScrollView>
        )
      )}
    </View>
  )
}
