import { searchMedia, getMediaByBarcode } from './mediaSearch'

jest.mock('./tmdb', () => ({
  searchMovies: jest.fn(),
  searchTv: jest.fn(),
  searchByEan: jest.fn(),
}))

jest.mock('./googleBooks', () => ({
  searchBooks: jest.fn(),
  searchByIsbn: jest.fn(),
}))

import { searchMovies, searchTv, searchByEan } from './tmdb'
import { searchBooks, searchByIsbn } from './googleBooks'

const mockSearchMovies = searchMovies as jest.MockedFunction<typeof searchMovies>
const mockSearchTv = searchTv as jest.MockedFunction<typeof searchTv>
const mockSearchByEan = searchByEan as jest.MockedFunction<typeof searchByEan>
const mockSearchBooks = searchBooks as jest.MockedFunction<typeof searchBooks>
const mockSearchByIsbn = searchByIsbn as jest.MockedFunction<typeof searchByIsbn>

const filmResult = { title: 'Inception', type: 'film' as const, tmdbId: '27205' }
const serieResult = { title: 'Lost', type: 'serie' as const, tmdbId: '4809' }
const bookResult = { title: 'Clean Code', type: 'livre' as const, googleBooksId: 'abc' }

describe('lib/mediaSearch.ts', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('searchMedia', () => {
    it('type film → appelle searchMovies et retourne les résultats', async () => {
      mockSearchMovies.mockResolvedValue([filmResult])
      const res = await searchMedia({ query: 'Inception', type: 'film' })
      expect(mockSearchMovies).toHaveBeenCalledWith('Inception')
      expect(res).toEqual({ success: true, data: [filmResult] })
    })

    it('type serie → appelle searchTv', async () => {
      mockSearchTv.mockResolvedValue([serieResult])
      const res = await searchMedia({ query: 'Lost', type: 'serie' })
      expect(mockSearchTv).toHaveBeenCalledWith('Lost')
      expect(res).toEqual({ success: true, data: [serieResult] })
    })

    it('type livre → appelle searchBooks', async () => {
      mockSearchBooks.mockResolvedValue([bookResult])
      const res = await searchMedia({ query: 'Clean Code', type: 'livre' })
      expect(mockSearchBooks).toHaveBeenCalledWith('Clean Code')
      expect(res).toEqual({ success: true, data: [bookResult] })
    })

    it('erreur API → { success: false, error }', async () => {
      mockSearchMovies.mockRejectedValue(new Error('Network error'))
      const res = await searchMedia({ query: 'Inception', type: 'film' })
      expect(res).toEqual({ success: false, error: 'Service temporairement indisponible' })
    })
  })

  describe('getMediaByBarcode', () => {
    it('barcode ISBN (978) → appelle searchByIsbn', async () => {
      mockSearchByIsbn.mockResolvedValue(bookResult)
      const res = await getMediaByBarcode('9780132350884')
      expect(mockSearchByIsbn).toHaveBeenCalledWith('9780132350884')
      expect(res).toEqual({ success: true, data: bookResult })
    })

    it('barcode ISBN (979) → appelle searchByIsbn', async () => {
      mockSearchByIsbn.mockResolvedValue(bookResult)
      const res = await getMediaByBarcode('9791034901340')
      expect(mockSearchByIsbn).toHaveBeenCalledWith('9791034901340')
      expect(res).toEqual({ success: true, data: bookResult })
    })

    it('barcode EAN non-ISBN → appelle searchByEan', async () => {
      mockSearchByEan.mockResolvedValue(filmResult)
      const res = await getMediaByBarcode('3700259822718')
      expect(mockSearchByEan).toHaveBeenCalledWith('3700259822718')
      expect(res).toEqual({ success: true, data: filmResult })
    })

    it('aucun résultat → { success: false }', async () => {
      mockSearchByEan.mockResolvedValue(null)
      const res = await getMediaByBarcode('0000000000000')
      expect(res).toEqual({ success: false, error: 'Aucun résultat trouvé pour ce code-barres' })
    })

    it('erreur API → { success: false }', async () => {
      mockSearchByIsbn.mockRejectedValue(new Error('Network error'))
      const res = await getMediaByBarcode('9780132350884')
      expect(res).toEqual({ success: false, error: 'Service temporairement indisponible' })
    })
  })
})
