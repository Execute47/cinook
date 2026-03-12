import { useState } from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { router } from 'expo-router'
import { signOut, EmailAuthProvider, GoogleAuthProvider, reauthenticateWithCredential, reauthenticateWithPopup } from 'firebase/auth'
import { GoogleSignin } from '@react-native-google-signin/google-signin'
import { auth } from '@/lib/firebase'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'
import { useCollection } from '@/hooks/useCollection'
import { exportCollection } from '@/lib/export'
import { deleteAccount } from '@/lib/account'
import { DeleteAccountModal } from '@/components/settings/DeleteAccountModal'

export default function SettingsScreen() {
  const { items } = useCollection()
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const circleIds = useAuthStore((s) => s.circleIds)

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

      {/* Section Danger */}
      <Text className="text-[#6B5E5E] text-xs uppercase mb-3">Zone de danger</Text>
      <TouchableOpacity
        onPress={() => setShowDeleteModal(true)}
        className="bg-[#1C1717] border border-[#3D2020] rounded-lg px-4 py-4"
      >
        <Text className="text-red-500 font-semibold text-center">Supprimer mon compte</Text>
        <Text className="text-[#6B5E5E] text-xs text-center mt-1">
          Supprime définitivement votre collection et votre compte
        </Text>
      </TouchableOpacity>

      <DeleteAccountModal
        visible={showDeleteModal}
        provider={(auth.currentUser?.providerData[0]?.providerId ?? 'password') as 'password' | 'google.com'}
        onCancel={() => setShowDeleteModal(false)}
        onConfirmPassword={async (password) => {
          const user = auth.currentUser!
          const credential = EmailAuthProvider.credential(user.email!, password)
          await reauthenticateWithCredential(user, credential)
          await deleteAccount(user.uid, circleIds)
          useAuthStore.getState().reset()
          router.replace('/(auth)/login')
        }}
        onConfirmGoogle={async () => {
          const user = auth.currentUser!
          if (typeof document !== 'undefined') {
            // Web : popup de réauthentification Google
            await reauthenticateWithPopup(user, new GoogleAuthProvider())
          } else {
            // Native : réauthentification via GoogleSignin
            const { data } = await GoogleSignin.signIn()
            if (!data?.idToken) throw new Error('No idToken')
            const credential = GoogleAuthProvider.credential(data.idToken)
            await reauthenticateWithCredential(user, credential)
          }
          await deleteAccount(user.uid, circleIds)
          useAuthStore.getState().reset()
          router.replace('/(auth)/login')
        }}
      />
    </View>
  )
}
