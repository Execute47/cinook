import { searchBooks, searchByIsbn } from './googleBooks'

const mockFetch = jest.fn()
global.fetch = mockFetch

function makeResponse(body: object, ok = true) {
  return Promise.resolve({
    ok,
    status: ok ? 200 : 500,
    json: () => Promise.resolve(body),
  } as Response)
}

const mockVolume = {
  id: 'abc123',
  volumeInfo: {
    title: 'Clean Code',
    authors: ['Robert C. Martin'],
    description: 'Écrire du code propre',
    imageLinks: { thumbnail: 'https://books.google.com/cover.jpg' },
    publishedDate: '2008',
    industryIdentifiers: [{ type: 'ISBN_13', identifier: '9780132350884' }],
  },
}

describe('lib/googleBooks.ts', () => {
  beforeEach(() => {
    mockFetch.mockReset()
    process.env.EXPO_PUBLIC_GOOGLE_BOOKS_API_KEY = 'test-books-key'
  })

  describe('searchBooks', () => {
    it('retourne un tableau de MediaResult', async () => {
      mockFetch.mockReturnValueOnce(makeResponse({ items: [mockVolume] }))
      const results = await searchBooks('Clean Code')
      expect(results).toHaveLength(1)
      expect(results[0]).toMatchObject({
        title: 'Clean Code',
        type: 'livre',
        author: 'Robert C. Martin',
        googleBooksId: 'abc123',
        isbn: '9780132350884',
        year: 2008,
      })
    })

    it('inclut la clé API dans l\'URL', async () => {
      mockFetch.mockReturnValueOnce(makeResponse({ items: [] }))
      await searchBooks('test')
      const url = mockFetch.mock.calls[0][0] as string
      expect(url).toContain('key=test-books-key')
    })

    it('retourne un tableau vide si aucun item', async () => {
      mockFetch.mockReturnValueOnce(makeResponse({}))
      const results = await searchBooks('xyz')
      expect(results).toEqual([])
    })

    it('lève une erreur si la réponse n\'est pas ok', async () => {
      mockFetch.mockReturnValueOnce(makeResponse({}, false))
      await expect(searchBooks('test')).rejects.toThrow('Google Books search failed')
    })
  })

  describe('searchByIsbn', () => {
    it('retourne un MediaResult pour un ISBN valide', async () => {
      mockFetch.mockReturnValueOnce(makeResponse({ items: [mockVolume] }))
      const result = await searchByIsbn('9780132350884')
      expect(result).toMatchObject({ title: 'Clean Code', isbn: '9780132350884' })
    })

    it('construit l\'URL avec le préfixe isbn:', async () => {
      mockFetch.mockReturnValueOnce(makeResponse({ items: [] }))
      await searchByIsbn('9780132350884')
      const url = mockFetch.mock.calls[0][0] as string
      expect(url).toContain('isbn:9780132350884')
    })

    it('retourne null si aucun résultat', async () => {
      mockFetch.mockReturnValueOnce(makeResponse({}))
      const result = await searchByIsbn('0000000000000')
      expect(result).toBeNull()
    })

    it('lève une erreur si la réponse n\'est pas ok', async () => {
      mockFetch.mockReturnValueOnce(makeResponse({}, false))
      await expect(searchByIsbn('test')).rejects.toThrow('Google Books ISBN search failed')
    })
  })
})
