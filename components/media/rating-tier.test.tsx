import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import RatingWidget from './RatingWidget'
import TierPicker from './TierPicker'
import TierBadge from './TierBadge'
import CommentInput from './CommentInput'

describe('RatingWidget', () => {
  it('affiche les boutons 0 à 10', () => {
    const { getByText } = render(<RatingWidget value={null} onRate={jest.fn()} />)
    for (let i = 0; i <= 10; i++) {
      expect(getByText(String(i))).toBeTruthy()
    }
  })

  it('appelle onRate avec la valeur cliquée', () => {
    const onRate = jest.fn()
    const { getByText } = render(<RatingWidget value={null} onRate={onRate} />)
    fireEvent.press(getByText('7'))
    expect(onRate).toHaveBeenCalledWith(7)
  })

  it('appelle onRate avec null si on reclique la valeur active (toggle off)', () => {
    const onRate = jest.fn()
    const { getByText } = render(<RatingWidget value={7} onRate={onRate} />)
    fireEvent.press(getByText('7'))
    expect(onRate).toHaveBeenCalledWith(null)
  })

  it('affiche le bouton Effacer quand une note est définie', () => {
    const { getByText } = render(<RatingWidget value={5} onRate={jest.fn()} />)
    expect(getByText('✕ Effacer la note')).toBeTruthy()
  })

  it('appelle onRate(null) en cliquant Effacer', () => {
    const onRate = jest.fn()
    const { getByText } = render(<RatingWidget value={5} onRate={onRate} />)
    fireEvent.press(getByText('✕ Effacer la note'))
    expect(onRate).toHaveBeenCalledWith(null)
  })

  it("n'affiche pas le bouton Effacer quand la note est null", () => {
    const { queryByText } = render(<RatingWidget value={null} onRate={jest.fn()} />)
    expect(queryByText('✕ Effacer la note')).toBeNull()
  })
})

describe('TierPicker', () => {
  it('affiche tous les tiers sauf none', () => {
    const { getByText } = render(<TierPicker current="none" onSelect={jest.fn()} />)
    expect(getByText("J'ai pas aimé")).toBeTruthy()
    expect(getByText('Bronze')).toBeTruthy()
    expect(getByText('Argent')).toBeTruthy()
    expect(getByText('Or')).toBeTruthy()
    expect(getByText('Diamant')).toBeTruthy()
  })

  it('appelle onSelect avec le tier cliqué', () => {
    const onSelect = jest.fn()
    const { getByText } = render(<TierPicker current="none" onSelect={onSelect} />)
    fireEvent.press(getByText('Or'))
    expect(onSelect).toHaveBeenCalledWith('gold')
  })

  it("appelle onSelect avec 'none' si on reclique le tier actif (toggle off)", () => {
    const onSelect = jest.fn()
    const { getByText } = render(<TierPicker current="gold" onSelect={onSelect} />)
    fireEvent.press(getByText('Or'))
    expect(onSelect).toHaveBeenCalledWith('none')
  })
})

describe('TierBadge', () => {
  it('affiche le label et emoji pour un tier valide', () => {
    const { getByText } = render(<TierBadge tier="diamond" />)
    expect(getByText('Diamant')).toBeTruthy()
    expect(getByText('💎')).toBeTruthy()
  })

  it("retourne null pour tier 'none'", () => {
    const { toJSON } = render(<TierBadge tier="none" />)
    expect(toJSON()).toBeNull()
  })
})

describe('CommentInput', () => {
  it('affiche le texte existant', () => {
    const { getByDisplayValue } = render(
      <CommentInput value="Super film" onSave={jest.fn()} onClear={jest.fn()} />
    )
    expect(getByDisplayValue('Super film')).toBeTruthy()
  })

  it("affiche 'Enregistrer' uniquement si le texte a changé", () => {
    const { getByPlaceholderText, queryByText, getByText } = render(
      <CommentInput value="Original" onSave={jest.fn()} onClear={jest.fn()} />
    )
    expect(queryByText('Enregistrer')).toBeNull()
    fireEvent.changeText(getByPlaceholderText('Ton avis...'), 'Modifié')
    expect(getByText('Enregistrer')).toBeTruthy()
  })

  it('appelle onSave avec le texte en cliquant Enregistrer', () => {
    const onSave = jest.fn()
    const { getByPlaceholderText, getByText } = render(
      <CommentInput value="" onSave={onSave} onClear={jest.fn()} />
    )
    fireEvent.changeText(getByPlaceholderText('Ton avis...'), 'Mon commentaire')
    fireEvent.press(getByText('Enregistrer'))
    expect(onSave).toHaveBeenCalledWith('Mon commentaire')
  })

  it('appelle onClear et vide le champ en cliquant Effacer', () => {
    const onClear = jest.fn()
    const { getByText, getByDisplayValue } = render(
      <CommentInput value="À effacer" onSave={jest.fn()} onClear={onClear} />
    )
    fireEvent.press(getByText('✕ Effacer'))
    expect(onClear).toHaveBeenCalled()
    expect(getByDisplayValue('')).toBeTruthy()
  })
})
