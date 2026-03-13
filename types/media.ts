import type { Timestamp } from 'firebase/firestore'
import type { DatePrecision } from '@/lib/dateUtils'

export type { DatePrecision }

export type MediaType = 'film' | 'serie' | 'livre'

export type ItemStatus = 'owned' | 'watched' | 'loaned' | 'wishlist' | 'favorite'

export type TierLevel = 'none' | 'disliked' | 'bronze' | 'silver' | 'gold' | 'diamond'

export type AddedVia = 'scan' | 'search' | 'manual' | 'discover'

export interface MediaItem {
  id: string
  title: string
  type: MediaType
  poster?: string
  synopsis?: string
  director?: string
  author?: string
  year?: number
  tmdbId?: string
  googleBooksId?: string
  isbn?: string
  ean?: string
  status?: ItemStatus
  statuses: ItemStatus[]
  rating?: number
  tier: TierLevel
  comment?: string
  loanTo?: string
  loanDate?: Timestamp
  startedAt?: Timestamp
  endedAt?: Timestamp
  startedAtPrecision?: DatePrecision
  endedAtPrecision?: DatePrecision
  addedAt: Timestamp
  updatedAt?: Timestamp
  addedVia: AddedVia
}
