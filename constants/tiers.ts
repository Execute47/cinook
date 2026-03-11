import type { TierLevel } from '../types/media'

export const TIER_LEVELS: Record<TierLevel, { label: string; color: string; emoji: string }> = {
  none: { label: 'Non classé', color: '#6B7280', emoji: '—' },
  disliked: { label: "Je n'ai pas aimé", color: '#EF4444', emoji: '👎' },
  bronze: { label: 'Bronze', color: '#CD7F32', emoji: '🥉' },
  silver: { label: 'Argent', color: '#C0C0C0', emoji: '🥈' },
  gold: { label: 'Or', color: '#FFD700', emoji: '🥇' },
  diamond: { label: 'Diamant', color: '#B9F2FF', emoji: '💎' },
}
