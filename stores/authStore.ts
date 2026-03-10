import { create } from 'zustand'

interface AuthState {
  uid: string | null
  email: string | null
  displayName: string | null
  circleId: string | null
  isAdmin: boolean
  pendingInviteToken: string | null
  setUser: (uid: string, email: string, displayName: string | null) => void
  setCircle: (circleId: string, isAdmin: boolean) => void
  setPendingInviteToken: (token: string | null) => void
  reset: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  uid: null,
  email: null,
  displayName: null,
  circleId: null,
  isAdmin: false,
  pendingInviteToken: null,
  setUser: (uid, email, displayName) => set(() => ({ uid, email, displayName })),
  setCircle: (circleId, isAdmin) => set(() => ({ circleId, isAdmin })),
  setPendingInviteToken: (token) => set(() => ({ pendingInviteToken: token })),
  reset: () =>
    set((state) => ({
      uid: null,
      email: null,
      displayName: null,
      circleId: null,
      isAdmin: false,
      // pendingInviteToken est préservé : reset() peut être appelé avant que
      // [token].tsx ait eu le temps de traiter le token (race condition Auth)
      pendingInviteToken: state.pendingInviteToken,
    })),
}))
