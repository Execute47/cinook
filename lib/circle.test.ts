jest.mock('@/lib/firebase', () => ({ db: {} }))

const mockAddDoc = jest.fn()
const mockUpdateDoc = jest.fn()
const mockGetDoc = jest.fn()
const mockGetDocs = jest.fn()
const mockArrayUnion = jest.fn((v) => ({ __arrayUnion: v }))

const mockDeleteDoc = jest.fn()
const mockArrayRemove = jest.fn((v) => ({ __arrayRemove: v }))

jest.mock('firebase/firestore', () => ({
  addDoc: (...args: unknown[]) => mockAddDoc(...args),
  updateDoc: (...args: unknown[]) => mockUpdateDoc(...args),
  deleteDoc: (...args: unknown[]) => mockDeleteDoc(...args),
  getDoc: (...args: unknown[]) => mockGetDoc(...args),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
  arrayUnion: (v: unknown) => mockArrayUnion(v),
  arrayRemove: (v: unknown) => mockArrayRemove(v),
  doc: jest.fn((_db, ...segments) => ({ path: segments.join('/') })),
  collection: jest.fn((_db, ...segments) => ({ path: segments.join('/') })),
  query: jest.fn((...args) => args),
  where: jest.fn((...args) => args),
  serverTimestamp: jest.fn(() => 'SERVER_TIMESTAMP'),
}))

import { createCircle, generateInviteToken, joinCircle, removeMember, promoteMember, leaveCircle, deleteCircle } from './circle'

beforeEach(() => jest.clearAllMocks())

describe('createCircle', () => {
  it('crée un doc circle et ajoute le circleId dans circleIds[]', async () => {
    mockAddDoc.mockResolvedValueOnce({ id: 'circle-1' })
    mockUpdateDoc.mockResolvedValue(undefined)

    const circleId = await createCircle('uid-1')

    expect(circleId).toBe('circle-1')
    expect(mockAddDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ members: ['uid-1'], adminId: 'uid-1' })
    )
    expect(mockUpdateDoc).toHaveBeenCalledWith(
      expect.objectContaining({ path: 'users/uid-1' }),
      { circleIds: expect.objectContaining({ __arrayUnion: 'circle-1' }) }
    )
  })
})

describe('generateInviteToken', () => {
  it("stocke un token UUID dans le doc circle et le retourne", async () => {
    mockUpdateDoc.mockResolvedValue(undefined)

    const token = await generateInviteToken('circle-1')

    expect(typeof token).toBe('string')
    expect(token.length).toBeGreaterThan(10)
    expect(mockUpdateDoc).toHaveBeenCalledWith(
      expect.objectContaining({ path: 'circles/circle-1' }),
      { inviteToken: token }
    )
  })
})

describe('joinCircle', () => {
  it('retourne circleId, ajoute le membre et met à jour circleIds[] si token valide', async () => {
    mockGetDocs.mockResolvedValueOnce({
      empty: false,
      docs: [{ id: 'circle-2', data: () => ({ adminId: 'admin-uid', members: [] }) }],
    })
    mockUpdateDoc.mockResolvedValue(undefined)

    const result = await joinCircle('uid-2', 'valid-token')

    expect(result).toBe('circle-2')
    expect(mockUpdateDoc).toHaveBeenCalledWith(
      expect.objectContaining({ path: 'circles/circle-2' }),
      { members: expect.objectContaining({ __arrayUnion: 'uid-2' }) }
    )
    expect(mockUpdateDoc).toHaveBeenCalledWith(
      expect.objectContaining({ path: 'users/uid-2' }),
      { circleIds: expect.objectContaining({ __arrayUnion: 'circle-2' }) }
    )
  })

  it('retourne circleId sans updateDoc si déjà membre', async () => {
    mockGetDocs.mockResolvedValueOnce({
      empty: false,
      docs: [{ id: 'circle-2', data: () => ({ adminId: 'admin-uid', members: ['uid-2'] }) }],
    })

    const result = await joinCircle('uid-2', 'valid-token')

    expect(result).toBe('circle-2')
    expect(mockUpdateDoc).not.toHaveBeenCalled()
  })

  it('retourne null si token invalide', async () => {
    mockGetDocs.mockResolvedValueOnce({ empty: true, docs: [] })

    const result = await joinCircle('uid-2', 'bad-token')

    expect(result).toBeNull()
    expect(mockUpdateDoc).not.toHaveBeenCalled()
  })
})

describe('removeMember', () => {
  it('retire le membre du cercle et supprime le circleId de circleIds[]', async () => {
    mockUpdateDoc.mockResolvedValue(undefined)

    await removeMember('circle-1', 'uid-target')

    expect(mockUpdateDoc).toHaveBeenCalledWith(
      expect.objectContaining({ path: 'circles/circle-1' }),
      { members: expect.objectContaining({ __arrayRemove: 'uid-target' }) }
    )
    expect(mockUpdateDoc).toHaveBeenCalledWith(
      expect.objectContaining({ path: 'users/uid-target' }),
      { circleIds: expect.objectContaining({ __arrayRemove: 'circle-1' }) }
    )
  })
})

describe('promoteMember', () => {
  it('met à jour adminId avec le nouveau uid', async () => {
    mockUpdateDoc.mockResolvedValue(undefined)

    await promoteMember('circle-1', 'uid-new-admin')

    expect(mockUpdateDoc).toHaveBeenCalledWith(
      expect.objectContaining({ path: 'circles/circle-1' }),
      { adminId: 'uid-new-admin' }
    )
  })
})

describe('leaveCircle', () => {
  it('sans successeur : prend le premier membre ≠ uid comme successeur', async () => {
    mockGetDoc.mockResolvedValueOnce({
      exists: () => true,
      id: 'circle-1',
      data: () => ({ members: ['uid-admin', 'uid-other'], adminId: 'uid-admin' }),
    })
    mockUpdateDoc.mockResolvedValue(undefined)

    await leaveCircle('circle-1', 'uid-admin')

    expect(mockUpdateDoc).toHaveBeenCalledWith(
      expect.objectContaining({ path: 'circles/circle-1' }),
      { adminId: 'uid-other' }
    )
    expect(mockUpdateDoc).toHaveBeenCalledWith(
      expect.objectContaining({ path: 'circles/circle-1' }),
      { members: expect.objectContaining({ __arrayRemove: 'uid-admin' }) }
    )
    expect(mockUpdateDoc).toHaveBeenCalledWith(
      expect.objectContaining({ path: 'users/uid-admin' }),
      { circleIds: expect.objectContaining({ __arrayRemove: 'circle-1' }) }
    )
  })

  it('avec successeur fourni : promeut ce successeur', async () => {
    mockGetDoc.mockResolvedValueOnce({
      exists: () => true,
      id: 'circle-1',
      data: () => ({ members: ['uid-admin', 'uid-a', 'uid-b'], adminId: 'uid-admin' }),
    })
    mockUpdateDoc.mockResolvedValue(undefined)

    await leaveCircle('circle-1', 'uid-admin', 'uid-b')

    expect(mockUpdateDoc).toHaveBeenCalledWith(
      expect.objectContaining({ path: 'circles/circle-1' }),
      { adminId: 'uid-b' }
    )
  })
})

describe('deleteCircle', () => {
  it('supprime le doc cercle et retire circleId du circleIds[] de tous les membres', async () => {
    mockGetDoc.mockResolvedValueOnce({
      exists: () => true,
      id: 'circle-1',
      data: () => ({ members: ['uid-admin', 'uid-member'], adminId: 'uid-admin' }),
    })
    mockDeleteDoc.mockResolvedValue(undefined)
    mockUpdateDoc.mockResolvedValue(undefined)

    await deleteCircle('circle-1', 'uid-admin')

    expect(mockDeleteDoc).toHaveBeenCalledWith(
      expect.objectContaining({ path: 'circles/circle-1' })
    )
    expect(mockUpdateDoc).toHaveBeenCalledWith(
      expect.objectContaining({ path: 'users/uid-admin' }),
      { circleIds: expect.objectContaining({ __arrayRemove: 'circle-1' }) }
    )
    expect(mockUpdateDoc).toHaveBeenCalledWith(
      expect.objectContaining({ path: 'users/uid-member' }),
      { circleIds: expect.objectContaining({ __arrayRemove: 'circle-1' }) }
    )
  })
})
