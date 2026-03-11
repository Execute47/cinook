import { useState } from 'react'
import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native'
import type { Member } from '@/hooks/useCircle'

interface Props {
  visible: boolean
  members: Member[]
  onConfirm: (successorUid?: string) => void
  onCancel: () => void
}

const getInitials = (name: string | null, email: string): string =>
  (name ?? email).charAt(0).toUpperCase()

export default function LeaveCircleModal({ visible, members, onConfirm, onCancel }: Props) {
  const [selectedUid, setSelectedUid] = useState<string | null>(null)

  const handleCancel = () => {
    setSelectedUid(null)
    onCancel()
  }

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View
        className="flex-1 justify-center items-center px-6"
        style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
      >
        <View className="bg-[#1C1717] border border-[#3D3535] rounded-xl p-6 w-full">
          <Text className="text-white text-lg font-bold mb-2">Quitter le cercle</Text>
          <Text className="text-[#6B5E5E] text-sm mb-4">
            Choisissez un successeur ou confirmez sans choisir (le membre le plus ancien sera désigné).
          </Text>

          <ScrollView style={{ maxHeight: 200 }} className="mb-4">
            {members.map((m) => {
              const selected = selectedUid === m.uid
              return (
                <TouchableOpacity
                  key={m.uid}
                  onPress={() => setSelectedUid(selected ? null : m.uid)}
                  className={`flex-row items-center px-3 py-2 rounded-lg mb-1 border ${
                    selected ? 'border-amber-500 bg-[#2A2020]' : 'border-[#3D3535]'
                  }`}
                >
                  <View className="w-8 h-8 rounded-full bg-amber-500 items-center justify-center mr-3">
                    <Text className="text-black font-bold text-xs">
                      {getInitials(m.displayName, m.email)}
                    </Text>
                  </View>
                  <Text className="text-white text-sm flex-1">
                    {m.displayName ?? m.email}
                  </Text>
                  {selected && <Text className="text-amber-500 text-sm">✓</Text>}
                </TouchableOpacity>
              )
            })}
          </ScrollView>

          <View className="gap-2">
            <TouchableOpacity
              onPress={() => { setSelectedUid(null); onConfirm(selectedUid ?? undefined) }}
              className="bg-amber-500 py-3 rounded-lg items-center"
            >
              <Text className="text-black font-semibold">
                {selectedUid ? 'Confirmer avec ce successeur' : 'Confirmer sans choisir'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleCancel} className="py-2 items-center">
              <Text className="text-[#6B5E5E]">Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}
