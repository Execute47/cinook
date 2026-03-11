import { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, ActivityIndicator, Share, ScrollView, Alert, Platform } from 'react-native'
import { doc, getDoc } from 'firebase/firestore'
import { router } from 'expo-router'
import { db } from '@/lib/firebase'
import { useAuthStore } from '@/stores/authStore'
import {
  createCircle, getCircle, generateInviteToken, joinCircle,
  removeMember, promoteMember, leaveCircle, deleteCircle,
} from '@/lib/circle'
import { useCircle } from '@/hooks/useCircle'
import MemberList from '@/components/circle/MemberList'
import LeaveCircleModal from '@/components/circle/LeaveCircleModal'

const INVITE_BASE_URL = 'https://cinook-caf55.web.app/invite'

const confirm = (title: string, message: string, onConfirm: () => void) => {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) onConfirm()
  } else {
    Alert.alert(title, message, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Confirmer', style: 'destructive', onPress: onConfirm },
    ])
  }
}

export default function CircleScreen() {
  const uid = useAuthStore((s) => s.uid)
  const circleId = useAuthStore((s) => s.circleId)
  const setCircle = useAuthStore((s) => s.setCircle)

  const [initLoading, setInitLoading] = useState(true)
  const [initError, setInitError] = useState<string | null>(null)
  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const [showLeaveModal, setShowLeaveModal] = useState(false)

  const { members, isAdmin, adminId, loading: circleLoading } = useCircle()

  // Auto-create or load circle on first access
  useEffect(() => {
    if (!uid) return

    const init = async () => {
      try {
        const userSnap = await getDoc(doc(db, 'users', uid))
        const storedCircleId: string | null = userSnap.data()?.circleId ?? null

        if (storedCircleId) {
          useAuthStore.getState().setPendingInviteToken(null)
          const circle = await getCircle(storedCircleId)
          setCircle(storedCircleId, circle?.adminId === uid)
        } else {
          const pendingToken = useAuthStore.getState().pendingInviteToken
          if (pendingToken) {
            useAuthStore.getState().setPendingInviteToken(null)
            const joinedCircleId = await joinCircle(uid, pendingToken)
            if (joinedCircleId) {
              setCircle(joinedCircleId, false)
              return
            }
          }
          // Pas de cercle — l'utilisatrice choisit explicitement de créer ou rejoindre
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

  const handleRemoveMember = (targetUid: string) => {
    if (!circleId) return
    confirm(
      'Expulser ce membre',
      'Ce membre sera retiré du cercle.',
      async () => {
        try {
          await removeMember(circleId, targetUid)
        } catch {
          setInitError("Impossible d'expulser ce membre.")
        }
      }
    )
  }

  const handlePromoteMember = (targetUid: string) => {
    if (!circleId) return
    confirm(
      'Promouvoir en admin',
      'Cet utilisateur deviendra admin. Vous resterez membre.',
      async () => {
        try {
          await promoteMember(circleId, targetUid)
          setCircle(circleId, false)
        } catch {
          setInitError("Impossible de promouvoir ce membre.")
        }
      }
    )
  }

  const handleLeaveCircle = () => {
    if (!circleId || !uid) return

    const otherMembers = members.filter((m) => m.uid !== uid)

    if (!isAdmin) {
      // AC3 — membre simple
      confirm(
        'Quitter le cercle',
        'Vous quitterez ce cercle. Votre collection reste intacte.',
        async () => {
          try {
            await leaveCircle(circleId, uid)
            useAuthStore.getState().setCircle(null, false)
            router.replace('/(app)/circle')
          } catch {
            setInitError('Impossible de quitter le cercle.')
          }
        }
      )
    } else if (otherMembers.length === 0) {
      // AC5 — admin seul
      confirm(
        'Quitter le cercle',
        'Vous êtes seul dans ce cercle. Le quitter supprimera le cercle définitivement.',
        async () => {
          try {
            await deleteCircle(circleId, uid)
            useAuthStore.getState().setCircle(null, false)
            router.replace('/(app)/circle')
          } catch {
            setInitError('Impossible de supprimer le cercle.')
          }
        }
      )
    } else {
      // AC4 — admin avec d'autres membres → modal
      setShowLeaveModal(true)
    }
  }

  const handleCreateCircle = async () => {
    if (!uid) return
    try {
      const newCircleId = await createCircle(uid)
      setCircle(newCircleId, true)
    } catch {
      setInitError('Impossible de créer le cercle.')
    }
  }

  const handleLeaveConfirm = async (successorUid?: string) => {
    if (!circleId || !uid) return
    setShowLeaveModal(false)
    try {
      await leaveCircle(circleId, uid, successorUid)
      useAuthStore.getState().setCircle(null, false)
      router.replace('/(app)/circle')
    } catch {
      setInitError('Impossible de quitter le cercle.')
    }
  }

  if (initLoading || circleLoading) {
    return (
      <View className="flex-1 bg-[#0E0B0B] items-center justify-center">
        <ActivityIndicator size="large" color="#f59e0b" />
      </View>
    )
  }

  if (!circleId) {
    return (
      <View className="flex-1 bg-[#0E0B0B] items-center justify-center px-8">
        <Text className="text-white text-2xl font-bold mb-2 text-center">Mon Cercle</Text>
        <Text className="text-[#6B5E5E] text-sm mb-8 text-center">
          Vous ne faites partie d'aucun cercle.
        </Text>
        {initError && <Text className="text-red-400 mb-4 text-sm text-center">{initError}</Text>}
        <TouchableOpacity
          onPress={handleCreateCircle}
          className="bg-amber-500 py-4 rounded-xl w-full items-center mb-3"
        >
          <Text className="text-black font-bold">Créer un cercle</Text>
        </TouchableOpacity>
        <Text className="text-[#6B5E5E] text-xs text-center">
          Pour rejoindre un cercle existant, ouvrez le lien d'invitation partagé par un admin.
        </Text>
      </View>
    )
  }

  const otherMembers = members.filter((m) => m.uid !== uid)

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
        currentUid={uid}
        isCurrentUserAdmin={isAdmin}
        onPress={(memberId) => router.push(`/(app)/member/${memberId}` as never)}
        onAdminAction={isAdmin ? (targetUid, action) => {
          if (action === 'remove') handleRemoveMember(targetUid)
          else handlePromoteMember(targetUid)
        } : undefined}
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

      {/* Quitter le cercle */}
      <TouchableOpacity
        onPress={handleLeaveCircle}
        className="mt-6 py-3 items-center border border-red-900 rounded-lg"
      >
        <Text className="text-red-400 text-sm">Quitter le cercle</Text>
      </TouchableOpacity>

      <LeaveCircleModal
        visible={showLeaveModal}
        members={otherMembers}
        onConfirm={handleLeaveConfirm}
        onCancel={() => setShowLeaveModal(false)}
      />
    </ScrollView>
  )
}
