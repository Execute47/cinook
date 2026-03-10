import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import CineclubBanner from './CineclubBanner'
import type { Cineclub } from '@/hooks/useCineclub'

const fakeCineclub: Cineclub = {
  itemId: 'item-1',
  itemTitle: 'Matrix',
  itemPoster: null,
  postedBy: 'Alice',
  postedAt: null,
}

describe('CineclubBanner', () => {
  it('affiche le titre et le nom de la personne qui a mis en avant', () => {
    const { getByText } = render(
      <CineclubBanner cineclub={fakeCineclub} onAddToWishlist={jest.fn()} />
    )
    expect(getByText('Matrix')).toBeTruthy()
    expect(getByText(/Mis en avant par Alice/)).toBeTruthy()
  })

  it("appelle onAddToWishlist au press sur '+ À voir'", () => {
    const onAdd = jest.fn()
    const { getByText } = render(
      <CineclubBanner cineclub={fakeCineclub} onAddToWishlist={onAdd} />
    )
    fireEvent.press(getByText('+ À voir'))
    expect(onAdd).toHaveBeenCalledTimes(1)
  })
})
