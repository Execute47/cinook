import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
}))

// Mock useYearStats
const mockStats = {
  counts: { film: 2, serie: 1, livre: 1, total: 4 },
  topTier: [],
  topRating: [],
  byMonth: Array(12).fill(0),
  itemsByMonth: Array.from({ length: 12 }, () => []),
  hasData: true,
}
jest.mock('@/hooks/useYearStats', () => ({
  useYearStats: jest.fn(() => mockStats),
}))

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  initializeFirestore: jest.fn(),
  persistentLocalCache: jest.fn(),
}))
jest.mock('@/lib/firebase', () => ({ db: {} }))
jest.mock('@/stores/authStore', () => ({
  useAuthStore: (selector: (s: { uid: string }) => unknown) => selector({ uid: 'uid-test' }),
}))

import StatsScreen from './stats'
import { useYearStats } from '@/hooks/useYearStats'

const currentYear = new Date().getFullYear()

beforeEach(() => jest.clearAllMocks())

describe('StatsScreen — sélecteur d\'année (AC2)', () => {
  it('affiche l\'année courante par défaut', () => {
    const { getByText } = render(<StatsScreen />)
    expect(getByText(String(currentYear))).toBeTruthy()
  })

  it('le bouton > est désactivé pour l\'année courante', () => {
    const { getByText } = render(<StatsScreen />)
    // Bouton ">" doit avoir la couleur désactivée (test que le composant ne plante pas)
    const nextBtn = getByText('>')
    expect(nextBtn).toBeTruthy()
    // Le bouton parent doit être disabled
    fireEvent.press(nextBtn)
    // L'année ne doit pas dépasser currentYear
    expect(getByText(String(currentYear))).toBeTruthy()
  })

  it('permet de naviguer vers les années précédentes', () => {
    const { getByText } = render(<StatsScreen />)
    fireEvent.press(getByText('<'))
    expect(getByText(String(currentYear - 1))).toBeTruthy()
  })

  it('recalcule les stats quand l\'année change', () => {
    const { getByText } = render(<StatsScreen />)
    fireEvent.press(getByText('<'))
    expect(useYearStats).toHaveBeenCalledWith(currentYear - 1)
  })
})

describe('StatsScreen — affichage (AC3)', () => {
  it('affiche les comptages', () => {
    const { getByText } = render(<StatsScreen />)
    expect(getByText('Films')).toBeTruthy()
    expect(getByText('Séries')).toBeTruthy()
    expect(getByText('Livres')).toBeTruthy()
    expect(getByText('4')).toBeTruthy() // total
  })

  it('affiche "Aucune activité" quand hasData est false', () => {
    ;(useYearStats as jest.Mock).mockReturnValueOnce({ ...mockStats, hasData: false, counts: { film: 0, serie: 0, livre: 0, total: 0 } })
    const { getByText } = render(<StatsScreen />)
    expect(getByText(/Aucune activité enregistrée/)).toBeTruthy()
  })
})

describe('StatsScreen — détail mensuel', () => {
  it('n\'affiche pas la liste tant qu\'aucun mois n\'est sélectionné', () => {
    const { queryByText } = render(<StatsScreen />)
    expect(queryByText(/Janvier/)).toBeNull()
  })

  it('affiche la liste du mois après tap sur une barre', () => {
    const itemsByMonth = Array.from({ length: 12 }, () => [])
    ;(itemsByMonth[0] as any[]).push({
      id: 'item-1', title: 'Film du mois', type: 'film', tier: 'gold',
      status: 'watched', addedVia: 'manual',
      endedAt: { toDate: () => new Date(2024, 0, 15) },
    })
    const byMonth = Array(12).fill(0)
    byMonth[0] = 1
    ;(useYearStats as jest.Mock).mockReturnValue({ ...mockStats, byMonth, itemsByMonth })
    const { getByText, getAllByText } = render(<StatsScreen />)
    // tap sur le premier MonthBar (J = janvier, index 0)
    fireEvent.press(getAllByText('J')[0])
    expect(getByText(/Janvier/)).toBeTruthy()
    expect(getByText('Film du mois')).toBeTruthy()
  })

  it('désélectionne le mois en retappant dessus', () => {
    const { queryByText, getAllByText } = render(<StatsScreen />)
    fireEvent.press(getAllByText('J')[0])
    fireEvent.press(getAllByText('J')[0])
    expect(queryByText(/Janvier/)).toBeNull()
  })

  it('réinitialise le mois sélectionné au changement d\'année', () => {
    const { getByText, getAllByText, queryByText } = render(<StatsScreen />)
    fireEvent.press(getAllByText('J')[0])
    expect(getByText(/Janvier/)).toBeTruthy()
    fireEvent.press(getByText('<'))
    expect(queryByText(/Janvier/)).toBeNull()
  })
})
