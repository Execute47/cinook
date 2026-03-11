import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import WatchDateModal from './WatchDateModal'
import { Timestamp } from 'firebase/firestore'

jest.mock('firebase/firestore', () => ({
  Timestamp: {
    fromDate: (d: Date) => ({ seconds: Math.floor(d.getTime() / 1000), toDate: () => d }),
  },
}))

const onValidate = jest.fn()
const onCancel = jest.fn()

beforeEach(() => jest.clearAllMocks())

describe('WatchDateModal — film', () => {
  it('bouton Valider désactivé quand "Vu le" est vide', () => {
    const { getByPlaceholderText, getByText } = render(
      <WatchDateModal visible type="film" onValidate={onValidate} onCancel={onCancel} />
    )
    fireEvent.changeText(getByPlaceholderText('jj/mm/aaaa'), '')
    fireEvent.press(getByText('Valider'))
    expect(onValidate).not.toHaveBeenCalled()
  })

  it('validation appelle onValidate avec endedAt uniquement (pas de startedAt)', () => {
    const { getByPlaceholderText, getByText } = render(
      <WatchDateModal visible type="film" onValidate={onValidate} onCancel={onCancel} />
    )
    fireEvent.changeText(getByPlaceholderText('jj/mm/aaaa'), '15/06/2024')
    fireEvent.press(getByText('Valider'))

    expect(onValidate).toHaveBeenCalledTimes(1)
    const [endedAt, startedAt] = onValidate.mock.calls[0]
    expect(endedAt).toBeDefined()
    expect(startedAt).toBeUndefined()
  })

  it('annuler appelle onCancel sans appeler onValidate', () => {
    const { getByText } = render(
      <WatchDateModal visible type="film" onValidate={onValidate} onCancel={onCancel} />
    )
    fireEvent.press(getByText('Annuler'))
    expect(onCancel).toHaveBeenCalled()
    expect(onValidate).not.toHaveBeenCalled()
  })
})

describe('WatchDateModal — série', () => {
  it('"Terminé le" valide + "Commencé le" vide → onValidate sans startedAt', () => {
    const { getAllByPlaceholderText, getByText } = render(
      <WatchDateModal visible type="serie" onValidate={onValidate} onCancel={onCancel} />
    )
    const inputs = getAllByPlaceholderText('jj/mm/aaaa')
    // inputs[0] = Commencé le, inputs[1] = Terminé le
    fireEvent.changeText(inputs[0], '')
    fireEvent.changeText(inputs[1], '20/07/2024')
    fireEvent.press(getByText('Valider'))

    expect(onValidate).toHaveBeenCalledTimes(1)
    const [endedAt, startedAt] = onValidate.mock.calls[0]
    expect(endedAt).toBeDefined()
    expect(startedAt).toBeUndefined()
  })

  it('deux dates valides → onValidate avec endedAt et startedAt', () => {
    const { getAllByPlaceholderText, getByText } = render(
      <WatchDateModal visible type="serie" onValidate={onValidate} onCancel={onCancel} />
    )
    const inputs = getAllByPlaceholderText('jj/mm/aaaa')
    fireEvent.changeText(inputs[0], '01/06/2024')
    fireEvent.changeText(inputs[1], '20/07/2024')
    fireEvent.press(getByText('Valider'))

    expect(onValidate).toHaveBeenCalledTimes(1)
    const [endedAt, startedAt] = onValidate.mock.calls[0]
    expect(endedAt).toBeDefined()
    expect(startedAt).toBeDefined()
  })

  it('affiche les champs "Commencé le" et "Terminé le"', () => {
    const { getByText } = render(
      <WatchDateModal visible type="serie" onValidate={onValidate} onCancel={onCancel} />
    )
    expect(getByText('Commencé le (optionnel)')).toBeTruthy()
    expect(getByText('Terminé le *')).toBeTruthy()
  })
})

describe('WatchDateModal — livre', () => {
  it('affiche les champs "Commencé le" et "Terminé le"', () => {
    const { getByText } = render(
      <WatchDateModal visible type="livre" onValidate={onValidate} onCancel={onCancel} />
    )
    expect(getByText('Commencé le (optionnel)')).toBeTruthy()
    expect(getByText('Terminé le *')).toBeTruthy()
  })
})
