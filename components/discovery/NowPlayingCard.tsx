import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native'
import type { MediaResult } from '@/types/api'

interface NowPlayingCardProps {
  film: MediaResult
  onPress: () => void
  compact?: boolean
}

function formatReleaseDate(dateStr?: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

const COMPACT_WIDTH = 110

export function NowPlayingCard({ film, onPress, compact = false }: NowPlayingCardProps) {
  if (compact) {
    return (
      <TouchableOpacity
        style={styles.compactContainer}
        onPress={onPress}
        activeOpacity={0.8}
      >
        {film.poster ? (
          <Image source={{ uri: film.poster }} style={styles.compactPoster} resizeMode="cover" />
        ) : (
          <View style={styles.compactPosterPlaceholder} />
        )}
        <View style={styles.compactInfo}>
          <Text style={styles.compactTitle} numberOfLines={2}>{film.title}</Text>
          {film.releaseDate && (
            <Text style={styles.compactDate} numberOfLines={1}>
              {formatReleaseDate(film.releaseDate)}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    )
  }

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
  // Layout liste (discover.tsx)
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
  // Layout compact (NowPlayingSection — scroll horizontal)
  compactContainer: {
    width: COMPACT_WIDTH,
    backgroundColor: '#1C1717',
    borderRadius: 8,
    overflow: 'hidden',
  },
  compactPoster: {
    width: COMPACT_WIDTH,
    height: 160,
  },
  compactPosterPlaceholder: {
    width: COMPACT_WIDTH,
    height: 160,
    backgroundColor: '#2A2020',
  },
  compactInfo: {
    padding: 8,
  },
  compactTitle: {
    color: '#F5F0F0',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  compactDate: {
    color: '#6B5E5E',
    fontSize: 10,
  },
})
