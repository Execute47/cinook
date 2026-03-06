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

interface UIState {
  loading: LoadingState
  toastQueue: Toast[]
  setLoading: (key: keyof LoadingState, value: boolean) => void
  addToast: (message: string, type?: Toast['type']) => void
  removeToast: (id: string) => void
}

export const useUIStore = create<UIState>((set) => ({
  loading: { scan: false, export: false, search: false },
  toastQueue: [],
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
}))
