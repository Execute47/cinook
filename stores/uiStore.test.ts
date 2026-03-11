import { useUIStore } from './uiStore'

beforeEach(() => {
  // Reset to initial state
  useUIStore.setState({
    loading: { scan: false, export: false, search: false },
    toastQueue: [],
    syncPending: false,
  })
})

describe('uiStore', () => {
  it('initialise avec loading à false et toast queue vide', () => {
    const state = useUIStore.getState()
    expect(state.loading.scan).toBe(false)
    expect(state.loading.export).toBe(false)
    expect(state.loading.search).toBe(false)
    expect(state.toastQueue).toHaveLength(0)
  })

  it('setLoading met à jour uniquement la clé donnée', () => {
    useUIStore.getState().setLoading('scan', true)
    const state = useUIStore.getState()
    expect(state.loading.scan).toBe(true)
    expect(state.loading.export).toBe(false) // non modifié
    expect(state.loading.search).toBe(false) // non modifié
  })

  it('addToast ajoute un toast avec le type par défaut info', () => {
    useUIStore.getState().addToast('Message de test')
    const queue = useUIStore.getState().toastQueue
    expect(queue).toHaveLength(1)
    expect(queue[0].message).toBe('Message de test')
    expect(queue[0].type).toBe('info')
    expect(queue[0].id).toBeDefined()
  })

  it('addToast respecte le type spécifié', () => {
    useUIStore.getState().addToast('Erreur', 'error')
    expect(useUIStore.getState().toastQueue[0].type).toBe('error')
  })

  it('removeToast supprime le toast par id', () => {
    useUIStore.getState().addToast('Toast 1')
    useUIStore.getState().addToast('Toast 2')
    const id = useUIStore.getState().toastQueue[0].id
    useUIStore.getState().removeToast(id)
    const queue = useUIStore.getState().toastQueue
    expect(queue).toHaveLength(1)
    expect(queue[0].message).toBe('Toast 2')
  })

  it('syncPending initialisé à false', () => {
    expect(useUIStore.getState().syncPending).toBe(false)
  })

  it('setSyncPending met à jour syncPending', () => {
    useUIStore.getState().setSyncPending(true)
    expect(useUIStore.getState().syncPending).toBe(true)
    useUIStore.getState().setSyncPending(false)
    expect(useUIStore.getState().syncPending).toBe(false)
  })

  it('les mises à jour loading sont immuables', () => {
    useUIStore.getState().setLoading('scan', true)
    useUIStore.getState().setLoading('export', true)
    const state = useUIStore.getState()
    expect(state.loading.scan).toBe(true)
    expect(state.loading.export).toBe(true)
    expect(state.loading.search).toBe(false)
  })
})
