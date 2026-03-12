import { Platform } from 'react-native'
import * as FileSystem from 'expo-file-system/legacy'
import * as Sharing from 'expo-sharing'
import type { MediaItem } from '@/types/media'

export async function exportCollection(items: MediaItem[], format: 'csv' | 'json'): Promise<void> {
  const content = format === 'csv' ? itemsToCsv(items) : JSON.stringify(items, null, 2)
  const filename = `cinook-export-${Date.now()}.${format}`

  if (Platform.OS === 'web') {
    const mimeType = format === 'csv' ? 'text/csv' : 'application/json'
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
    return
  }

  const uri = (FileSystem.cacheDirectory ?? '') + filename
  await FileSystem.writeAsStringAsync(uri, content)
  await Sharing.shareAsync(uri)
}

function escape(value: string): string {
  return `"${value.replace(/"/g, '""')}"`
}

function itemsToCsv(items: MediaItem[]): string {
  const headers = ['titre', 'type', 'statut', 'note', 'tier', 'commentaire', 'ajouteLe', 'pretA', 'datePret']
  const rows = items.map((item) =>
    [
      item.title,
      item.type,
      item.status,
      item.rating ?? '',
      item.tier,
      item.comment ?? '',
      item.addedAt?.toDate?.()?.toISOString() ?? '',
      item.loanTo ?? '',
      item.loanDate?.toDate?.()?.toISOString() ?? '',
    ]
      .map((v) => escape(String(v)))
      .join(',')
  )
  return [headers.join(','), ...rows].join('\n')
}
