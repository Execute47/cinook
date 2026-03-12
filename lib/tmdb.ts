import type { MediaResult } from '@/types/api'

const BASE_URL = 'https://api.themoviedb.org/3'
const POSTER_BASE = 'https://image.tmdb.org/t/p/w500'

function authHeader(): HeadersInit {
  return { Authorization: `Bearer ${process.env.EXPO_PUBLIC_TMDB_API_KEY ?? ''}` }
}

export async function searchMovies(query: string): Promise<MediaResult[]> {
  const url = `${BASE_URL}/search/movie?query=${encodeURIComponent(query)}&language=fr-FR`
  const res = await fetch(url, { headers: authHeader() })
  if (!res.ok) throw new Error(`TMDB movie search failed: ${res.status}`)
  const json = await res.json()
  return (json.results ?? []).map(mapMovie)
}

export async function searchTv(query: string): Promise<MediaResult[]> {
  const url = `${BASE_URL}/search/tv?query=${encodeURIComponent(query)}&language=fr-FR`
  const res = await fetch(url, { headers: authHeader() })
  if (!res.ok) throw new Error(`TMDB tv search failed: ${res.status}`)
  const json = await res.json()
  return (json.results ?? []).map(mapTv)
}

export async function searchByEan(ean: string): Promise<MediaResult | null> {
  const url = `${BASE_URL}/search/movie?query=${encodeURIComponent(ean)}&language=fr-FR`
  const res = await fetch(url, { headers: authHeader() })
  if (!res.ok) throw new Error(`TMDB EAN search failed: ${res.status}`)
  const json = await res.json()
  const first = (json.results ?? [])[0]
  return first ? mapMovie(first) : null
}

export async function getMovieDirector(tmdbId: string): Promise<string | undefined> {
  try {
    const url = `${BASE_URL}/movie/${tmdbId}/credits?language=fr-FR`
    const res = await fetch(url, { headers: authHeader() })
    if (!res.ok) return undefined
    const json = await res.json()
    const director = (json.crew ?? []).find((p: { job: string }) => p.job === 'Director')
    return director?.name ?? undefined
  } catch (e) {
    console.error('getMovieDirector failed:', e)
    return undefined
  }
}

export async function getNowPlaying(): Promise<MediaResult[]> {
  const url = `${BASE_URL}/movie/now_playing?language=fr-FR&page=1`
  const res = await fetch(url, { headers: authHeader() })
  if (!res.ok) throw new Error(`TMDB now_playing failed: ${res.status}`)
  const json = await res.json()
  return (json.results ?? []).map(mapMovie)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapMovie(item: any): MediaResult {
  return {
    title: item.title ?? '',
    type: 'film',
    poster: item.poster_path ? `${POSTER_BASE}${item.poster_path}` : undefined,
    synopsis: item.overview || undefined,
    year: item.release_date ? parseInt(item.release_date.slice(0, 4), 10) : undefined,
    releaseDate: item.release_date || undefined,
    tmdbId: String(item.id),
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapTv(item: any): MediaResult {
  return {
    title: item.name ?? '',
    type: 'serie',
    poster: item.poster_path ? `${POSTER_BASE}${item.poster_path}` : undefined,
    synopsis: item.overview || undefined,
    year: item.first_air_date ? parseInt(item.first_air_date.slice(0, 4), 10) : undefined,
    tmdbId: String(item.id),
  }
}
