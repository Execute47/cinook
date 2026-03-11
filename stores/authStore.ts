import { create } from 'zustand'

interface AuthState {
  uid: string | null
  email: string | null
  displayName: string | null
  circleIds: string[]
  activeCircleId: string | null
  pendingInviteToken: string | null
  setUser: (uid: string, email: string, displayName: string | null) => void
  setCircleIds: (ids: string[]) => void
  setActiveCircle: (circleId: string | null) => void
  addCircleId: (circleId: string) => void
  removeCircleId: (circleId: string) => void
  setPendingInviteToken: (token: string | null) => void
  reset: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  uid: null,
  email: null,
  displayName: null,
  circleIds: [],
  activeCircleId: null,
  pendingInviteToken: null,
  setUser: (uid, email, displayName) => set(() => ({ uid, email, displayName })),
  setCircleIds: (ids) => set(() => ({ circleIds: ids })),
  setActiveCircle: (circleId) => set(() => ({ activeCircleId: circleId })),
  addCircleId: (circleId) =>
    set((state) => ({
      circleIds: state.circleIds.includes(circleId)
        ? state.circleIds
        : [...state.circleIds, circleId],
      activeCircleId: circleId,
    })),
  removeCircleId: (circleId) =>
    set((state) => {
      const newIds = state.circleIds.filter((id) => id !== circleId)
      const newActive =
        state.activeCircleId === circleId ? (newIds[0] ?? null) : state.activeCircleId
      return { circleIds: newIds, activeCircleId: newActive }
    }),
  setPendingInviteToken: (token) => set(() => ({ pendingInviteToken: token })),
  reset: () =>
    set((state) => ({
      uid: null,
      email: null,
      displayName: null,
      circleIds: [],
      activeCircleId: null,
      // pendingInviteToken est préservé : reset() peut être appelé avant que
      // [token].tsx ait eu le temps de traiter le token (race condition Auth)
      pendingInviteToken: state.pendingInviteToken,
    })),
}))
