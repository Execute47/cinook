import { addItem } from './firestore'

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(() => 'mock-collection-ref'),
  addDoc: jest.fn(),
  serverTimestamp: jest.fn(() => 'SERVER_TIMESTAMP'),
}))

jest.mock('@/lib/firebase', () => ({
  db: {},
}))

import { addDoc, serverTimestamp, collection } from 'firebase/firestore'
const mockAddDoc = addDoc as jest.MockedFunction<typeof addDoc>
const mockCollection = collection as jest.MockedFunction<typeof collection>

describe('lib/firestore.ts — addItem', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const uid = 'user-123'
  const item = {
    title: 'Inception',
    type: 'film' as const,
    status: 'owned' as const,
    tier: 'none' as const,
    addedVia: 'scan' as const,
  }

  it('appelle addDoc avec la bonne collection et les données', async () => {
    mockAddDoc.mockResolvedValue({ id: 'doc-456' } as never)

    const id = await addItem(uid, item)

    expect(mockCollection).toHaveBeenCalledWith(expect.anything(), 'users', uid, 'items')
    expect(mockAddDoc).toHaveBeenCalledWith('mock-collection-ref', {
      ...item,
      addedAt: 'SERVER_TIMESTAMP',
    })
    expect(id).toBe('doc-456')
  })

  it('addedAt est un serverTimestamp', async () => {
    mockAddDoc.mockResolvedValue({ id: 'doc-789' } as never)

    await addItem(uid, item)

    expect(serverTimestamp).toHaveBeenCalled()
    const callArgs = mockAddDoc.mock.calls[0][1] as Record<string, unknown>
    expect(callArgs.addedAt).toBe('SERVER_TIMESTAMP')
  })
})
