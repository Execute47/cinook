import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, Modal, ActivityIndicator } from 'react-native'

interface Props {
  visible: boolean
  onCancel: () => void
  onConfirm: (password: string) => Promise<void>
}

export function DeleteAccountModal({ visible, onCancel, onConfirm }: Props) {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConfirm = async () => {
    setError(null)
    setLoading(true)
    try {
      await onConfirm(password)
    } catch (e: unknown) {
      const err = e as { code?: string }
      if (err.code === 'auth/requires-recent-login') {
        setError('Veuillez vous reconnecter avant de supprimer votre compte.')
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Mot de passe incorrect.')
      } else {
        setError('Une erreur est survenue. Réessayez.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setPassword('')
    setError(null)
    onCancel()
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleCancel}>
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.7)',
          justifyContent: 'center',
          paddingHorizontal: 24,
        }}
      >
        <View style={{ backgroundColor: '#1C1717', borderRadius: 12, padding: 24 }}>
          <Text style={{ color: '#F5F0F0', fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>
            Supprimer mon compte
          </Text>
          <Text style={{ color: '#9B8E8E', fontSize: 14, marginBottom: 20 }}>
            Cette action est irréversible. Toute votre collection sera définitivement supprimée.
            Confirmez avec votre mot de passe.
          </Text>

          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Mot de passe"
            placeholderTextColor="#6B5E5E"
            secureTextEntry
            style={{
              backgroundColor: '#0E0B0B',
              color: '#F5F0F0',
              borderRadius: 8,
              paddingHorizontal: 14,
              paddingVertical: 10,
              fontSize: 14,
              marginBottom: 12,
            }}
          />

          {error && (
            <Text style={{ color: '#ef4444', fontSize: 12, marginBottom: 12 }}>{error}</Text>
          )}

          <TouchableOpacity
            onPress={handleConfirm}
            disabled={loading || password.length === 0}
            style={{
              backgroundColor: '#7F1D1D',
              borderRadius: 8,
              paddingVertical: 12,
              alignItems: 'center',
              marginBottom: 10,
              opacity: loading || password.length === 0 ? 0.5 : 1,
            }}
          >
            {loading ? (
              <ActivityIndicator color="#F5F0F0" />
            ) : (
              <Text style={{ color: '#F5F0F0', fontWeight: 'bold' }}>
                Supprimer définitivement
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleCancel}
            style={{ alignItems: 'center', paddingVertical: 10 }}
          >
            <Text style={{ color: '#9B8E8E' }}>Annuler</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}
