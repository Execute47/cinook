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

  it('appelle onPress au tap sur le titre', () => {
    const onPress = jest.fn()
    const { getByText } = render(
      <RecoCard reco={fakeReco} onAddToWishlist={jest.fn()} onPress={onPress} />
    )
    fireEvent.press(getByText('Matrix'))
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it("n'appelle pas onPress au tap sur '+ À voir'", () => {
    const onPress = jest.fn()
    const onAdd = jest.fn()
    const { getByText } = render(
      <RecoCard reco={fakeReco} onAddToWishlist={onAdd} onPress={onPress} />
    )
    fireEvent.press(getByText('+ À voir'))
    expect(onAdd).toHaveBeenCalledTimes(1)
    expect(onPress).not.toHaveBeenCalled()
  })

  it('appelle onDismiss au tap sur le bouton dismiss', () => {
    const onDismiss = jest.fn()
    const { getByTestId } = render(
      <RecoCard reco={fakeReco} onAddToWishlist={jest.fn()} onDismiss={onDismiss} />
    )
    fireEvent.press(getByTestId('dismiss-reco'))
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it("n'affiche pas le bouton dismiss si onDismiss absent", () => {
    const { queryByTestId } = render(
      <RecoCard reco={fakeReco} onAddToWishlist={jest.fn()} />
    )
    expect(queryByTestId('dismiss-reco')).toBeNull()
  })
})
