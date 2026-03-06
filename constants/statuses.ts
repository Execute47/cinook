import type { ItemStatus } from '../types/media'

export const STATUS_OPTIONS: Record<ItemStatus, { label: string; icon: string; color: string }> = {
  owned: { label: 'Possédé', icon: 'archive-outline', color: '#60A5FA' },
  watched: { label: 'Vu', icon: 'checkmark-circle-outline', color: '#34D399' },
  loaned: { label: 'Prêté', icon: 'arrow-redo-outline', color: '#FBBF24' },
  wishlist: { label: 'À voir', icon: 'bookmark-outline', color: '#A78BFA' },
  favorite: { label: 'Favori', icon: 'heart-outline', color: '#F87171' },
}
