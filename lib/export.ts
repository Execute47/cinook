import * as FileSystem from 'expo-file-system'
import * as Sharing from 'expo-sharing'
import type { MediaItem } from '@/types/media'

export async function exportCollection(items: MediaItem[], format: 'csv' | 'json'): Promise<void> {
  const content = format === 'csv' ? itemsToCsv(items) : JSON.stringify(items, null, 2)
  const filename = `cinook-export-${Date.now()}.${format}`
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
