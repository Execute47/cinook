import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { MediaItem } from '@/types/media'

export const addItem = async (
  uid: string,
  item: Omit<MediaItem, 'id' | 'addedAt'>
): Promise<string> => {
  const ref = await addDoc(collection(db, 'users', uid, 'items'), {
    ...item,
    addedAt: serverTimestamp(),
  })
  return ref.id
}

export const updateItem = async (
  uid: string,
  itemId: string,
  updates: Partial<Omit<MediaItem, 'id' | 'addedAt'>>
): Promise<void> => {
  await updateDoc(doc(db, 'users', uid, 'items', itemId), {
    ...updates,
    updatedAt: serverTimestamp(),
  })
}

export const deleteItem = async (uid: string, itemId: string): Promise<void> => {
  await deleteDoc(doc(db, 'users', uid, 'items', itemId))
}
