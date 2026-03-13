import { formatPartialDate } from './dateUtils'

describe('formatPartialDate', () => {
  const date = new Date(2023, 2, 15) // 15 mars 2023

  it('formate une date complète (day) en fr-FR', () => {
    expect(formatPartialDate(date, 'day')).toBe('15/03/2023')
  })

  it('formate mois+année en fr-FR', () => {
    const result = formatPartialDate(date, 'month')
    expect(result).toMatch(/mars 2023/i)
  })

  it('formate uniquement l\'année', () => {
    expect(formatPartialDate(date, 'year')).toBe('2023')
  })

  it('utilise day par défaut si précision absente', () => {
    expect(formatPartialDate(date)).toBe('15/03/2023')
  })
})
