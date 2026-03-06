import type { MediaType } from '../types/media'

export const MEDIA_TYPES: Record<MediaType, { label: string; icon: string }> = {
  film: { label: 'Film', icon: 'film-outline' },
  serie: { label: 'Série', icon: 'tv-outline' },
  livre: { label: 'Livre', icon: 'book-outline' },
}
