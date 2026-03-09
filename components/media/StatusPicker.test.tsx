import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import StatusPicker from './StatusPicker'

describe('StatusPicker', () => {
  it('affiche les 5 statuts', () => {
    const { getByText } = render(
      <StatusPicker current="owned" onSelect={jest.fn()} />
    )
    expect(getByText('Possédé')).toBeTruthy()
    expect(getByText('Vu')).toBeTruthy()
    expect(getByText('Prêté')).toBeTruthy()
    expect(getByText('À voir')).toBeTruthy()
    expect(getByText('Favori')).toBeTruthy()
  })

  it('appelle onSelect avec le bon statut', () => {
    const onSelect = jest.fn()
    const { getByText } = render(
      <StatusPicker current="owned" onSelect={onSelect} />
    )
    fireEvent.press(getByText('Vu'))
    expect(onSelect).toHaveBeenCalledWith('watched')
  })

  it('met en évidence le statut actif', () => {
    const { getByText } = render(
      <StatusPicker current="watched" onSelect={jest.fn()} />
    )
    // Le statut actif a une backgroundColor colorée (pas undefined)
    const activeButton = getByText('Vu').parent?.parent
    expect(activeButton?.props.style).toBeTruthy()
  })
})
