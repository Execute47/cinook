import { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, ActivityIndicator, Share } from 'react-native'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuthStore } from '@/stores/authStore'
import { createCircle, getCircle, generateInviteToken } from '@/lib/circle'

const INVITE_BASE_URL = 'https://cinook-caf55.web.app/invite'

export default function CircleScreen() {
  const uid = useAuthStore((s) => s.uid)
  const circleId = useAuthStore((s) => s.circleId)
  const isAdmin = useAuthStore((s) => s.isAdmin)
  const setCircle = useAuthStore((s) => s.setCircle)

  const [loading, setLoading] = useState(true)
  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!uid) return

    const init = async () => {
      try {
        // Read circleId from user profile (source of truth)
        const userSnap = await getDoc(doc(db, 'users', uid))
        const storedCircleId: string | null = userSnap.data()?.circleId ?? null

        if (!storedCircleId) {
          const newCircleId = await createCircle(uid)
          setCircle(newCircleId, true)
        } else {
          const circle = await getCircle(storedCircleId)
          setCircle(storedCircleId, circle?.adminId === uid)
        }
      } catch {
        setError('Impossible de charger le cercle.')
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [uid])

  const handleGenerateLink = async () => {
    if (!circleId) return
    try {
      const token = await generateInviteToken(circleId)
      setInviteLink(`${INVITE_BASE_URL}/${token}`)
    } catch {
      setError("Impossible de générer le lien.")
    }
  }

  const handleShare = async () => {
    if (!inviteLink) return
    await Share.share({ message: inviteLink })
  }

  if (loading) {
    return (
      <View className="flex-1 bg-[#0E0B0B] items-center justify-center">
        <ActivityIndicator size="large" color="#f59e0b" />
      </View>
    )
  }

  return (
    <View className="flex-1 bg-[#0E0B0B] px-4 pt-12">
      <Text className="text-white text-2xl font-bold mb-1">Mon Cercle</Text>
      <Text className="text-[#6B5E5E] text-sm mb-6">
        {isAdmin ? 'Administratrice' : 'Membre'}
      </Text>

      {error && <Text className="text-red-400 mb-4 text-sm">{error}</Text>}

      {isAdmin ? (
        <View className="bg-[#1C1717] border border-[#3D3535] rounded-lg p-4">
          <Text className="text-white font-semibold mb-3">Inviter quelqu'un</Text>
          <TouchableOpacity
            onPress={handleGenerateLink}
            className="bg-amber-500 px-4 py-3 rounded-lg items-center mb-3"
          >
            <Text className="text-black font-semibold">Générer un lien d'invitation</Text>
          </TouchableOpacity>

          {inviteLink && (
            <View>
              <Text
                className="text-[#6B5E5E] text-xs p-3 bg-[#0E0B0B] rounded mb-2"
                selectable
              >
                {inviteLink}
              </Text>
              <TouchableOpacity
                onPress={handleShare}
                className="bg-[#3D3535] px-4 py-2 rounded-lg items-center"
              >
                <Text className="text-white text-sm">Partager</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ) : (
        <View className="bg-[#1C1717] border border-[#3D3535] rounded-lg p-4">
          <Text className="text-[#6B5E5E] text-sm text-center">
            Vous avez rejoint ce cercle en tant que membre.
          </Text>
        </View>
      )}
    </View>
  )
}
