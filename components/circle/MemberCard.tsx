import { View, Text, TouchableOpacity } from 'react-native'
import type { Member } from '@/hooks/useCircle'

interface Props {
  member: Member
  isAdmin: boolean
  onPress: (uid: string) => void
}

const getInitials = (name: string | null, email: string): string =>
  (name ?? email).charAt(0).toUpperCase()

export default function MemberCard({ member, isAdmin, onPress }: Props) {
  const initials = getInitials(member.displayName, member.email)

  return (
    <TouchableOpacity
      onPress={() => onPress(member.uid)}
      className="flex-row items-center bg-[#1C1717] border border-[#3D3535] rounded-lg px-4 py-3 mb-2"
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
  )
}
