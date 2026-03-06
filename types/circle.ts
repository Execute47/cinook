import type { Timestamp } from 'firebase/firestore'

export interface Member {
  uid: string
  displayName: string
  email: string
}

export interface CircleData {
  id: string
  members: string[]
  adminId: string
  inviteToken?: string
  createdAt: Timestamp
}

export interface Recommendation {
  id: string
  fromUserId: string
  fromUserName: string
  toUserIds: string[]
  itemId: string
  itemTitle: string
  itemPoster?: string
  message?: string
  createdAt: Timestamp
}

export interface Cineclub {
  itemId: string
  itemTitle: string
  itemPoster?: string
  postedBy: string
  postedAt: Timestamp
}
