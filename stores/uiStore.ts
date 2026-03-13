import { create } from 'zustand'

let toastCounter = 0
const generateToastId = () => `toast-${++toastCounter}`

interface Toast {
  id: string
  message: string
  type: 'info' | 'success' | 'error'
}

interface LoadingState {
  scan: boolean
  export: boolean
  search: boolean
}

export interface AlertButton {
  label: string
  onPress?: () => void
  style?: 'default' | 'cancel' | 'destructive'
}

interface AlertConfig {
  title: string
  message: string
  buttons: AlertButton[]
}

interface UIState {
  loading: LoadingState
  toastQueue: Toast[]
  syncPending: boolean
  alert: AlertConfig | null
  setLoading: (key: keyof LoadingState, value: boolean) => void
  addToast: (message: string, type?: Toast['type']) => void
  removeToast: (id: string) => void
  setSyncPending: (value: boolean) => void
  showAlert: (config: AlertConfig) => void
  dismissAlert: () => void
}

export const useUIStore = create<UIState>((set) => ({
  loading: { scan: false, export: false, search: false },
  toastQueue: [],
  syncPending: false,
  alert: null,
  setLoading: (key, value) =>
    set((state) => ({ loading: { ...state.loading, [key]: value } })),
  addToast: (message, type = 'info') =>
    set((state) => ({
      toastQueue: [
        ...state.toastQueue,
        { id: generateToastId(), message, type },
      ],
    })),
  removeToast: (id) =>
    set((state) => ({
      toastQueue: state.toastQueue.filter((t) => t.id !== id),
    })),
  setSyncPending: (value) => set({ syncPending: value }),
  showAlert: (config) => set({ alert: config }),
  dismissAlert: () => set({ alert: null }),
}))
