import { collection, addDoc, updateDoc, deleteDoc, doc, arrayUnion, arrayRemove, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export async function createPlaylist(uid: string, name: string): Promise<string> {
  const ref = await addDoc(collection(db, 'users', uid, 'playlists'), {
    name, itemIds: [], createdAt: serverTimestamp(),
  })
  return ref.id
}

export async function updatePlaylist(uid: string, playlistId: string, name: string): Promise<void> {
  await updateDoc(doc(db, 'users', uid, 'playlists', playlistId), { name, updatedAt: serverTimestamp() })
}

export async function deletePlaylist(uid: string, playlistId: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, 'playlists', playlistId))
}

export async function addItemToPlaylist(uid: string, playlistId: string, itemId: string): Promise<void> {
  await updateDoc(doc(db, 'users', uid, 'playlists', playlistId), {
    itemIds: arrayUnion(itemId),
  })
}

export async function removeItemFromPlaylist(uid: string, playlistId: string, itemId: string): Promise<void> {
  await updateDoc(doc(db, 'users', uid, 'playlists', playlistId), {
    itemIds: arrayRemove(itemId),
  })
}
