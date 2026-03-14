import { useState } from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import type { Member } from '@/hooks/useCircle'

interface Props {
  member: Member
  isAdmin: boolean
  canDemote?: boolean
  onPress: (uid: string) => void
  onAdminAction?: (action: 'addAdmin' | 'demoteAdmin' | 'remove') => void
}

const getInitials = (name: string | null, email: string): string =>
  (name ?? email).charAt(0).toUpperCase()

export default function MemberCard({ member, isAdmin, canDemote, onPress, onAdminAction }: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  const initials = getInitials(member.displayName, member.email)

  return (
    <View className="bg-[#1C1717] border border-[#3D3535] rounded-lg px-4 py-3 mb-2">
      <View className="flex-row items-center">
        <TouchableOpacity
          onPress={() => onPress(member.uid)}
          className="flex-row items-center flex-1"
        >
          <View className="w-10 h-10 rounded-full bg-amber-500 items-center justify-center mr-3">
            <Text className="text-black font-bold text-sm">{initials}</Text>
          </View>
          <View className="flex-1">
            <View className="flex-row items-center gap-2">
              <Text className="text-white font-semibold">
                {member.displayName ?? member.email}
              </Text>
              {isAdmin && (
                <View className="bg-amber-500 px-2 py-0.5 rounded">
                  <Text className="text-black text-xs font-semibold">Admin</Text>
                </View>
              )}
            </View>
            {member.displayName && (
              <Text className="text-[#6B5E5E] text-sm">{member.email}</Text>
            )}
          </View>
        </TouchableOpacity>
        {onAdminAction && (
          <TouchableOpacity
            onPress={() => setMenuOpen((v) => !v)}
            className="px-2 py-1"
            accessibilityLabel="Actions admin"
          >
            <Text className="text-[#6B5E5E] text-lg">•••</Text>
          </TouchableOpacity>
        )}
      </View>
      {menuOpen && onAdminAction && (
        <View className="mt-2 border-t border-[#3D3535] pt-2 gap-1">
          {isAdmin && canDemote && (
            <TouchableOpacity
              onPress={() => { setMenuOpen(false); onAdminAction('demoteAdmin') }}
              className="py-2 px-3 rounded"
            >
              <Text className="text-orange-400 text-sm">Rétrograder</Text>
            </TouchableOpacity>
          )}
          {!isAdmin && (
            <TouchableOpacity
              onPress={() => { setMenuOpen(false); onAdminAction('addAdmin') }}
              className="py-2 px-3 rounded"
            >
              <Text className="text-amber-400 text-sm">Promouvoir admin</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => { setMenuOpen(false); onAdminAction('remove') }}
            className="py-2 px-3 rounded"
          >
            <Text className="text-red-400 text-sm">Expulser du cercle</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}
