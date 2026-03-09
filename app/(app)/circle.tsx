import { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, ActivityIndicator, Share, ScrollView } from 'react-native'
import { doc, getDoc } from 'firebase/firestore'
import { router } from 'expo-router'
import { db } from '@/lib/firebase'
import { useAuthStore } from '@/stores/authStore'
import { createCircle, getCircle, generateInviteToken } from '@/lib/circle'
import { useCircle } from '@/hooks/useCircle'
import MemberList from '@/components/circle/MemberList'

const INVITE_BASE_URL = 'https://cinook-caf55.web.app/invite'

export default function CircleScreen() {
  const uid = useAuthStore((s) => s.uid)
  const circleId = useAuthStore((s) => s.circleId)
  const setCircle = useAuthStore((s) => s.setCircle)

  const [initLoading, setInitLoading] = useState(true)
  const [initError, setInitError] = useState<string | null>(null)
  const [inviteLink, setInviteLink] = useState<string | null>(null)

  const { members, isAdmin, adminId, loading: circleLoading } = useCircle()

  // Auto-create or load circle on first access
  useEffect(() => {
    if (!uid) return

    const init = async () => {
      try {
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
        setInitError('Impossible de charger le cercle.')
      } finally {
        setInitLoading(false)
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
      setInitError("Impossible de générer le lien.")
    }
  }

  const handleShare = async () => {
    if (!inviteLink) return
    await Share.share({ message: inviteLink })
  }

  if (initLoading || circleLoading) {
    return (
      <View className="flex-1 bg-[#0E0B0B] items-center justify-center">
        <ActivityIndicator size="large" color="#f59e0b" />
      </View>
    )
  }

  return (
    <ScrollView className="flex-1 bg-[#0E0B0B]" contentContainerStyle={{ padding: 16, paddingTop: 48 }}>
      <Text className="text-white text-2xl font-bold mb-1">Mon Cercle</Text>
      <Text className="text-[#6B5E5E] text-sm mb-6">
        {isAdmin ? 'Administratrice' : 'Membre'}
      </Text>

      {initError && <Text className="text-red-400 mb-4 text-sm">{initError}</Text>}

      {/* Liste des membres */}
      <Text className="text-white font-semibold mb-3">
        Membres ({members.length})
      </Text>
      <MemberList
        members={members}
        adminId={adminId}
        onPress={(memberId) => router.push(`/(app)/member/${memberId}` as never)}
      />

      {/* Section invitation (admin seulement) */}
      {isAdmin && (
        <View className="bg-[#1C1717] border border-[#3D3535] rounded-lg p-4 mt-4">
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
      )}
    </ScrollView>
  )
}
