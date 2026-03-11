import { useState, useEffect } from 'react'
import {
  View, Text, TouchableOpacity, ActivityIndicator, Share,
  ScrollView, Alert, Platform,
} from 'react-native'
import { doc, getDoc, updateDoc, deleteField } from 'firebase/firestore'
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

interface CircleSummary {
  id: string
  adminId: string
  adminName: string | null
  memberCount: number
}

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
  const circleIds = useAuthStore((s) => s.circleIds)
  const activeCircleId = useAuthStore((s) => s.activeCircleId)
  const setCircleIds = useAuthStore((s) => s.setCircleIds)
  const setActiveCircle = useAuthStore((s) => s.setActiveCircle)
  const addCircleId = useAuthStore((s) => s.addCircleId)
  const removeCircleId = useAuthStore((s) => s.removeCircleId)

  const [initLoading, setInitLoading] = useState(true)
  const [initError, setInitError] = useState<string | null>(null)
  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const [showLeaveModal, setShowLeaveModal] = useState(false)
  const [circleSummaries, setCircleSummaries] = useState<CircleSummary[]>([])

  const { members, isAdmin, adminId, loading: circleLoading } = useCircle()

  const loadSummaries = async (ids: string[], currentUid: string) => {
    const summaries = await Promise.all(
      ids.map(async (cid) => {
        const circle = await getCircle(cid)
        if (!circle) return null
        const adminSnap = await getDoc(doc(db, 'users', circle.adminId))
        return {
          id: cid,
          adminId: circle.adminId,
          adminName: adminSnap.data()?.displayName ?? null,
          memberCount: circle.members.length,
        } as CircleSummary
      })
    )
    return summaries.filter(Boolean) as CircleSummary[]
  }

  useEffect(() => {
    if (!uid) return

    const init = async () => {
      try {
        const userSnap = await getDoc(doc(db, 'users', uid))
        const userData = userSnap.data()

        // Migration : ancien champ circleId → nouveau circleIds[]
        let ids: string[] = userData?.circleIds ?? []
        if (ids.length === 0 && userData?.circleId) {
          ids = [userData.circleId]
          await updateDoc(doc(db, 'users', uid), {
            circleIds: [userData.circleId],
            circleId: deleteField(),
          })
        }

        // Traiter le token d'invitation en attente
        const pendingToken = useAuthStore.getState().pendingInviteToken
        if (pendingToken) {
          useAuthStore.getState().setPendingInviteToken(null)
          const joinedId = await joinCircle(uid, pendingToken)
          if (joinedId && !ids.includes(joinedId)) {
            ids = [...ids, joinedId]
          }
        }

        setCircleIds(ids)

        const summaries = await loadSummaries(ids, uid)
        setCircleSummaries(summaries)

        if (!useAuthStore.getState().activeCircleId && ids.length > 0) {
          setActiveCircle(ids[0])
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
    if (!activeCircleId) return
    try {
      const token = await generateInviteToken(activeCircleId)
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
    if (!activeCircleId) return
    confirm(
      'Expulser ce membre',
      'Ce membre sera retiré du cercle.',
      async () => {
        try {
          await removeMember(activeCircleId, targetUid)
          setCircleSummaries((prev) =>
            prev.map((s) =>
              s.id === activeCircleId ? { ...s, memberCount: s.memberCount - 1 } : s
            )
          )
        } catch {
          setInitError("Impossible d'expulser ce membre.")
        }
      }
    )
  }

  const handlePromoteMember = (targetUid: string) => {
    if (!activeCircleId) return
    confirm(
      'Promouvoir en admin',
      'Cet utilisateur deviendra admin. Vous resterez membre.',
      async () => {
        try {
          await promoteMember(activeCircleId, targetUid)
          setCircleSummaries((prev) =>
            prev.map((s) =>
              s.id === activeCircleId ? { ...s, adminId: targetUid } : s
            )
          )
        } catch {
          setInitError("Impossible de promouvoir ce membre.")
        }
      }
    )
  }

  const handleLeaveCircle = () => {
    if (!activeCircleId || !uid) return

    const otherMembers = members.filter((m) => m.uid !== uid)

    if (!isAdmin) {
      confirm(
        'Quitter le cercle',
        'Vous quitterez ce cercle. Votre collection reste intacte.',
        async () => {
          try {
            await leaveCircle(activeCircleId, uid)
            removeCircleId(activeCircleId)
            setCircleSummaries((prev) => prev.filter((s) => s.id !== activeCircleId))
            setInviteLink(null)
          } catch {
            setInitError('Impossible de quitter le cercle.')
          }
        }
      )
    } else if (otherMembers.length === 0) {
      confirm(
        'Quitter le cercle',
        'Vous êtes seul dans ce cercle. Le quitter supprimera le cercle définitivement.',
        async () => {
          try {
            await deleteCircle(activeCircleId, uid)
            removeCircleId(activeCircleId)
            setCircleSummaries((prev) => prev.filter((s) => s.id !== activeCircleId))
            setInviteLink(null)
          } catch {
            setInitError('Impossible de supprimer le cercle.')
          }
        }
      )
    } else {
      setShowLeaveModal(true)
    }
  }

  const handleCreateCircle = async () => {
    if (!uid) return
    try {
      const newCircleId = await createCircle(uid)
      addCircleId(newCircleId)
      const adminSnap = await getDoc(doc(db, 'users', uid))
      setCircleSummaries((prev) => [
        ...prev,
        {
          id: newCircleId,
          adminId: uid,
          adminName: adminSnap.data()?.displayName ?? null,
          memberCount: 1,
        },
      ])
      setInviteLink(null)
    } catch {
      setInitError('Impossible de créer le cercle.')
    }
  }

  const handleLeaveConfirm = async (successorUid?: string) => {
    if (!activeCircleId || !uid) return
    setShowLeaveModal(false)
    try {
      await leaveCircle(activeCircleId, uid, successorUid)
      removeCircleId(activeCircleId)
      setCircleSummaries((prev) => prev.filter((s) => s.id !== activeCircleId))
      setInviteLink(null)
    } catch {
      setInitError('Impossible de quitter le cercle.')
    }
  }

  const handleSwitchCircle = (circleId: string) => {
    setActiveCircle(circleId)
    setInviteLink(null)
  }

  if (initLoading || (activeCircleId && circleLoading)) {
    return (
      <View className="flex-1 bg-[#0E0B0B] items-center justify-center">
        <ActivityIndicator size="large" color="#f59e0b" />
      </View>
    )
  }

  if (!activeCircleId) {
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
  const activeCircleLabel = (id: string) => {
    const s = circleSummaries.find((s) => s.id === id)
    if (!s) return 'Cercle'
    return s.adminId === uid ? 'Mon cercle' : `Cercle de ${s.adminName ?? 'inconnu'}`
  }

  return (
    <ScrollView className="flex-1 bg-[#0E0B0B]" contentContainerStyle={{ padding: 16, paddingTop: 48 }}>
      <Text className="text-white text-2xl font-bold mb-1">Mes Cercles</Text>
      <Text className="text-[#6B5E5E] text-sm mb-4">
        {isAdmin ? 'Administratrice' : 'Membre'}
      </Text>

      {/* Switcher de cercles */}
      {circleIds.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4" contentContainerStyle={{ gap: 8 }}>
          {circleSummaries.map((s) => (
            <TouchableOpacity
              key={s.id}
              onPress={() => handleSwitchCircle(s.id)}
              className={`px-3 py-2 rounded-full border ${
                activeCircleId === s.id ? 'bg-amber-500 border-amber-500' : 'border-[#3D3535]'
              }`}
            >
              <Text
                className={`text-sm ${activeCircleId === s.id ? 'text-black font-semibold' : 'text-[#6B5E5E]'}`}
              >
                {activeCircleLabel(s.id)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

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

      {/* Actions */}
      <View className="mt-6 gap-3">
        <TouchableOpacity
          onPress={handleCreateCircle}
          className="py-3 items-center border border-[#3D3535] rounded-lg"
        >
          <Text className="text-[#6B5E5E] text-sm">+ Créer un nouveau cercle</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleLeaveCircle}
          className="py-3 items-center border border-red-900 rounded-lg"
        >
          <Text className="text-red-400 text-sm">Quitter ce cercle</Text>
        </TouchableOpacity>
      </View>

      <LeaveCircleModal
        visible={showLeaveModal}
        members={otherMembers}
        onConfirm={handleLeaveConfirm}
        onCancel={() => setShowLeaveModal(false)}
      />
    </ScrollView>
  )
}
