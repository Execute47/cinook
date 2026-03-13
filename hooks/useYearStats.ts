import { useMemo } from 'react'
import { useCollection } from '@/hooks/useCollection'
import type { MediaItem, TierLevel } from '@/types/media'

const TIER_RANK: Record<TierLevel, number> = {
  diamond: 6,
  gold: 5,
  silver: 4,
  bronze: 3,
  seen: 2,
  disliked: 1,
  none: 0,
}

export interface YearStats {
  counts: { film: number; serie: number; livre: number; total: number }
  topTier: MediaItem[]
  topRating: MediaItem[]
  byMonth: number[]
  itemsByMonth: MediaItem[][]
  hasData: boolean
}

export function useYearStats(year: number): YearStats {
  const { items } = useCollection()

  return useMemo(() => {
    const filtered = items.filter(
      (item) => item.endedAt && item.endedAt.toDate().getFullYear() === year
    )

    const counts = { film: 0, serie: 0, livre: 0, total: filtered.length }
    filtered.forEach((item) => {
      if (item.type === 'film') counts.film++
      else if (item.type === 'serie') counts.serie++
      else if (item.type === 'livre') counts.livre++
    })

    const byMonth = Array(12).fill(0) as number[]
    const itemsByMonth: MediaItem[][] = Array.from({ length: 12 }, () => [])
    filtered.forEach((item) => {
      // Les items year-only ne sont pas attribués à un mois spécifique
      if (item.endedAtPrecision === 'year') return
      const month = item.endedAt!.toDate().getMonth()
      byMonth[month]++
      itemsByMonth[month].push(item)
    })

    // topTier — exclure tier 'none', trier par rang décroissant, max 3
    const tieredItems = filtered.filter((item) => item.tier !== 'none')
    tieredItems.sort((a, b) => TIER_RANK[b.tier] - TIER_RANK[a.tier])
    const topTierRank = tieredItems.length > 0 ? TIER_RANK[tieredItems[0].tier] : -1
    const topTier = tieredItems.filter((item) => TIER_RANK[item.tier] === topTierRank).slice(0, 3)

    // topRating — exclure sans rating, trier décroissant, max 3
    const ratedItems = filtered.filter((item) => item.rating !== undefined)
    ratedItems.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    const topRatingValue = ratedItems.length > 0 ? ratedItems[0].rating : undefined
    const topRating =
      topRatingValue !== undefined
        ? ratedItems.filter((item) => item.rating === topRatingValue).slice(0, 3)
        : []

    return {
      counts,
      topTier,
      topRating,
      byMonth,
      itemsByMonth,
      hasData: filtered.length > 0,
    }
  }, [items, year])
}
