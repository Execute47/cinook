import { searchMovies, searchTv, searchByEan } from './tmdb'

const mockFetch = jest.fn()
global.fetch = mockFetch

function makeResponse(body: object, ok = true) {
  return Promise.resolve({
    ok,
    status: ok ? 200 : 500,
    json: () => Promise.resolve(body),
  } as Response)
}

describe('lib/tmdb.ts', () => {
  beforeEach(() => {
    mockFetch.mockReset()
    process.env.EXPO_PUBLIC_TMDB_API_KEY = 'test-tmdb-key'
  })

  describe('searchMovies', () => {
    it('retourne un tableau de MediaResult pour des films', async () => {
      mockFetch.mockReturnValueOnce(
        makeResponse({
          results: [
            {
              id: 27205,
              title: 'Inception',
              poster_path: '/abc.jpg',
              overview: 'Un rêve dans un rêve',
              release_date: '2010-07-16',
            },
          ],
        })
      )
      const results = await searchMovies('Inception')
      expect(results).toHaveLength(1)
      expect(results[0]).toMatchObject({
        title: 'Inception',
        type: 'film',
        tmdbId: '27205',
        year: 2010,
        poster: 'https://image.tmdb.org/t/p/w500/abc.jpg',
      })
    })

    it('inclut le header Authorization', async () => {
      mockFetch.mockReturnValueOnce(makeResponse({ results: [] }))
      await searchMovies('test')
      const headers = mockFetch.mock.calls[0][1].headers as Record<string, string>
      expect(headers.Authorization).toBe('Bearer test-tmdb-key')
    })

    it('retourne un tableau vide si results est absent', async () => {
      mockFetch.mockReturnValueOnce(makeResponse({}))
      const results = await searchMovies('xyz')
      expect(results).toEqual([])
    })

    it('lève une erreur si la réponse n\'est pas ok', async () => {
      mockFetch.mockReturnValueOnce(makeResponse({}, false))
      await expect(searchMovies('test')).rejects.toThrow('TMDB movie search failed')
    })
  })

  describe('searchTv', () => {
    it('retourne un tableau de MediaResult pour des séries', async () => {
      mockFetch.mockReturnValueOnce(
        makeResponse({
          results: [
            {
              id: 1396,
              name: 'Breaking Bad',
              poster_path: null,
              overview: 'Un prof de chimie',
              first_air_date: '2008-01-20',
            },
          ],
        })
      )
      const results = await searchTv('Breaking Bad')
      expect(results[0]).toMatchObject({
        title: 'Breaking Bad',
        type: 'serie',
        tmdbId: '1396',
        year: 2008,
        poster: undefined,
      })
    })

    it('lève une erreur si la réponse n\'est pas ok', async () => {
      mockFetch.mockReturnValueOnce(makeResponse({}, false))
      await expect(searchTv('test')).rejects.toThrow('TMDB tv search failed')
    })
  })

  describe('searchByEan', () => {
    it('retourne le premier résultat pour un EAN', async () => {
      mockFetch.mockReturnValueOnce(
        makeResponse({
          results: [
            { id: 11, title: 'Star Wars', poster_path: null, overview: '', release_date: '1977-05-25' },
          ],
        })
      )
      const result = await searchByEan('3700259822718')
      expect(result).toMatchObject({ title: 'Star Wars', type: 'film', year: 1977 })
    })

    it('retourne null si aucun résultat', async () => {
      mockFetch.mockReturnValueOnce(makeResponse({ results: [] }))
      const result = await searchByEan('0000000000000')
      expect(result).toBeNull()
    })

    it('lève une erreur si la réponse n\'est pas ok', async () => {
      mockFetch.mockReturnValueOnce(makeResponse({}, false))
      await expect(searchByEan('test')).rejects.toThrow('TMDB EAN search failed')
    })
  })
})
