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
const mockSetPendingInviteToken = jest.fn()
let mockUid: string | null = 'uid-test'
jest.mock('@/stores/authStore', () => ({
  useAuthStore: (selector: (s: object) => unknown) =>
    selector({ uid: mockUid, setCircle: mockSetCircle }),
  // getState used for setPendingInviteToken
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ...({} as any),
}))

// Override getState for the static call
beforeAll(() => {
  const authStoreMock = jest.requireMock('@/stores/authStore')
  authStoreMock.useAuthStore.getState = () => ({
    setPendingInviteToken: mockSetPendingInviteToken,
  })
})

import InviteScreen from './[token]'
import { router } from 'expo-router'

beforeEach(() => {
  jest.clearAllMocks()
  mockUid = 'uid-test'
})

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

  it('stocke le token dans le store et redirige vers register si non authentifiée', async () => {
    mockUid = null
    render(<InviteScreen />)

    await waitFor(() => {
      expect(mockSetPendingInviteToken).toHaveBeenCalledWith('test-token')
      expect(router.replace).toHaveBeenCalledWith('/(auth)/register')
    })
    expect(mockJoinCircle).not.toHaveBeenCalled()
  })
})
