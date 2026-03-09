import {
  addDoc, updateDoc, getDoc, getDocs,
  doc, collection, query, where, arrayUnion, serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'

const generateUUID = (): string => {
  try {
    return crypto.randomUUID()
  } catch {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
    })
  }
}

export interface Circle {
  id: string
  members: string[]
  adminId: string
  inviteToken?: string
}

export async function createCircle(uid: string): Promise<string> {
  const ref = await addDoc(collection(db, 'circles'), {
    members: [uid],
    adminId: uid,
    createdAt: serverTimestamp(),
  })
  await updateDoc(doc(db, 'users', uid), { circleId: ref.id })
  return ref.id
}

export async function getCircle(circleId: string): Promise<Circle | null> {
  const snap = await getDoc(doc(db, 'circles', circleId))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() } as Circle
}

export async function generateInviteToken(circleId: string): Promise<string> {
  const token = generateUUID()
  await updateDoc(doc(db, 'circles', circleId), { inviteToken: token })
  return token
}

export async function joinCircle(uid: string, token: string): Promise<string | null> {
  const q = query(collection(db, 'circles'), where('inviteToken', '==', token))
  const snap = await getDocs(q)
  if (snap.empty) return null
  const circleDoc = snap.docs[0]
  await updateDoc(doc(db, 'circles', circleDoc.id), { members: arrayUnion(uid) })
  await updateDoc(doc(db, 'users', uid), { circleId: circleDoc.id })
  return circleDoc.id
}
