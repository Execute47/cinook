import { View, Text, TouchableOpacity } from 'react-native'
import { router } from 'expo-router'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'
import { useCollection } from '@/hooks/useCollection'
import { exportCollection } from '@/lib/export'

export default function SettingsScreen() {
  const { items } = useCollection()

  const handleSignOut = async () => {
    try {
      await signOut(auth)
      useAuthStore.getState().reset()
      router.replace('/(auth)/login')
    } catch (e) {
      console.error('Sign out error:', e)
      useUIStore.getState().addToast('Erreur lors de la déconnexion', 'error')
    }
  }

  const handleExport = async (format: 'csv' | 'json') => {
    const { setLoading, addToast } = useUIStore.getState()
    setLoading('export', true)
    try {
      await exportCollection(items, format)
      addToast('Export réussi !', 'success')
    } catch (e) {
      console.error('Export error:', e)
      addToast('Erreur lors de l\'export', 'error')
    } finally {
      setLoading('export', false)
    }
  }

  return (
    <View className="flex-1 bg-[#0E0B0B] px-6 pt-16">
      <Text className="text-amber-400 text-2xl font-bold mb-8">Paramètres</Text>

      {/* Section Export */}
      <Text className="text-[#6B5E5E] text-xs uppercase mb-3">Export</Text>
      <View className="bg-[#1C1717] rounded-lg mb-6 overflow-hidden">
        <TouchableOpacity
          onPress={() => handleExport('csv')}
          className="px-4 py-4 border-b border-[#2A2020]"
        >
          <Text className="text-white font-semibold">Exporter en CSV</Text>
          <Text className="text-[#6B5E5E] text-xs mt-0.5">Compatible tableur</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleExport('json')}
          className="px-4 py-4"
        >
          <Text className="text-white font-semibold">Exporter en JSON</Text>
          <Text className="text-[#6B5E5E] text-xs mt-0.5">Format brut complet</Text>
        </TouchableOpacity>
      </View>

      {/* Section Compte */}
      <Text className="text-[#6B5E5E] text-xs uppercase mb-3">Compte</Text>
      <TouchableOpacity
        onPress={handleSignOut}
        className="bg-[#1C1717] border border-[#3D3535] rounded-lg px-4 py-4 mb-6"
      >
        <Text className="text-red-400 font-semibold text-center">Se déconnecter</Text>
      </TouchableOpacity>

      {/* Section Danger — suppression reportée à Story 6.3 */}
      <Text className="text-[#6B5E5E] text-xs uppercase mb-3">Zone de danger</Text>
      <View className="bg-[#1C1717] border border-[#3D2020] rounded-lg px-4 py-4 opacity-50">
        <Text className="text-red-600 font-semibold text-center">Supprimer mon compte</Text>
        <Text className="text-[#6B5E5E] text-xs text-center mt-1">Disponible prochainement</Text>
      </View>
    </View>
  )
}
