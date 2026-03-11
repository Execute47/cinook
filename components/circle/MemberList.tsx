import { FlatList } from 'react-native'
import MemberCard from './MemberCard'
import type { Member } from '@/hooks/useCircle'

interface Props {
  members: Member[]
  adminId: string | null
  currentUid?: string | null
  isCurrentUserAdmin?: boolean
  onPress: (uid: string) => void
  onAdminAction?: (targetUid: string, action: 'remove' | 'promote') => void
}

export default function MemberList({
  members, adminId, currentUid, isCurrentUserAdmin, onPress, onAdminAction,
}: Props) {
  return (
    <FlatList
      data={members}
      keyExtractor={(m) => m.uid}
      scrollEnabled={false}
      renderItem={({ item }) => (
        <MemberCard
          member={item}
          isAdmin={item.uid === adminId}
          onPress={onPress}
          onAdminAction={
            isCurrentUserAdmin && item.uid !== currentUid
              ? (action) => onAdminAction?.(item.uid, action)
              : undefined
          }
        />
      )}
    />
  )
}
