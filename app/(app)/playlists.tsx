import { useState } from 'react'
import {
  View, Text, TouchableOpacity, FlatList,
  TextInput, Modal, Alert, Platform, ActivityIndicator,
} from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { usePlaylists } from '@/hooks/usePlaylists'
import { createPlaylist, updatePlaylist, deletePlaylist } from '@/lib/playlists'
import { useAuthStore } from '@/stores/authStore'
import type { Playlist } from '@/types/playlist'

export default function PlaylistsScreen() {
  const uid = useAuthStore((s) => s.uid)
  const { playlists, loading } = usePlaylists()

  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)

  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null)
  const [editName, setEditName] = useState('')
  const [saving, setSaving] = useState(false)

  const handleCreate = async () => {
    if (!uid || !newName.trim()) return
    setCreating(true)
    await createPlaylist(uid, newName.trim())
    setCreating(false)
    setNewName('')
    setShowCreate(false)
  }

  const handleRename = async () => {
    if (!uid || !editingPlaylist || !editName.trim()) return
    setSaving(true)
    await updatePlaylist(uid, editingPlaylist.id, editName.trim())
    setSaving(false)
    setEditingPlaylist(null)
  }

  const handleDelete = (playlist: Playlist) => {
    if (!uid) return
    const doDelete = async () => { await deletePlaylist(uid, playlist.id) }
    if (Platform.OS === 'web') {
      if (window.confirm(`Supprimer la playlist "${playlist.name}" ?`)) doDelete()
    } else {
      Alert.alert('Supprimer la playlist', `Supprimer "${playlist.name}" ?`, [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: doDelete },
      ])
    }
  }

  return (
    <View className="flex-1 bg-[#0E0B0B]">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pt-12 pb-3">
        <View className="flex-row items-center gap-2">
          <TouchableOpacity onPress={() => router.push('/(app)/collection')} className="mr-1">
            <Ionicons name="chevron-back" size={22} color="#FBBF24" />
          </TouchableOpacity>
          <Text className="text-white text-2xl font-bold">Playlists</Text>
        </View>
        <TouchableOpacity
          onPress={() => { setNewName(''); setShowCreate(true) }}
          className="bg-amber-500 px-3 py-2 rounded-lg flex-row items-center gap-1"
        >
          <Ionicons name="add" size={20} color="#000000" />
          <Text className="text-black font-semibold text-sm">Nouvelle</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#f59e0b" />
        </View>
      ) : playlists.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="list-outline" size={48} color="#3D3535" />
          <Text className="text-[#6B5E5E] text-center mt-4 mb-6">
            Tu n'as pas encore de playlist.{'\n'}Crée-en une pour organiser ta collection.
          </Text>
          <TouchableOpacity
            onPress={() => { setNewName(''); setShowCreate(true) }}
            className="bg-amber-500 px-4 py-2 rounded-lg"
          >
            <Text className="text-black font-semibold">Créer une playlist</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={playlists}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          renderItem={({ item: playlist }) => (
            <View className="flex-row items-center bg-[#1C1717] border border-[#3D3535] rounded-lg px-4 py-3 mb-2">
              <TouchableOpacity
                className="flex-1"
                onPress={() => router.push(`/(app)/playlist/${playlist.id}`)}
              >
                <Text className="text-white font-semibold">{playlist.name}</Text>
                <Text className="text-[#6B5E5E] text-xs mt-0.5">
                  {playlist.itemIds.length} item{playlist.itemIds.length !== 1 ? 's' : ''}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => { setEditName(playlist.name); setEditingPlaylist(playlist) }}
                className="px-2 py-1"
              >
                <Ionicons name="pencil-outline" size={18} color="#6B5E5E" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(playlist)} className="px-2 py-1">
                <Ionicons name="trash-outline" size={18} color="#6B5E5E" />
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      {/* Modal création */}
      <Modal visible={showCreate} transparent animationType="fade" onRequestClose={() => setShowCreate(false)}>
        <View className="flex-1 bg-black/60 justify-center px-6">
          <View className="bg-[#1C1717] rounded-xl p-6">
            <Text className="text-white font-bold text-lg mb-4">Nouvelle playlist</Text>
            <TextInput
              value={newName}
              onChangeText={setNewName}
              placeholder="Nom de la playlist"
              placeholderTextColor="#6B5E5E"
              autoFocus
              className="bg-[#0E0B0B] text-white border border-[#3D3535] rounded-lg px-4 py-3 mb-4"
            />
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setShowCreate(false)}
                className="flex-1 py-3 rounded-lg border border-[#3D3535] items-center"
              >
                <Text className="text-[#6B5E5E]">Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCreate}
                disabled={creating || !newName.trim()}
                className="flex-1 py-3 rounded-lg bg-amber-500 items-center"
              >
                <Text className="text-black font-semibold">{creating ? 'Création...' : 'Créer'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal renommage */}
      <Modal visible={!!editingPlaylist} transparent animationType="fade" onRequestClose={() => setEditingPlaylist(null)}>
        <View className="flex-1 bg-black/60 justify-center px-6">
          <View className="bg-[#1C1717] rounded-xl p-6">
            <Text className="text-white font-bold text-lg mb-4">Renommer la playlist</Text>
            <TextInput
              value={editName}
              onChangeText={setEditName}
              placeholder="Nouveau nom"
              placeholderTextColor="#6B5E5E"
              autoFocus
              className="bg-[#0E0B0B] text-white border border-[#3D3535] rounded-lg px-4 py-3 mb-4"
            />
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setEditingPlaylist(null)}
                className="flex-1 py-3 rounded-lg border border-[#3D3535] items-center"
              >
                <Text className="text-[#6B5E5E]">Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleRename}
                disabled={saving || !editName.trim()}
                className="flex-1 py-3 rounded-lg bg-amber-500 items-center"
              >
                <Text className="text-black font-semibold">{saving ? 'Enregistrement...' : 'Enregistrer'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}
