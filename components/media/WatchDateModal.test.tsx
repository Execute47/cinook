import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import WatchDateModal from './WatchDateModal'
import { Timestamp } from 'firebase/firestore'

jest.mock('firebase/firestore', () => ({
  Timestamp: {
    fromDate: (d: Date) => ({ seconds: Math.floor(d.getTime() / 1000), toDate: () => d }),
  },
}))

jest.mock('@react-native-community/datetimepicker', () => {
  const { View } = require('react-native')
  const mock = (props: any) => <View testID="datetimepicker" />
  mock.DateTimePickerAndroid = { open: jest.fn() }
  return mock
})

const onValidate = jest.fn()
const onCancel = jest.fn()

beforeEach(() => jest.clearAllMocks())

describe('WatchDateModal — film', () => {
  it('bouton Valider est maintenant toujours activé (date optionnelle)', () => {
    const { getByText } = render(
      <WatchDateModal visible type="film" onValidate={onValidate} onCancel={onCancel} />
    )
    fireEvent.press(getByText('Valider'))
    expect(onValidate).toHaveBeenCalledTimes(1)
  })

  it('validation appelle onValidate avec endedAt et précision day par défaut', () => {
    const { getByText } = render(
      <WatchDateModal visible type="film" onValidate={onValidate} onCancel={onCancel} />
    )
    fireEvent.press(getByText('Valider'))

    expect(onValidate).toHaveBeenCalledTimes(1)
    const [endedAt, startedAt, endedAtPrecision, startedAtPrecision] = onValidate.mock.calls[0]
    expect(endedAt).toBeDefined()
    expect(startedAt).toBeUndefined()
    expect(endedAtPrecision).toBe('day')
    expect(startedAtPrecision).toBeUndefined()
  })

  it('annuler appelle onCancel sans appeler onValidate', () => {
    const { getByText } = render(
      <WatchDateModal visible type="film" onValidate={onValidate} onCancel={onCancel} />
    )
    fireEvent.press(getByText('Annuler'))
    expect(onCancel).toHaveBeenCalled()
    expect(onValidate).not.toHaveBeenCalled()
  })

  it('affiche le sélecteur de précision avec 3 options', () => {
    const { getByText } = render(
      <WatchDateModal visible type="film" onValidate={onValidate} onCancel={onCancel} />
    )
    expect(getByText('Année')).toBeTruthy()
    expect(getByText('Mois')).toBeTruthy()
    expect(getByText('Date')).toBeTruthy()
  })

  it('sélection précision Année → onValidate avec endedAtPrecision = year', () => {
    const { getByText } = render(
      <WatchDateModal visible type="film" onValidate={onValidate} onCancel={onCancel} />
    )
    fireEvent.press(getByText('Année'))
    fireEvent.press(getByText('Valider'))

    const [endedAt, , endedAtPrecision] = onValidate.mock.calls[0]
    expect(endedAt).toBeDefined()
    expect(endedAtPrecision).toBe('year')
  })

  it('sélection précision Mois → onValidate avec endedAtPrecision = month', () => {
    const { getByText } = render(
      <WatchDateModal visible type="film" onValidate={onValidate} onCancel={onCancel} />
    )
    fireEvent.press(getByText('Mois'))
    fireEvent.press(getByText('Valider'))

    const [endedAt, , endedAtPrecision] = onValidate.mock.calls[0]
    expect(endedAt).toBeDefined()
    expect(endedAtPrecision).toBe('month')
  })
})

describe('WatchDateModal — série', () => {
  it('"Terminé le" par défaut + "Commencé le" vide → onValidate sans startedAt', () => {
    const { getByText } = render(
      <WatchDateModal visible type="serie" onValidate={onValidate} onCancel={onCancel} />
    )
    fireEvent.press(getByText('Valider'))

    expect(onValidate).toHaveBeenCalledTimes(1)
    const [endedAt, startedAt] = onValidate.mock.calls[0]
    expect(endedAt).toBeDefined()
    expect(startedAt).toBeUndefined()
  })

  it('affiche les libellés corrects', () => {
    const { getByText } = render(
      <WatchDateModal visible type="serie" onValidate={onValidate} onCancel={onCancel} />
    )
    expect(getByText('Commencé le')).toBeTruthy()
    expect(getByText('Terminé le')).toBeTruthy()
  })
})

describe('WatchDateModal — initialisation avec date existante (rétro-compatibilité)', () => {
  it('initialise correctement un item existant avec date complète (précision day)', () => {
    const existingDate = new Date(2022, 5, 15)
    const initialEndedAt = {
      seconds: Math.floor(existingDate.getTime() / 1000),
      toDate: () => existingDate,
    } as unknown as Timestamp

    const { getByText } = render(
      <WatchDateModal
        visible
        type="film"
        initialEndedAt={initialEndedAt}
        onValidate={onValidate}
        onCancel={onCancel}
      />
    )

    fireEvent.press(getByText('Valider'))
    const [, , endedAtPrecision] = onValidate.mock.calls[0]
    // Sans précision initiale → day par défaut (rétro-compat)
    expect(endedAtPrecision).toBe('day')
  })

  it('conserve la précision initiale si fournie', () => {
    const existingDate = new Date(2022, 0, 1)
    const initialEndedAt = {
      seconds: Math.floor(existingDate.getTime() / 1000),
      toDate: () => existingDate,
    } as unknown as Timestamp

    const { getByText } = render(
      <WatchDateModal
        visible
        type="film"
        initialEndedAt={initialEndedAt}
        initialEndedAtPrecision="year"
        onValidate={onValidate}
        onCancel={onCancel}
      />
    )

    fireEvent.press(getByText('Valider'))
    const [, , endedAtPrecision] = onValidate.mock.calls[0]
    expect(endedAtPrecision).toBe('year')
  })
})
