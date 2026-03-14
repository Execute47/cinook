import type { Timestamp } from 'firebase/firestore'

export interface Member {
  uid: string
  displayName: string
  email: string
}

export interface CircleData {
  id: string
  name: string
  members: string[]
  adminIds: string[]
  adminId?: string // deprecated, kept for Firestore legacy documents (retrocompat)
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

