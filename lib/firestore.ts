import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
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
