import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import type { MediaItem } from '@/types/media'

// ─── Mock firebase/firestore (Timestamp) ───────────────────────────────────
const mockTimestampFromDate = jest.fn((d: Date) => ({ toDate: () => d }))
jest.mock('firebase/firestore', () => ({
  Timestamp: { fromDate: (d: Date) => mockTimestampFromDate(d) },
  getFirestore: jest.fn(),
  deleteField: jest.fn(),
}))

jest.mock('@react-native-community/datetimepicker', () => {
  const { View } = require('react-native')
  return (props: any) => <View testID="datetimepicker" />
})

import LoanModal from './LoanModal'
import LoanList from './LoanList'

beforeEach(() => jest.clearAllMocks())

// ─── Helpers ───────────────────────────────────────────────────────────────
const makeLoanedItem = (overrides: Partial<MediaItem> = {}): MediaItem => ({
  id: 'item-1',
  title: 'Matrix',
  type: 'film',
  statuses: ['loaned'],
  tier: 'none',
  addedVia: 'manual',
  addedAt: { toDate: () => new Date() } as never,
  loanTo: 'Alice',
  loanDate: { toDate: () => new Date('2025-06-01') } as never,
  ...overrides,
})

// ─── LoanModal ─────────────────────────────────────────────────────────────
describe('LoanModal', () => {
  it('affiche les champs Prêté à et Date du prêt', () => {
    const { getByPlaceholderText, getByText } = render(
      <LoanModal visible onValidate={jest.fn()} onCancel={jest.fn()} />
    )
    expect(getByPlaceholderText("Nom de l'emprunteur")).toBeTruthy()
    expect(getByText('Date du prêt')).toBeTruthy()
  })

  it('Valider est désactivé si le nom est vide', () => {
    const onValidate = jest.fn()
    const { getByText } = render(
      <LoanModal visible onValidate={onValidate} onCancel={jest.fn()} />
    )
    fireEvent.press(getByText('Valider'))
    expect(onValidate).not.toHaveBeenCalled()
  })

  it('Valider appelle onValidate avec loanTo et un Timestamp par défaut', () => {
    const onValidate = jest.fn()
    const { getByPlaceholderText, getByText } = render(
      <LoanModal visible onValidate={onValidate} onCancel={jest.fn()} />
    )
    fireEvent.changeText(getByPlaceholderText("Nom de l'emprunteur"), 'Bob')
    fireEvent.press(getByText('Valider'))
    expect(onValidate).toHaveBeenCalledWith('Bob', expect.objectContaining({ toDate: expect.any(Function) }))
  })

  it('Annuler appelle onCancel', () => {
    const onCancel = jest.fn()
    const { getByText } = render(
      <LoanModal visible onValidate={jest.fn()} onCancel={onCancel} />
    )
    fireEvent.press(getByText('Annuler'))
    expect(onCancel).toHaveBeenCalled()
  })

  it("n'est pas rendu quand visible=false", () => {
    const { queryByPlaceholderText } = render(
      <LoanModal visible={false} onValidate={jest.fn()} onCancel={jest.fn()} />
    )
    expect(queryByPlaceholderText("Nom de l'emprunteur")).toBeNull()
  })
})

// ─── LoanList ──────────────────────────────────────────────────────────────
describe('LoanList', () => {
  it('affiche "Aucun prêt en cours" quand la liste est vide', () => {
    const { getByText } = render(<LoanList items={[]} onPress={jest.fn()} />)
    expect(getByText('Aucun prêt en cours')).toBeTruthy()
  })

  it('affiche le titre et le nom de l\'emprunteur', () => {
    const { getByText } = render(
      <LoanList items={[makeLoanedItem()]} onPress={jest.fn()} />
    )
    expect(getByText('Matrix')).toBeTruthy()
    expect(getByText('Alice')).toBeTruthy()
  })

  it('affiche la date de prêt formatée', () => {
    const { getByText } = render(
      <LoanList items={[makeLoanedItem()]} onPress={jest.fn()} />
    )
    // Date 01/06/2025 en format fr-FR
    expect(getByText('01/06/2025')).toBeTruthy()
  })

  it('affiche "—" si loanDate est absent', () => {
    const { getByText } = render(
      <LoanList items={[makeLoanedItem({ loanDate: undefined })]} onPress={jest.fn()} />
    )
    expect(getByText('—')).toBeTruthy()
  })

  it('appelle onPress avec l\'id quand on clique sur un item', () => {
    const onPress = jest.fn()
    const { getByText } = render(
      <LoanList items={[makeLoanedItem()]} onPress={onPress} />
    )
    fireEvent.press(getByText('Matrix'))
    expect(onPress).toHaveBeenCalledWith('item-1')
  })
})
