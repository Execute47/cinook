import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import CineclubBanner from './CineclubBanner'
import type { Cineclub } from '@/hooks/useCineclub'

const fakeCineclub: Cineclub = {
  itemId: 'item-1', itemTitle: 'Matrix', itemPoster: null,
  itemType: 'film', postedBy: 'Alice', postedAt: null,
}

const fakeLivreCineclub: Cineclub = {
  itemId: 'item-2', itemTitle: 'Dune', itemPoster: null,
  itemType: 'livre', postedBy: 'Bob', postedAt: null,
}

describe('CineclubBanner', () => {
  it('affiche le titre et le nom de la personne qui a mis en avant', () => {
    const { getByText } = render(
      <CineclubBanner cineclub={fakeCineclub} onAddToWishlist={jest.fn()} onRemove={jest.fn()} />
    )
    expect(getByText('Matrix')).toBeTruthy()
    expect(getByText(/Mis en avant par Alice/)).toBeTruthy()
  })

  it("appelle onAddToWishlist au press sur '+ À voir'", () => {
    const onAdd = jest.fn()
    const { getByText } = render(
      <CineclubBanner cineclub={fakeCineclub} onAddToWishlist={onAdd} onRemove={jest.fn()} />
    )
    fireEvent.press(getByText('+ À voir'))
    expect(onAdd).toHaveBeenCalledTimes(1)
  })

  it('affiche "⭐ Cinéclub" pour un film', () => {
    const { getByText } = render(
      <CineclubBanner cineclub={fakeCineclub} onAddToWishlist={jest.fn()} onRemove={jest.fn()} />
    )
    expect(getByText('⭐ Cinéclub')).toBeTruthy()
  })

  it('affiche "⭐ Coin lecture" pour un livre', () => {
    const { getByText } = render(
      <CineclubBanner cineclub={fakeLivreCineclub} onAddToWishlist={jest.fn()} onRemove={jest.fn()} />
    )
    expect(getByText('⭐ Coin lecture')).toBeTruthy()
  })

  it('appelle onRemove au press sur "Retirer"', () => {
    const onRemove = jest.fn()
    const { getByText } = render(
      <CineclubBanner cineclub={fakeCineclub} onAddToWishlist={jest.fn()} onRemove={onRemove} />
    )
    fireEvent.press(getByText('Retirer'))
    expect(onRemove).toHaveBeenCalledTimes(1)
  })

  it('appelle onPress au tap sur le titre', () => {
    const onPress = jest.fn()
    const { getByText } = render(
      <CineclubBanner cineclub={fakeCineclub} onAddToWishlist={jest.fn()} onRemove={jest.fn()} onPress={onPress} />
    )
    fireEvent.press(getByText('Matrix'))
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it("n'appelle pas onPress au tap sur '+ À voir'", () => {
    const onPress = jest.fn()
    const onAdd = jest.fn()
    const { getByText } = render(
      <CineclubBanner cineclub={fakeCineclub} onAddToWishlist={onAdd} onRemove={jest.fn()} onPress={onPress} />
    )
    fireEvent.press(getByText('+ À voir'))
    expect(onAdd).toHaveBeenCalledTimes(1)
    expect(onPress).not.toHaveBeenCalled()
  })
})
