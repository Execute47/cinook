import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import MemberCard from './MemberCard'
import type { Member } from '@/hooks/useCircle'

const member: Member = { uid: 'uid-1', displayName: 'Alice', email: 'alice@example.com' }

describe('MemberCard — actions admin', () => {
  it('n\'affiche pas le bouton ••• si onAdminAction absent', () => {
    const { queryByLabelText } = render(
      <MemberCard member={member} isAdmin={false} onPress={jest.fn()} />
    )
    expect(queryByLabelText('Actions admin')).toBeNull()
  })

  it('affiche le bouton ••• si onAdminAction présent', () => {
    const { getByLabelText } = render(
      <MemberCard member={member} isAdmin={false} onPress={jest.fn()} onAdminAction={jest.fn()} />
    )
    expect(getByLabelText('Actions admin')).toBeTruthy()
  })

  it('affiche les actions après tap sur •••', () => {
    const { getByLabelText, getByText } = render(
      <MemberCard member={member} isAdmin={false} onPress={jest.fn()} onAdminAction={jest.fn()} />
    )
    fireEvent.press(getByLabelText('Actions admin'))
    expect(getByText('Expulser du cercle')).toBeTruthy()
    expect(getByText('Promouvoir admin')).toBeTruthy()
  })

  it('appelle onAdminAction("remove") quand Expulser est pressé', () => {
    const onAdminAction = jest.fn()
    const { getByLabelText, getByText } = render(
      <MemberCard member={member} isAdmin={false} onPress={jest.fn()} onAdminAction={onAdminAction} />
    )
    fireEvent.press(getByLabelText('Actions admin'))
    fireEvent.press(getByText('Expulser du cercle'))
    expect(onAdminAction).toHaveBeenCalledWith('remove')
  })

  it('appelle onAdminAction("promote") quand Promouvoir est pressé', () => {
    const onAdminAction = jest.fn()
    const { getByLabelText, getByText } = render(
      <MemberCard member={member} isAdmin={false} onPress={jest.fn()} onAdminAction={onAdminAction} />
    )
    fireEvent.press(getByLabelText('Actions admin'))
    fireEvent.press(getByText('Promouvoir admin'))
    expect(onAdminAction).toHaveBeenCalledWith('promote')
  })
})
