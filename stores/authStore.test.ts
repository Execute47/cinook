import { useAuthStore } from './authStore'

// Reset store between tests
beforeEach(() => {
  useAuthStore.getState().reset()
})

describe('authStore', () => {
  it('initialise avec des valeurs vides', () => {
    const state = useAuthStore.getState()
    expect(state.uid).toBeNull()
    expect(state.email).toBeNull()
    expect(state.displayName).toBeNull()
    expect(state.circleIds).toEqual([])
    expect(state.activeCircleId).toBeNull()
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

  it('addCircleId ajoute un cercle et le définit comme actif', () => {
    useAuthStore.getState().addCircleId('circle-abc')
    const state = useAuthStore.getState()
    expect(state.circleIds).toContain('circle-abc')
    expect(state.activeCircleId).toBe('circle-abc')
  })

  it('addCircleId n\'ajoute pas de doublon', () => {
    useAuthStore.getState().addCircleId('circle-abc')
    useAuthStore.getState().addCircleId('circle-abc')
    expect(useAuthStore.getState().circleIds).toHaveLength(1)
  })

  it('addCircleId avec plusieurs cercles — le dernier ajouté devient actif', () => {
    useAuthStore.getState().addCircleId('circle-1')
    useAuthStore.getState().addCircleId('circle-2')
    expect(useAuthStore.getState().circleIds).toEqual(['circle-1', 'circle-2'])
    expect(useAuthStore.getState().activeCircleId).toBe('circle-2')
  })

  it('removeCircleId retire un cercle et passe au suivant disponible', () => {
    useAuthStore.getState().addCircleId('circle-1')
    useAuthStore.getState().addCircleId('circle-2')
    useAuthStore.getState().setActiveCircle('circle-1')
    useAuthStore.getState().removeCircleId('circle-1')
    const state = useAuthStore.getState()
    expect(state.circleIds).not.toContain('circle-1')
    expect(state.activeCircleId).toBe('circle-2')
  })

  it('removeCircleId → activeCircleId devient null si plus de cercles', () => {
    useAuthStore.getState().addCircleId('circle-1')
    useAuthStore.getState().removeCircleId('circle-1')
    const state = useAuthStore.getState()
    expect(state.circleIds).toHaveLength(0)
    expect(state.activeCircleId).toBeNull()
  })

  it('setActiveCircle change le cercle actif', () => {
    useAuthStore.getState().addCircleId('circle-1')
    useAuthStore.getState().addCircleId('circle-2')
    useAuthStore.getState().setActiveCircle('circle-1')
    expect(useAuthStore.getState().activeCircleId).toBe('circle-1')
  })

  it('reset remet toutes les valeurs à leur état initial', () => {
    useAuthStore.getState().setUser('uid-123', 'test@example.com', 'Mathilde')
    useAuthStore.getState().addCircleId('circle-abc')
    useAuthStore.getState().reset()
    const state = useAuthStore.getState()
    expect(state.uid).toBeNull()
    expect(state.email).toBeNull()
    expect(state.circleIds).toEqual([])
    expect(state.activeCircleId).toBeNull()
  })

  it('les mises à jour sont immuables — pas de mutation directe', () => {
    useAuthStore.getState().setUser('uid-123', 'test@example.com', 'Mathilde')
    const stateBefore = useAuthStore.getState()
    useAuthStore.getState().addCircleId('circle-xyz')
    expect(useAuthStore.getState().uid).toBe(stateBefore.uid)
    expect(useAuthStore.getState().email).toBe(stateBefore.email)
  })
})
