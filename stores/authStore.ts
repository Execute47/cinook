import { create } from 'zustand'

interface AuthState {
  uid: string | null
  email: string | null
  displayName: string | null
  circleId: string | null
  isAdmin: boolean
  setUser: (uid: string, email: string, displayName: string | null) => void
  setCircle: (circleId: string, isAdmin: boolean) => void
  reset: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  uid: null,
  email: null,
  displayName: null,
  circleId: null,
  isAdmin: false,
  setUser: (uid, email, displayName) => set(() => ({ uid, email, displayName })),
  setCircle: (circleId, isAdmin) => set(() => ({ circleId, isAdmin })),
  reset: () =>
    set(() => ({
      uid: null,
      email: null,
      displayName: null,
      circleId: null,
      isAdmin: false,
    })),
}))
