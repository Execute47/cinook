import { addItem, updateItem, deleteItem } from './firestore'

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(() => 'mock-collection-ref'),
  doc: jest.fn(() => 'mock-doc-ref'),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  serverTimestamp: jest.fn(() => 'SERVER_TIMESTAMP'),
}))

jest.mock('@/lib/firebase', () => ({
  db: {},
}))

import { addDoc, updateDoc, deleteDoc, serverTimestamp, collection, doc } from 'firebase/firestore'
const mockAddDoc = addDoc as jest.MockedFunction<typeof addDoc>
const mockUpdateDoc = updateDoc as jest.MockedFunction<typeof updateDoc>
const mockDeleteDoc = deleteDoc as jest.MockedFunction<typeof deleteDoc>
const mockCollection = collection as jest.MockedFunction<typeof collection>
const mockDoc = doc as jest.MockedFunction<typeof doc>

describe('lib/firestore.ts — addItem', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const uid = 'user-123'
  const item = {
    title: 'Inception',
    type: 'film' as const,
    statuses: ['owned'] as const,
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

describe('lib/firestore.ts — updateItem', () => {
  beforeEach(() => jest.clearAllMocks())

  it('appelle updateDoc avec updatedAt serverTimestamp', async () => {
    mockUpdateDoc.mockResolvedValue(undefined as never)

    await updateItem('uid-1', 'item-1', { title: 'Nouveau titre' })

    expect(mockDoc).toHaveBeenCalledWith(expect.anything(), 'users', 'uid-1', 'items', 'item-1')
    expect(mockUpdateDoc).toHaveBeenCalledWith('mock-doc-ref', {
      title: 'Nouveau titre',
      updatedAt: 'SERVER_TIMESTAMP',
    })
  })
})

describe('lib/firestore.ts — deleteItem', () => {
  beforeEach(() => jest.clearAllMocks())

  it('appelle deleteDoc sur le bon document', async () => {
    mockDeleteDoc.mockResolvedValue(undefined as never)

    await deleteItem('uid-1', 'item-1')

    expect(mockDoc).toHaveBeenCalledWith(expect.anything(), 'users', 'uid-1', 'items', 'item-1')
    expect(mockDeleteDoc).toHaveBeenCalledWith('mock-doc-ref')
  })
})
