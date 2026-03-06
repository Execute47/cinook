import { useAuthStore } from './authStore'

// Reset store between tests
beforeEach(() => {
  useAuthStore.getState().reset()
})

describe('authStore', () => {
  it('initialise avec des valeurs nulles', () => {
    const state = useAuthStore.getState()
    expect(state.uid).toBeNull()
    expect(state.email).toBeNull()
    expect(state.displayName).toBeNull()
    expect(state.circleId).toBeNull()
    expect(state.isAdmin).toBe(false)
  })

  it('setUser met à jour uid, email et displayName', () => {
    useAuthStore.getState().setUser('uid-123', 'test@example.com', 'Mathilde')
    const state = useAuthStore.getState()
    expect(state.uid).toBe('uid-123')
    expect(state.email).toBe('test@example.com')
    expect(state.displayName).toBe('Mathilde')
  })

  it('setUser accepte displayName null', () => {
    useAuthStore.getState().setUser('uid-456', 'other@example.com', null)
    expect(useAuthStore.getState().displayName).toBeNull()
  })

  it('setCircle met à jour circleId et isAdmin', () => {
    useAuthStore.getState().setCircle('circle-abc', true)
    const state = useAuthStore.getState()
    expect(state.circleId).toBe('circle-abc')
    expect(state.isAdmin).toBe(true)
  })

  it('reset remet toutes les valeurs à leur état initial', () => {
    useAuthStore.getState().setUser('uid-123', 'test@example.com', 'Mathilde')
    useAuthStore.getState().setCircle('circle-abc', true)
    useAuthStore.getState().reset()
    const state = useAuthStore.getState()
    expect(state.uid).toBeNull()
    expect(state.email).toBeNull()
    expect(state.circleId).toBeNull()
    expect(state.isAdmin).toBe(false)
  })

  it('les mises à jour sont immuables — pas de mutation directe', () => {
    useAuthStore.getState().setUser('uid-123', 'test@example.com', 'Mathilde')
    const stateBefore = useAuthStore.getState()
    useAuthStore.getState().setCircle('circle-xyz', false)
    // uid et email ne doivent pas avoir changé
    expect(useAuthStore.getState().uid).toBe(stateBefore.uid)
    expect(useAuthStore.getState().email).toBe(stateBefore.email)
  })
})
