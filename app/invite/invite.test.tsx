import React from 'react'
import { render, waitFor } from '@testing-library/react-native'

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ token: 'test-token' }),
  router: { replace: jest.fn() },
}))

jest.mock('@/lib/firebase', () => ({ db: {} }))

const mockJoinCircle = jest.fn()
jest.mock('@/lib/circle', () => ({
  joinCircle: (...args: unknown[]) => mockJoinCircle(...args),
}))

const mockSetCircle = jest.fn()
jest.mock('@/stores/authStore', () => ({
  useAuthStore: (selector: (s: object) => unknown) =>
    selector({ uid: 'uid-test', setCircle: mockSetCircle }),
}))

import InviteScreen from './[token]'
import { router } from 'expo-router'

beforeEach(() => jest.clearAllMocks())

describe('InviteScreen', () => {
  it('affiche le spinner pendant le chargement', () => {
    mockJoinCircle.mockReturnValue(new Promise(() => {})) // never resolves
    const { getByText } = render(<InviteScreen />)
    expect(getByText('Validation du lien...')).toBeTruthy()
  })

  it('redirige et appelle setCircle si token valide', async () => {
    mockJoinCircle.mockResolvedValueOnce('circle-1')
    render(<InviteScreen />)

    await waitFor(() => {
      expect(mockSetCircle).toHaveBeenCalledWith('circle-1', false)
    })
    await waitFor(() => {
      expect(router.replace).toHaveBeenCalledWith('/(app)/')
    }, { timeout: 3000 })
  })

  it('affiche "Lien invalide ou expiré" si token invalide', async () => {
    mockJoinCircle.mockResolvedValueOnce(null)
    const { getByText } = render(<InviteScreen />)

    await waitFor(() => {
      expect(getByText('Lien invalide ou expiré')).toBeTruthy()
    })
    expect(mockSetCircle).not.toHaveBeenCalled()
  })
})
