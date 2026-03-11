import type { MediaType } from './media'

export type FunctionResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string }

export interface MediaResult {
  title: string
  type: MediaType
  poster?: string
  synopsis?: string
  director?: string
  author?: string
  year?: number
  releaseDate?: string
  tmdbId?: string
  googleBooksId?: string
  isbn?: string
}

export interface SearchParams {
  query: string
  type: MediaType
}
