jest.mock('@/lib/firebase', () => ({ db: {} }))

const mockAddDoc = jest.fn()
const mockUpdateDoc = jest.fn()
const mockGetDoc = jest.fn()
const mockGetDocs = jest.fn()
const mockArrayUnion = jest.fn((v) => ({ __arrayUnion: v }))

jest.mock('firebase/firestore', () => ({
  addDoc: (...args: unknown[]) => mockAddDoc(...args),
  updateDoc: (...args: unknown[]) => mockUpdateDoc(...args),
  getDoc: (...args: unknown[]) => mockGetDoc(...args),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
  arrayUnion: (v: unknown) => mockArrayUnion(v),
  doc: jest.fn((_db, ...segments) => ({ path: segments.join('/') })),
  collection: jest.fn((_db, ...segments) => ({ path: segments.join('/') })),
  query: jest.fn((...args) => args),
  where: jest.fn((...args) => args),
  serverTimestamp: jest.fn(() => 'SERVER_TIMESTAMP'),
}))

import { createCircle, generateInviteToken, joinCircle } from './circle'

beforeEach(() => jest.clearAllMocks())

describe('createCircle', () => {
  it('crée un doc circle et met à jour le profil utilisateur', async () => {
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
      { circleId: 'circle-1' }
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
  it('retourne circleId et met à jour les membres si token valide', async () => {
    mockGetDocs.mockResolvedValueOnce({
      empty: false,
      docs: [{ id: 'circle-2', data: () => ({ adminId: 'admin-uid' }) }],
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
      { circleId: 'circle-2' }
    )
  })

  it('retourne null si token invalide', async () => {
    mockGetDocs.mockResolvedValueOnce({ empty: true, docs: [] })

    const result = await joinCircle('uid-2', 'bad-token')

    expect(result).toBeNull()
    expect(mockUpdateDoc).not.toHaveBeenCalled()
  })
})
