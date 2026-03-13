export type DatePrecision = 'day' | 'month' | 'year'

export function formatPartialDate(date: Date, precision: DatePrecision = 'day'): string {
  if (precision === 'year') {
    return date.getFullYear().toString()
  }
  if (precision === 'month') {
    return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  }
  return date.toLocaleDateString('fr-FR')
}
