import type { Timestamp } from 'firebase/firestore'

export interface Playlist {
  id: string
  name: string
  itemIds: string[]
  createdAt: Timestamp
  updatedAt?: Timestamp
}
