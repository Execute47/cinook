import React from 'react'
import { render } from '@testing-library/react-native'
import BarcodeOverlay from './BarcodeOverlay'

describe('BarcodeOverlay', () => {
  it('affiche le texte d\'instruction', () => {
    const { getByText } = render(<BarcodeOverlay />)
    expect(getByText('Pointez la caméra vers un code-barres')).toBeTruthy()
  })
})
