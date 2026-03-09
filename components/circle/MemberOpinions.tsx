import { useState, useEffect } from 'react'
import { View, Text } from 'react-native'
import { getDocs, collection, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useCircle } from '@/hooks/useCircle'
import { useAuthStore } from '@/stores/authStore'
import { TIER_LEVELS } from '@/components/media/TierPicker'
import type { MediaItem } from '@/types/media'

interface Opinion {
  memberName: string
  rating?: number
  tier?: string
  comment?: string
}

interface Props {
  item: MediaItem
}

export default function MemberOpinions({ item }: Props) {
  const uid = useAuthStore((s) => s.uid)
  const { members } = useCircle()
  const [opinions, setOpinions] = useState<Opinion[]>([])

  // Stable key to avoid re-fetching on every render
  const memberUids = members
    .filter((m) => m.uid !== uid)
    .map((m) => m.uid)
    .sort()
    .join(',')

  useEffect(() => {
    if (!memberUids) return

    const otherMembers = members.filter((m) => m.uid !== uid)

    const load = async () => {
      const results: Opinion[] = []

      await Promise.all(
        otherMembers.map(async (member) => {
          try {
            let q
            if (item.tmdbId) {
              q = query(collection(db, 'users', member.uid, 'items'), where('tmdbId', '==', item.tmdbId))
            } else if (item.googleBooksId) {
              q = query(collection(db, 'users', member.uid, 'items'), where('googleBooksId', '==', item.googleBooksId))
            } else {
              q = query(collection(db, 'users', member.uid, 'items'), where('title', '==', item.title))
            }

            const snap = await getDocs(q)
            if (!snap.empty) {
              const data = snap.docs[0].data()
              if (data.rating != null || (data.tier && data.tier !== 'none') || data.comment) {
                results.push({
                  memberName: member.displayName ?? member.email,
                  rating: data.rating,
                  tier: data.tier,
                  comment: data.comment,
                })
              }
            }
          } catch {
            // Not accessible — skip
          }
        })
      )

      setOpinions(results)
    }

    load()
  }, [memberUids, item.id])

  if (opinions.length === 0) return null

  return (
    <View className="bg-[#1C1717] border border-[#3D3535] rounded-lg p-4 mt-2">
      <Text className="text-white font-semibold mb-3">Ce que pensent les membres</Text>
      {opinions.map((op, i) => {
        const tierInfo = TIER_LEVELS.find((t) => t.value === op.tier)
        return (
          <View key={i} className={i < opinions.length - 1 ? 'mb-3 pb-3 border-b border-[#3D3535]' : ''}>
            <Text className="text-amber-400 text-sm font-medium mb-1">{op.memberName}</Text>
            <View className="flex-row gap-3 flex-wrap">
              {op.rating != null && (
                <Text className="text-white text-sm">⭐ {op.rating}/10</Text>
              )}
              {tierInfo && op.tier !== 'none' && (
                <Text className="text-sm">
                  {tierInfo.emoji}{' '}
                  <Text style={{ color: tierInfo.color }}>{tierInfo.label}</Text>
                </Text>
              )}
            </View>
            {op.comment && (
              <Text className="text-[#9CA3AF] text-sm mt-1 italic">"{op.comment}"</Text>
            )}
          </View>
        )
      })}
    </View>
  )
}
