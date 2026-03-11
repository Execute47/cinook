import { findDuplicate } from './duplicates'
import type { MediaItem } from '@/types/media'
import type { Timestamp } from 'firebase/firestore'

const fakeTimestamp = {} as Timestamp

function makeItem(overrides: Partial<MediaItem>): MediaItem {
  return {
    id: 'id-1',
    title: 'Default Title',
    type: 'film',
    status: 'owned',
    tier: 'none',
    addedVia: 'manual',
    addedAt: fakeTimestamp,
    ...overrides,
  }
}

describe('findDuplicate', () => {
  describe('Règle 1 — tmdbId', () => {
    it('retourne le match quand tmdbId est identique', () => {
      const items = [makeItem({ id: 'a', tmdbId: '12345', title: 'Film A', type: 'film' })]
      const result = findDuplicate(items, { title: 'Film B', type: 'film', tmdbId: '12345' })
      expect(result?.id).toBe('a')
    })

    it('ne matche pas quand tmdbId est undefined (ne pas matcher sur null/undefined)', () => {
      const items = [makeItem({ id: 'a', title: 'Film A', type: 'film' })]
      const result = findDuplicate(items, { title: 'Film Différent', type: 'film' })
      expect(result).toBeUndefined()
    })
  })

  describe('Règle 2 — googleBooksId', () => {
    it('retourne le match quand googleBooksId est identique', () => {
      const items = [makeItem({ id: 'b', googleBooksId: 'gb-abc', title: 'Dune', type: 'livre' })]
      const result = findDuplicate(items, { title: 'Autre Titre', type: 'livre', googleBooksId: 'gb-abc' })
      expect(result?.id).toBe('b')
    })

    it('ne matche pas quand googleBooksId est undefined', () => {
      const items = [makeItem({ id: 'b', title: 'Dune', type: 'livre' })]
      const result = findDuplicate(items, { title: 'Autre', type: 'livre' })
      expect(result).toBeUndefined()
    })
  })

  describe('Règle 3 — isbn', () => {
    it('retourne le match quand isbn est identique', () => {
      const items = [makeItem({ id: 'c', isbn: '978-0-06-112008-4', title: 'To Kill a Mockingbird', type: 'livre' })]
      const result = findDuplicate(items, { title: 'Autre', type: 'livre', isbn: '978-0-06-112008-4' })
      expect(result?.id).toBe('c')
    })
  })

  describe('Règle 4 — fallback titre + type', () => {
    it('match insensible à la casse avec même type', () => {
      const items = [makeItem({ id: 'd', title: 'Le Seigneur des Anneaux', type: 'livre' })]
      const result = findDuplicate(items, { title: 'le seigneur des anneaux', type: 'livre' })
      expect(result?.id).toBe('d')
    })

    it('match en ignorant les espaces en début/fin', () => {
      const items = [makeItem({ id: 'e', title: 'Inception', type: 'film' })]
      const result = findDuplicate(items, { title: '  Inception  ', type: 'film' })
      expect(result?.id).toBe('e')
    })

    it('ne matche pas si même titre mais types différents', () => {
      const items = [makeItem({ id: 'f', title: 'Dune', type: 'film' })]
      const result = findDuplicate(items, { title: 'Dune', type: 'livre' })
      expect(result).toBeUndefined()
    })
  })

  describe('Priorité des règles', () => {
    it('tmdbId a priorité sur le fallback titre', () => {
      const items = [
        makeItem({ id: 'tmdb-match', tmdbId: '999', title: 'Film Différent', type: 'film' }),
        makeItem({ id: 'title-match', title: 'Inception', type: 'film' }),
      ]
      const result = findDuplicate(items, { title: 'Inception', type: 'film', tmdbId: '999' })
      expect(result?.id).toBe('tmdb-match')
    })
  })

  describe('Cas sans doublon', () => {
    it('retourne undefined si aucun item ne correspond', () => {
      const items = [makeItem({ id: 'x', title: 'Matrix', type: 'film', tmdbId: '603' })]
      const result = findDuplicate(items, { title: 'Inception', type: 'film', tmdbId: '27205' })
      expect(result).toBeUndefined()
    })

    it('retourne undefined sur une liste vide', () => {
      const result = findDuplicate([], { title: 'Inception', type: 'film' })
      expect(result).toBeUndefined()
    })
  })
})
