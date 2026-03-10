import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import RecoCard from './RecoCard'
import type { Recommendation } from '@/hooks/useRecommendations'

const fakeReco: Recommendation = {
  id: 'reco-1',
  fromUserId: 'uid-alice',
  fromUserName: 'Alice',
  toUserIds: ['uid-me'],
  itemId: 'item-1',
  itemTitle: 'Matrix',
  itemPoster: null,
  createdAt: null,
}

describe('RecoCard', () => {
  it("affiche le titre et l'expéditeur", () => {
    const { getByText } = render(
      <RecoCard reco={fakeReco} onAddToWishlist={jest.fn()} />
    )
    expect(getByText('Matrix')).toBeTruthy()
    expect(getByText(/De Alice/)).toBeTruthy()
  })

  it("appelle onAddToWishlist au press sur '+ À voir'", () => {
    const onAdd = jest.fn()
    const { getByText } = render(
      <RecoCard reco={fakeReco} onAddToWishlist={onAdd} />
    )
    fireEvent.press(getByText('+ À voir'))
    expect(onAdd).toHaveBeenCalledTimes(1)
  })
})
