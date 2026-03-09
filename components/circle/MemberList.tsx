import { FlatList } from 'react-native'
import MemberCard from './MemberCard'
import type { Member } from '@/hooks/useCircle'

interface Props {
  members: Member[]
  adminId: string | null
  onPress: (uid: string) => void
}

export default function MemberList({ members, adminId, onPress }: Props) {
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
        />
      )}
    />
  )
}
