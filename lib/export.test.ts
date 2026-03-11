const mockWriteAsStringAsync = jest.fn()
const mockShareAsync = jest.fn()

jest.mock('expo-file-system', () => ({
  cacheDirectory: 'file:///cache/',
  writeAsStringAsync: (...args: unknown[]) => mockWriteAsStringAsync(...args),
}))

jest.mock('expo-sharing', () => ({
  shareAsync: (...args: unknown[]) => mockShareAsync(...args),
}))

import { exportCollection } from './export'
import type { MediaItem } from '@/types/media'

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

beforeEach(() => jest.clearAllMocks())

describe('exportCollection — CSV (AC1, AC2)', () => {
  it('écrit le fichier et le partage', async () => {
    mockWriteAsStringAsync.mockResolvedValueOnce(undefined)
    mockShareAsync.mockResolvedValueOnce(undefined)
    await exportCollection([makeItem()], 'csv')
    expect(mockWriteAsStringAsync).toHaveBeenCalledTimes(1)
    expect(mockShareAsync).toHaveBeenCalledTimes(1)
  })

  it('le fichier CSV contient les en-têtes corrects', async () => {
    mockWriteAsStringAsync.mockResolvedValueOnce(undefined)
    mockShareAsync.mockResolvedValueOnce(undefined)
    await exportCollection([makeItem()], 'csv')
    const content: string = mockWriteAsStringAsync.mock.calls[0][1]
    const headers = content.split('\n')[0]
    expect(headers).toContain('titre')
    expect(headers).toContain('type')
    expect(headers).toContain('statut')
    expect(headers).toContain('note')
    expect(headers).toContain('tier')
    expect(headers).toContain('commentaire')
  })

  it('le CSV contient les données de l\'item', async () => {
    mockWriteAsStringAsync.mockResolvedValueOnce(undefined)
    mockShareAsync.mockResolvedValueOnce(undefined)
    await exportCollection([makeItem()], 'csv')
    const content: string = mockWriteAsStringAsync.mock.calls[0][1]
    expect(content).toContain('Test Film')
    expect(content).toContain('film')
    expect(content).toContain('watched')
    expect(content).toContain('gold')
    expect(content).toContain('Super film')
  })

  it('échappe les guillemets dans les valeurs CSV', async () => {
    mockWriteAsStringAsync.mockResolvedValueOnce(undefined)
    mockShareAsync.mockResolvedValueOnce(undefined)
    await exportCollection([makeItem({ title: 'Film "Special"' })], 'csv')
    const content: string = mockWriteAsStringAsync.mock.calls[0][1]
    expect(content).toContain('Film ""Special""')
  })

  it('gère les items sans champs optionnels', async () => {
    mockWriteAsStringAsync.mockResolvedValueOnce(undefined)
    mockShareAsync.mockResolvedValueOnce(undefined)
    const item = makeItem({ rating: undefined, comment: undefined, loanTo: undefined })
    await expect(exportCollection([item], 'csv')).resolves.not.toThrow()
  })
})

describe('exportCollection — JSON (AC1, AC2)', () => {
  it('génère un JSON valide', async () => {
    mockWriteAsStringAsync.mockResolvedValueOnce(undefined)
    mockShareAsync.mockResolvedValueOnce(undefined)
    await exportCollection([makeItem()], 'json')
    const content: string = mockWriteAsStringAsync.mock.calls[0][1]
    expect(() => JSON.parse(content)).not.toThrow()
  })

  it('le JSON contient tous les items', async () => {
    mockWriteAsStringAsync.mockResolvedValueOnce(undefined)
    mockShareAsync.mockResolvedValueOnce(undefined)
    await exportCollection([makeItem({ id: 'a' }), makeItem({ id: 'b' })], 'json')
    const content: string = mockWriteAsStringAsync.mock.calls[0][1]
    const parsed = JSON.parse(content)
    expect(parsed).toHaveLength(2)
  })

  it('le nom du fichier se termine par .json', async () => {
    mockWriteAsStringAsync.mockResolvedValueOnce(undefined)
    mockShareAsync.mockResolvedValueOnce(undefined)
    await exportCollection([makeItem()], 'json')
    const uri: string = mockShareAsync.mock.calls[0][0]
    expect(uri).toMatch(/\.json$/)
  })

  it('le nom du fichier CSV se termine par .csv', async () => {
    mockWriteAsStringAsync.mockResolvedValueOnce(undefined)
    mockShareAsync.mockResolvedValueOnce(undefined)
    await exportCollection([makeItem()], 'csv')
    const uri: string = mockShareAsync.mock.calls[0][0]
    expect(uri).toMatch(/\.csv$/)
  })
})
