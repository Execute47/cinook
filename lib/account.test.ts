// Mocks firebase/firestore
const mockGetDocs = jest.fn()
const mockWriteBatch = jest.fn()
const mockBatchDelete = jest.fn()
const mockBatchCommit = jest.fn()
const mockDeleteDoc = jest.fn()
const mockDeleteUser = jest.fn()

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(() => 'col-ref'),
  doc: jest.fn((_db: unknown, ...path: string[]) => path.join('/')),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
  writeBatch: (...args: unknown[]) => mockWriteBatch(...args),
  deleteDoc: (...args: unknown[]) => mockDeleteDoc(...args),
  getFirestore: jest.fn(),
  initializeFirestore: jest.fn(),
  persistentLocalCache: jest.fn(),
}))

jest.mock('firebase/auth', () => ({
  deleteUser: (...args: unknown[]) => mockDeleteUser(...args),
  getAuth: jest.fn(),
}))

jest.mock('@/lib/firebase', () => ({ db: {}, auth: { currentUser: { uid: 'uid-test' } } }))

const mockLeaveCircle = jest.fn()
const mockDeleteCircle = jest.fn()
const mockGetCircle = jest.fn()
jest.mock('@/lib/circle', () => ({
  leaveCircle: (...args: unknown[]) => mockLeaveCircle(...args),
  deleteCircle: (...args: unknown[]) => mockDeleteCircle(...args),
  getCircle: (...args: unknown[]) => mockGetCircle(...args),
}))

import { deleteAllItems, deleteAccount } from './account'

function makeBatch() {
  return { delete: mockBatchDelete, commit: mockBatchCommit }
}

beforeEach(() => {
  jest.clearAllMocks()
  mockWriteBatch.mockReturnValue(makeBatch())
  mockBatchCommit.mockResolvedValue(undefined)
  mockDeleteDoc.mockResolvedValue(undefined)
  mockDeleteUser.mockResolvedValue(undefined)
})

describe('deleteAllItems (Task 1)', () => {
  it('retourne 0 si la collection est vide', async () => {
    mockGetDocs.mockResolvedValueOnce({ empty: true, docs: [], size: 0 })
    const count = await deleteAllItems('uid-test')
    expect(count).toBe(0)
    expect(mockWriteBatch).not.toHaveBeenCalled()
  })

  it('supprime tous les items via writeBatch et retourne le nombre', async () => {
    const fakeDocs = [{ ref: 'ref1' }, { ref: 'ref2' }, { ref: 'ref3' }]
    mockGetDocs.mockResolvedValueOnce({ empty: false, docs: fakeDocs, size: 3 })
    const count = await deleteAllItems('uid-test')
    expect(mockBatchDelete).toHaveBeenCalledTimes(3)
    expect(mockBatchCommit).toHaveBeenCalledTimes(1)
    expect(count).toBe(3)
  })
})

describe('deleteAccount (Task 2)', () => {
  it('AC3 — membre simple sans cercle : items → profil → Auth', async () => {
    mockGetDocs.mockResolvedValueOnce({ empty: true, docs: [], size: 0 })
    await deleteAccount('uid-test', [])
    expect(mockLeaveCircle).not.toHaveBeenCalled()
    expect(mockDeleteCircle).not.toHaveBeenCalled()
    expect(mockDeleteDoc).toHaveBeenCalledWith('users/uid-test')
    expect(mockDeleteUser).toHaveBeenCalledTimes(1)
  })

  it('AC3 — membre simple dans un cercle : quitte le cercle', async () => {
    mockGetDocs.mockResolvedValueOnce({ empty: true, docs: [], size: 0 })
    mockGetCircle.mockResolvedValueOnce({ id: 'circle-1', members: ['uid-test', 'uid-other'], adminId: 'uid-other' })
    mockLeaveCircle.mockResolvedValueOnce(undefined)
    await deleteAccount('uid-test', ['circle-1'])
    expect(mockLeaveCircle).toHaveBeenCalledWith('circle-1', 'uid-test')
    expect(mockDeleteCircle).not.toHaveBeenCalled()
    expect(mockDeleteUser).toHaveBeenCalledTimes(1)
  })

  it('AC5 — admin dernier membre : deleteCircle', async () => {
    mockGetDocs.mockResolvedValueOnce({ empty: true, docs: [], size: 0 })
    mockGetCircle.mockResolvedValueOnce({ id: 'circle-1', members: ['uid-test'], adminId: 'uid-test' })
    mockDeleteCircle.mockResolvedValueOnce(undefined)
    await deleteAccount('uid-test', ['circle-1'])
    expect(mockDeleteCircle).toHaveBeenCalledWith('circle-1', 'uid-test')
    expect(mockLeaveCircle).not.toHaveBeenCalled()
  })

  it('AC4 — admin avec autres membres : leaveCircle (auto-promotion)', async () => {
    mockGetDocs.mockResolvedValueOnce({ empty: true, docs: [], size: 0 })
    mockGetCircle.mockResolvedValueOnce({ id: 'circle-1', members: ['uid-test', 'uid-other'], adminId: 'uid-test' })
    mockLeaveCircle.mockResolvedValueOnce(undefined)
    await deleteAccount('uid-test', ['circle-1'])
    expect(mockLeaveCircle).toHaveBeenCalledWith('circle-1', 'uid-test')
    expect(mockDeleteCircle).not.toHaveBeenCalled()
  })

  it('AC6 — propagation erreur requires-recent-login', async () => {
    mockGetDocs.mockResolvedValueOnce({ empty: true, docs: [], size: 0 })
    const authError = Object.assign(new Error('requires-recent-login'), { code: 'auth/requires-recent-login' })
    mockDeleteUser.mockRejectedValueOnce(authError)
    await expect(deleteAccount('uid-test', [])).rejects.toMatchObject({ code: 'auth/requires-recent-login' })
    // Le profil a déjà été supprimé (Firestore en premier)
    expect(mockDeleteDoc).toHaveBeenCalledWith('users/uid-test')
  })

  it('deleteUser est appelé EN DERNIER', async () => {
    const order: string[] = []
    mockGetDocs.mockResolvedValueOnce({ empty: true, docs: [], size: 0 })
    mockDeleteDoc.mockImplementationOnce(async () => { order.push('deleteDoc') })
    mockDeleteUser.mockImplementationOnce(async () => { order.push('deleteUser') })
    await deleteAccount('uid-test', [])
    expect(order).toEqual(['deleteDoc', 'deleteUser'])
  })
})
