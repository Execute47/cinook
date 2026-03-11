import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native'
import type { MediaResult } from '@/types/api'

interface NowPlayingCardProps {
  film: MediaResult
  onPress: () => void
}

function formatReleaseDate(dateStr?: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function NowPlayingCard({ film, onPress }: NowPlayingCardProps) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.8}>
      {film.poster ? (
        <Image source={{ uri: film.poster }} style={styles.poster} resizeMode="cover" />
      ) : (
        <View style={styles.posterPlaceholder} />
      )}
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>{film.title}</Text>
        {film.releaseDate && (
          <Text style={styles.date}>{formatReleaseDate(film.releaseDate)}</Text>
        )}
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1717',
    borderRadius: 8,
    marginBottom: 10,
    overflow: 'hidden',
  },
  poster: {
    width: 60,
    height: 90,
  },
  posterPlaceholder: {
    width: 60,
    height: 90,
    backgroundColor: '#2A2020',
  },
  info: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  title: {
    color: '#F5F0F0',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  date: {
    color: '#6B5E5E',
    fontSize: 12,
  },
})
