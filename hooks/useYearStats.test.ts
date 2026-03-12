import { renderHook } from '@testing-library/react-native'

// Mock useCollection
const mockItems: any[] = []
jest.mock('@/hooks/useCollection', () => ({
  useCollection: () => ({ items: mockItems, loading: false, error: null }),
}))

import { useYearStats } from './useYearStats'

function makeTimestamp(year: number, month: number, day = 1) {
  return { toDate: () => new Date(year, month, day) }
}

beforeEach(() => {
  mockItems.length = 0
})

describe('useYearStats', () => {
  describe('AC6 — Filtrage par endedAt', () => {
    it('ignore les items sans endedAt', () => {
      mockItems.push({
        id: '1', title: 'Film A', type: 'film', tier: 'none', addedVia: 'manual',
        statuses: ['watched'],
        // pas de endedAt
      })
      const { result } = renderHook(() => useYearStats(2024))
      expect(result.current.counts.total).toBe(0)
      expect(result.current.hasData).toBe(false)
    })

    it('ignore les items avec endedAt d\'une autre année', () => {
      mockItems.push({
        id: '2', title: 'Film B', type: 'film', tier: 'none', addedVia: 'manual',
        statuses: ['watched'],
        endedAt: makeTimestamp(2023, 5),
      })
      const { result } = renderHook(() => useYearStats(2024))
      expect(result.current.counts.total).toBe(0)
    })

    it('inclut les items avec endedAt dans l\'année sélectionnée', () => {
      mockItems.push({
        id: '3', title: 'Film C', type: 'film', tier: 'none', addedVia: 'manual',
        statuses: ['watched'],
        endedAt: makeTimestamp(2024, 0),
      })
      const { result } = renderHook(() => useYearStats(2024))
      expect(result.current.counts.total).toBe(1)
      expect(result.current.hasData).toBe(true)
    })
  })

  describe('AC3 — Comptages par type', () => {
    it('compte correctement films, séries et livres', () => {
      mockItems.push(
        { id: '1', title: 'Film A', type: 'film', tier: 'none', addedVia: 'manual', statuses: ['watched'], endedAt: makeTimestamp(2024, 0) },
        { id: '2', title: 'Film B', type: 'film', tier: 'none', addedVia: 'manual', statuses: ['watched'], endedAt: makeTimestamp(2024, 1) },
        { id: '3', title: 'Série A', type: 'serie', tier: 'none', addedVia: 'manual', statuses: ['watched'], endedAt: makeTimestamp(2024, 2) },
        { id: '4', title: 'Livre A', type: 'livre', tier: 'none', addedVia: 'manual', statuses: ['watched'], endedAt: makeTimestamp(2024, 3) },
      )
      const { result } = renderHook(() => useYearStats(2024))
      expect(result.current.counts.film).toBe(2)
      expect(result.current.counts.serie).toBe(1)
      expect(result.current.counts.livre).toBe(1)
      expect(result.current.counts.total).toBe(4)
    })
  })

  describe('AC5 — byMonth / itemsByMonth', () => {
    it('incrémente l\'index 2 (mars) pour un item en mars', () => {
      mockItems.push({
        id: '1', title: 'Film A', type: 'film', tier: 'none', addedVia: 'manual',
        statuses: ['watched'],
        endedAt: makeTimestamp(2024, 2), // mars = index 2
      })
      const { result } = renderHook(() => useYearStats(2024))
      expect(result.current.byMonth[2]).toBe(1)
      expect(result.current.byMonth[0]).toBe(0)
    })

    it('retourne un tableau de 12 valeurs', () => {
      const { result } = renderHook(() => useYearStats(2024))
      expect(result.current.byMonth).toHaveLength(12)
    })

    it('itemsByMonth contient l\'item dans le bon mois', () => {
      mockItems.push({
        id: '1', title: 'Film A', type: 'film', tier: 'none', addedVia: 'manual',
        statuses: ['watched'],
        endedAt: makeTimestamp(2024, 2),
      })
      const { result } = renderHook(() => useYearStats(2024))
      expect(result.current.itemsByMonth).toHaveLength(12)
      expect(result.current.itemsByMonth[2]).toHaveLength(1)
      expect(result.current.itemsByMonth[2][0].id).toBe('1')
      expect(result.current.itemsByMonth[0]).toHaveLength(0)
    })

    it('itemsByMonth — plusieurs items dans le même mois', () => {
      mockItems.push(
        { id: '1', title: 'Film A', type: 'film', tier: 'none', addedVia: 'manual', statuses: ['watched'], endedAt: makeTimestamp(2024, 5) },
        { id: '2', title: 'Film B', type: 'film', tier: 'none', addedVia: 'manual', statuses: ['watched'], endedAt: makeTimestamp(2024, 5) },
        { id: '3', title: 'Film C', type: 'film', tier: 'none', addedVia: 'manual', statuses: ['watched'], endedAt: makeTimestamp(2024, 7) },
      )
      const { result } = renderHook(() => useYearStats(2024))
      expect(result.current.itemsByMonth[5]).toHaveLength(2)
      expect(result.current.itemsByMonth[7]).toHaveLength(1)
    })
  })

  describe('AC4 — topTier', () => {
    it('diamond avant gold', () => {
      mockItems.push(
        { id: '1', title: 'Gold Film', type: 'film', tier: 'gold', addedVia: 'manual', statuses: ['watched'], endedAt: makeTimestamp(2024, 0) },
        { id: '2', title: 'Diamond Film', type: 'film', tier: 'diamond', addedVia: 'manual', statuses: ['watched'], endedAt: makeTimestamp(2024, 1) },
      )
      const { result } = renderHook(() => useYearStats(2024))
      expect(result.current.topTier[0].tier).toBe('diamond')
    })

    it('ex-aequo → max 3 items', () => {
      for (let i = 0; i < 5; i++) {
        mockItems.push({
          id: `${i}`, title: `Diamond ${i}`, type: 'film', tier: 'diamond',
          addedVia: 'manual', statuses: ['watched'], endedAt: makeTimestamp(2024, i),
        })
      }
      const { result } = renderHook(() => useYearStats(2024))
      expect(result.current.topTier.length).toBeLessThanOrEqual(3)
    })

    it('masque topTier si aucun item n\'a de tier (only none)', () => {
      mockItems.push({
        id: '1', title: 'Film', type: 'film', tier: 'none', addedVia: 'manual',
        statuses: ['watched'], endedAt: makeTimestamp(2024, 0),
      })
      const { result } = renderHook(() => useYearStats(2024))
      expect(result.current.topTier).toHaveLength(0)
    })
  })

  describe('AC4 — topRating', () => {
    it('retourne le(s) item(s) avec la note la plus élevée', () => {
      mockItems.push(
        { id: '1', title: 'Film 3', type: 'film', tier: 'none', rating: 3, addedVia: 'manual', statuses: ['watched'], endedAt: makeTimestamp(2024, 0) },
        { id: '2', title: 'Film 5', type: 'film', tier: 'none', rating: 5, addedVia: 'manual', statuses: ['watched'], endedAt: makeTimestamp(2024, 1) },
        { id: '3', title: 'Film 4', type: 'film', tier: 'none', rating: 4, addedVia: 'manual', statuses: ['watched'], endedAt: makeTimestamp(2024, 2) },
      )
      const { result } = renderHook(() => useYearStats(2024))
      expect(result.current.topRating).toHaveLength(1)
      expect(result.current.topRating[0].rating).toBe(5)
    })

    it('ignore les items sans rating', () => {
      mockItems.push(
        { id: '1', title: 'Film sans note', type: 'film', tier: 'none', addedVia: 'manual', statuses: ['watched'], endedAt: makeTimestamp(2024, 0) },
      )
      const { result } = renderHook(() => useYearStats(2024))
      expect(result.current.topRating).toHaveLength(0)
    })

    it('ex-aequo → max 3 items', () => {
      for (let i = 0; i < 5; i++) {
        mockItems.push({
          id: `${i}`, title: `Film ${i}`, type: 'film', tier: 'none', rating: 5,
          addedVia: 'manual', statuses: ['watched'], endedAt: makeTimestamp(2024, i),
        })
      }
      const { result } = renderHook(() => useYearStats(2024))
      expect(result.current.topRating.length).toBeLessThanOrEqual(3)
    })
  })
})
