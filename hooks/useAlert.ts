import { useUIStore } from '@/stores/uiStore'

export function useAlert() {
  const showAlert = useUIStore((s) => s.showAlert)

  const alert = (title: string, message = '') => {
    showAlert({
      title,
      message,
      buttons: [{ label: 'OK', style: 'default' }],
    })
  }

  const confirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    options?: { confirmLabel?: string; destructive?: boolean }
  ) => {
    showAlert({
      title,
      message,
      buttons: [
        { label: 'Annuler', style: 'cancel' },
        {
          label: options?.confirmLabel ?? 'Confirmer',
          style: options?.destructive ? 'destructive' : 'default',
          onPress: onConfirm,
        },
      ],
    })
  }

  return { alert, confirm }
}
