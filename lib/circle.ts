import {
  addDoc, updateDoc, deleteDoc, getDoc, getDocs,
  doc, collection, query, where, arrayUnion, arrayRemove, serverTimestamp,
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
  await updateDoc(doc(db, 'users', uid), { circleIds: arrayUnion(ref.id) })
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

export async function removeMember(circleId: string, targetUid: string): Promise<void> {
  await updateDoc(doc(db, 'circles', circleId), { members: arrayRemove(targetUid) })
  await updateDoc(doc(db, 'users', targetUid), { circleIds: arrayRemove(circleId) })
}

export async function promoteMember(circleId: string, newAdminUid: string): Promise<void> {
  await updateDoc(doc(db, 'circles', circleId), { adminId: newAdminUid })
}

export async function leaveCircle(circleId: string, uid: string, successorUid?: string): Promise<void> {
  const circle = await getCircle(circleId)
  if (!circle) return
  if (circle.adminId === uid) {
    const successor = successorUid ?? circle.members.find(m => m !== uid)
    if (!successor) throw new Error('Aucun successeur disponible')
    await promoteMember(circleId, successor)
  }
  await updateDoc(doc(db, 'circles', circleId), { members: arrayRemove(uid) })
  await updateDoc(doc(db, 'users', uid), { circleIds: arrayRemove(circleId) })
}

export async function deleteCircle(circleId: string, uid: string): Promise<void> {
  const circle = await getCircle(circleId)
  if (circle) {
    await Promise.all(
      circle.members.map((memberId) =>
        updateDoc(doc(db, 'users', memberId), { circleIds: arrayRemove(circleId) })
      )
    )
  }
  await deleteDoc(doc(db, 'circles', circleId))
}

export async function joinCircle(uid: string, token: string): Promise<string | null> {
  const q = query(collection(db, 'circles'), where('inviteToken', '==', token))
  const snap = await getDocs(q)
  if (snap.empty) return null
  const circleDoc = snap.docs[0]
  if ((circleDoc.data().members as string[]).includes(uid)) return circleDoc.id
  await updateDoc(doc(db, 'circles', circleDoc.id), { members: arrayUnion(uid) })
  await updateDoc(doc(db, 'users', uid), { circleIds: arrayUnion(circleDoc.id) })
  return circleDoc.id
}
