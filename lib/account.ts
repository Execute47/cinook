import { collection, doc, getDocs, writeBatch, deleteDoc } from 'firebase/firestore'
import { deleteUser } from 'firebase/auth'
import { db, auth } from '@/lib/firebase'
import { getCircle, leaveCircle, deleteCircle } from '@/lib/circle'

export async function deleteAllItems(uid: string): Promise<number> {
  const colRef = collection(db, 'users', uid, 'items')
  const snap = await getDocs(colRef)
  if (snap.empty) return 0
  const batch = writeBatch(db)
  snap.docs.forEach((d) => batch.delete(d.ref))
  await batch.commit()
  return snap.size
}

export async function deleteAccount(uid: string, circleIds: string[]): Promise<void> {
  await deleteAllItems(uid)

  for (const circleId of circleIds) {
    const circle = await getCircle(circleId)
    if (circle) {
      if (circle.members.length === 1) {
        await deleteCircle(circleId, uid)
      } else {
        await leaveCircle(circleId, uid)
      }
    }
  }

  await deleteDoc(doc(db, 'users', uid))
  await deleteUser(auth.currentUser!)
}
