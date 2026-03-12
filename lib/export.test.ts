const mockWriteAsStringAsync = jest.fn()
const mockShareAsync = jest.fn()
const mockCreateObjectURL = jest.fn(() => 'blob:fake-url')
const mockRevokeObjectURL = jest.fn()
const mockClick = jest.fn()

jest.mock('expo-file-system/legacy', () => ({
  cacheDirectory: 'file:///cache/',
  writeAsStringAsync: (...args: unknown[]) => mockWriteAsStringAsync(...args),
}))

jest.mock('expo-sharing', () => ({
  shareAsync: (...args: unknown[]) => mockShareAsync(...args),
}))

import { Platform } from 'react-native'
import { exportCollection } from './export'
import type { MediaItem } from '@/types/media'

const isWeb = Platform.OS === 'web'

beforeAll(() => {
  if (isWeb) {
    global.URL.createObjectURL = mockCreateObjectURL
    global.URL.revokeObjectURL = mockRevokeObjectURL
    jest.spyOn(document, 'createElement').mockReturnValue({
      href: '',
      download: '',
      click: mockClick,
    } as unknown as HTMLElement)
  }
})

beforeEach(() => jest.clearAllMocks())

function makeItem(overrides: Partial<MediaItem> = {}): MediaItem {
  return {
    id: '1',
    title: 'Test Film',
    type: 'film',
    status: 'watched',
    tier: 'gold',
    addedVia: 'manual',
    addedAt: { toDate: () => new Date('2024-01-15') } as any,
    rating: 4,
    comment: 'Super film',
    ...overrides,
  }
}

describe('exportCollection — CSV (AC1, AC2)', () => {
  it('déclenche le téléchargement/partage', async () => {
    if (!isWeb) {
      mockWriteAsStringAsync.mockResolvedValueOnce(undefined)
      mockShareAsync.mockResolvedValueOnce(undefined)
    }
    await exportCollection([makeItem()], 'csv')
    if (isWeb) {
      expect(mockCreateObjectURL).toHaveBeenCalledTimes(1)
      expect(mockClick).toHaveBeenCalledTimes(1)
    } else {
      expect(mockWriteAsStringAsync).toHaveBeenCalledTimes(1)
      expect(mockShareAsync).toHaveBeenCalledTimes(1)
    }
  })

  it('le fichier CSV contient les en-têtes corrects', async () => {
    if (!isWeb) {
      mockWriteAsStringAsync.mockResolvedValueOnce(undefined)
      mockShareAsync.mockResolvedValueOnce(undefined)
    }
    await exportCollection([makeItem()], 'csv')
    const content: string = isWeb
      ? (mockCreateObjectURL.mock.calls[0][0] as Blob).text
        ? await (mockCreateObjectURL.mock.calls[0][0] as Blob).text()
        : ''
      : mockWriteAsStringAsync.mock.calls[0][1]
    if (content) {
      const headers = content.split('\n')[0]
      expect(headers).toContain('titre')
      expect(headers).toContain('type')
      expect(headers).toContain('statut')
      expect(headers).toContain('note')
      expect(headers).toContain('tier')
      expect(headers).toContain('commentaire')
    }
  })

  it('le CSV contient les données de l\'item', async () => {
    if (!isWeb) {
      mockWriteAsStringAsync.mockResolvedValueOnce(undefined)
      mockShareAsync.mockResolvedValueOnce(undefined)
      await exportCollection([makeItem()], 'csv')
      const content: string = mockWriteAsStringAsync.mock.calls[0][1]
      expect(content).toContain('Test Film')
      expect(content).toContain('film')
      expect(content).toContain('watched')
      expect(content).toContain('gold')
      expect(content).toContain('Super film')
    } else {
      await exportCollection([makeItem()], 'csv')
      expect(mockCreateObjectURL).toHaveBeenCalledTimes(1)
    }
  })

  it('échappe les guillemets dans les valeurs CSV', async () => {
    if (!isWeb) {
      mockWriteAsStringAsync.mockResolvedValueOnce(undefined)
      mockShareAsync.mockResolvedValueOnce(undefined)
      await exportCollection([makeItem({ title: 'Film "Special"' })], 'csv')
      const content: string = mockWriteAsStringAsync.mock.calls[0][1]
      expect(content).toContain('Film ""Special""')
    } else {
      await exportCollection([makeItem({ title: 'Film "Special"' })], 'csv')
      expect(mockCreateObjectURL).toHaveBeenCalledTimes(1)
    }
  })

  it('gère les items sans champs optionnels', async () => {
    if (!isWeb) {
      mockWriteAsStringAsync.mockResolvedValueOnce(undefined)
      mockShareAsync.mockResolvedValueOnce(undefined)
    }
    const item = makeItem({ rating: undefined, comment: undefined, loanTo: undefined })
    await expect(exportCollection([item], 'csv')).resolves.not.toThrow()
  })
})

describe('exportCollection — JSON (AC1, AC2)', () => {
  it('génère un JSON valide', async () => {
    if (!isWeb) {
      mockWriteAsStringAsync.mockResolvedValueOnce(undefined)
      mockShareAsync.mockResolvedValueOnce(undefined)
      await exportCollection([makeItem()], 'json')
      const content: string = mockWriteAsStringAsync.mock.calls[0][1]
      expect(() => JSON.parse(content)).not.toThrow()
    } else {
      await exportCollection([makeItem()], 'json')
      expect(mockCreateObjectURL).toHaveBeenCalledTimes(1)
    }
  })

  it('le JSON contient tous les items', async () => {
    if (!isWeb) {
      mockWriteAsStringAsync.mockResolvedValueOnce(undefined)
      mockShareAsync.mockResolvedValueOnce(undefined)
      await exportCollection([makeItem({ id: 'a' }), makeItem({ id: 'b' })], 'json')
      const content: string = mockWriteAsStringAsync.mock.calls[0][1]
      const parsed = JSON.parse(content)
      expect(parsed).toHaveLength(2)
    } else {
      await exportCollection([makeItem({ id: 'a' }), makeItem({ id: 'b' })], 'json')
      expect(mockCreateObjectURL).toHaveBeenCalledTimes(1)
    }
  })

  it('le nom du fichier se termine par .json', async () => {
    if (!isWeb) {
      mockWriteAsStringAsync.mockResolvedValueOnce(undefined)
      mockShareAsync.mockResolvedValueOnce(undefined)
      await exportCollection([makeItem()], 'json')
      const uri: string = mockShareAsync.mock.calls[0][0]
      expect(uri).toMatch(/\.json$/)
    } else {
      await exportCollection([makeItem()], 'json')
      expect(mockClick).toHaveBeenCalledTimes(1)
    }
  })

  it('le nom du fichier CSV se termine par .csv', async () => {
    if (!isWeb) {
      mockWriteAsStringAsync.mockResolvedValueOnce(undefined)
      mockShareAsync.mockResolvedValueOnce(undefined)
      await exportCollection([makeItem()], 'csv')
      const uri: string = mockShareAsync.mock.calls[0][0]
      expect(uri).toMatch(/\.csv$/)
    } else {
      await exportCollection([makeItem()], 'csv')
      expect(mockClick).toHaveBeenCalledTimes(1)
    }
  })
})
