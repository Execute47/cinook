import { FlatList } from 'react-native'
import MemberCard from './MemberCard'
import type { Member } from '@/hooks/useCircle'

interface Props {
  members: Member[]
  adminIds: string[]
  currentUid?: string | null
  isCurrentUserAdmin?: boolean
  onPress: (uid: string) => void
  onAdminAction?: (targetUid: string, action: 'addAdmin' | 'demoteAdmin' | 'remove') => void
}

export default function MemberList({
  members, adminIds, currentUid, isCurrentUserAdmin, onPress, onAdminAction,
}: Props) {
  const canDemote = adminIds.length > 1

  return (
    <FlatList
      data={members}
      keyExtractor={(m) => m.uid}
      scrollEnabled={false}
      renderItem={({ item }) => (
        <MemberCard
          member={item}
          isAdmin={adminIds.includes(item.uid)}
          canDemote={canDemote}
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
