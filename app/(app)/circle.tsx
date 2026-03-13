import { useState, useEffect } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, ActivityIndicator, Share,
  ScrollView,
} from 'react-native'
import { doc, getDoc, updateDoc, deleteField } from 'firebase/firestore'
import { router } from 'expo-router'
import { db } from '@/lib/firebase'
import { useAuthStore } from '@/stores/authStore'
import {
  createCircle, getCircle, generateInviteToken, joinCircle,
  removeMember, promoteMember, leaveCircle, deleteCircle, updateCircleName,
} from '@/lib/circle'
import { useCircle } from '@/hooks/useCircle'
import { useAlert } from '@/hooks/useAlert'
import MemberList from '@/components/circle/MemberList'
import LeaveCircleModal from '@/components/circle/LeaveCircleModal'

const INVITE_BASE_URL = 'https://cinook-caf55.web.app/invite'

interface CircleSummary {
  id: string
  name: string
  adminId: string
  memberCount: number
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

  // Formulaire création
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newCircleName, setNewCircleName] = useState('')
  const [creating, setCreating] = useState(false)

  // Renommage (admin)
  const [editingName, setEditingName] = useState(false)
  const [editNameValue, setEditNameValue] = useState('')

  const { members, isAdmin, adminId, loading: circleLoading } = useCircle()
  const { confirm } = useAlert()

  const circleDisplayName = (s: CircleSummary) => s.name || 'Cercle sans nom'

  const loadSummaries = async (ids: string[]) => {
    const summaries = await Promise.all(
      ids.map(async (cid) => {
        const circle = await getCircle(cid)
        if (!circle) return null
        return {
          id: cid,
          name: circle.name ?? '',
          adminId: circle.adminId,
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

        const summaries = await loadSummaries(ids)
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
      },
      { confirmLabel: 'Expulser', destructive: true }
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
        },
        { confirmLabel: 'Quitter', destructive: true }
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
        },
        { confirmLabel: 'Supprimer', destructive: true }
      )
    } else {
      setShowLeaveModal(true)
    }
  }

  const handleCreateCircle = async () => {
    if (!uid || !newCircleName.trim()) return
    setCreating(true)
    try {
      const newCircleId = await createCircle(uid, newCircleName.trim())
      addCircleId(newCircleId)
      setCircleSummaries((prev) => [
        ...prev,
        { id: newCircleId, name: newCircleName.trim(), adminId: uid, memberCount: 1 },
      ])
      setNewCircleName('')
      setShowCreateForm(false)
      setInviteLink(null)
    } catch {
      setInitError('Impossible de créer le cercle.')
    } finally {
      setCreating(false)
    }
  }

  const handleRenameCircle = async () => {
    if (!activeCircleId || !editNameValue.trim()) return
    try {
      await updateCircleName(activeCircleId, editNameValue.trim())
      setCircleSummaries((prev) =>
        prev.map((s) =>
          s.id === activeCircleId ? { ...s, name: editNameValue.trim() } : s
        )
      )
      setEditingName(false)
    } catch {
      setInitError('Impossible de renommer le cercle.')
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
    setEditingName(false)
  }

  if (initLoading || (activeCircleId && circleLoading)) {
    return (
      <View className="flex-1 bg-[#0E0B0B] items-center justify-center">
        <ActivityIndicator size="large" color="#f59e0b" />
      </View>
    )
  }

  // Écran "aucun cercle" — formulaire de création ou message
  if (!activeCircleId) {
    return (
      <ScrollView className="flex-1 bg-[#0E0B0B]" contentContainerStyle={{ padding: 32, paddingTop: 80 }}>
        <Text className="text-white text-2xl font-bold mb-2 text-center">Mon Cercle</Text>
        <Text className="text-[#6B5E5E] text-sm mb-8 text-center">
          Vous ne faites partie d'aucun cercle.
        </Text>
        {initError && <Text className="text-red-400 mb-4 text-sm text-center">{initError}</Text>}

        {showCreateForm ? (
          <View className="bg-[#1C1717] rounded-xl p-4 mb-4">
            <Text className="text-white font-semibold mb-3">Nom du cercle</Text>
            <TextInput
              value={newCircleName}
              onChangeText={setNewCircleName}
              placeholder="Ex : Famille, Cinéphiles..."
              placeholderTextColor="#6B5E5E"
              className="bg-[#0E0B0B] text-white px-3 py-3 rounded-lg mb-3"
              autoFocus
              maxLength={40}
            />
            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => { setShowCreateForm(false); setNewCircleName('') }}
                className="flex-1 py-3 items-center border border-[#3D3535] rounded-lg"
              >
                <Text className="text-[#6B5E5E] text-sm">Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCreateCircle}
                disabled={!newCircleName.trim() || creating}
                className={`flex-1 py-3 items-center rounded-lg ${newCircleName.trim() && !creating ? 'bg-amber-500' : 'bg-[#3A2E2E]'}`}
              >
                <Text className={`font-semibold text-sm ${newCircleName.trim() && !creating ? 'text-black' : 'text-[#6B5E5E]'}`}>
                  {creating ? 'Création...' : 'Créer'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            onPress={() => setShowCreateForm(true)}
            className="bg-amber-500 py-4 rounded-xl w-full items-center mb-3"
          >
            <Text className="text-black font-bold">Créer un cercle</Text>
          </TouchableOpacity>
        )}

        <Text className="text-[#6B5E5E] text-xs text-center mt-2">
          Pour rejoindre un cercle existant, ouvrez le lien d'invitation partagé par un admin.
        </Text>
      </ScrollView>
    )
  }

  const activeCircleName = circleSummaries.find((s) => s.id === activeCircleId)?.name ?? ''
  const otherMembers = members.filter((m) => m.uid !== uid)

  return (
    <ScrollView className="flex-1 bg-[#0E0B0B]" contentContainerStyle={{ padding: 16, paddingTop: 48 }}>

      {/* Nom du cercle actif + renommage admin */}
      {editingName ? (
        <View className="flex-row items-center gap-2 mb-1">
          <TextInput
            value={editNameValue}
            onChangeText={setEditNameValue}
            className="flex-1 bg-[#1C1717] text-white text-xl font-bold px-3 py-2 rounded-lg"
            autoFocus
            maxLength={40}
          />
          <TouchableOpacity
            onPress={handleRenameCircle}
            disabled={!editNameValue.trim()}
            className="bg-amber-500 px-3 py-2 rounded-lg"
          >
            <Text className="text-black font-semibold text-sm">OK</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setEditingName(false)}
            className="px-3 py-2"
          >
            <Text className="text-[#6B5E5E] text-sm">✕</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View className="flex-row items-center gap-2 mb-1">
          <Text className="text-white text-2xl font-bold flex-1" numberOfLines={1}>
            {activeCircleName || 'Cercle sans nom'}
          </Text>
          {isAdmin && (
            <TouchableOpacity
              onPress={() => { setEditNameValue(activeCircleName); setEditingName(true) }}
              className="p-1"
            >
              <Text className="text-[#6B5E5E] text-sm">✎</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

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
                {circleDisplayName(s)}
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

      {/* Créer un nouveau cercle */}
      <View className="mt-6">
        {showCreateForm ? (
          <View className="bg-[#1C1717] rounded-xl p-4 mb-3">
            <Text className="text-white font-semibold mb-3">Nom du nouveau cercle</Text>
            <TextInput
              value={newCircleName}
              onChangeText={setNewCircleName}
              placeholder="Ex : Famille, Cinéphiles..."
              placeholderTextColor="#6B5E5E"
              className="bg-[#0E0B0B] text-white px-3 py-3 rounded-lg mb-3"
              autoFocus
              maxLength={40}
            />
            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => { setShowCreateForm(false); setNewCircleName('') }}
                className="flex-1 py-3 items-center border border-[#3D3535] rounded-lg"
              >
                <Text className="text-[#6B5E5E] text-sm">Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCreateCircle}
                disabled={!newCircleName.trim() || creating}
                className={`flex-1 py-3 items-center rounded-lg ${newCircleName.trim() && !creating ? 'bg-amber-500' : 'bg-[#3A2E2E]'}`}
              >
                <Text className={`font-semibold text-sm ${newCircleName.trim() && !creating ? 'text-black' : 'text-[#6B5E5E]'}`}>
                  {creating ? 'Création...' : 'Créer'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            onPress={() => setShowCreateForm(true)}
            className="py-3 items-center border border-[#3D3535] rounded-lg mb-3"
          >
            <Text className="text-[#6B5E5E] text-sm">+ Créer un nouveau cercle</Text>
          </TouchableOpacity>
        )}

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
