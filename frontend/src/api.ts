export interface Movie {
  id: number
  title: string
  genre: string
  duration: number
  description: string
  releaseYear: number
  director: string
  ageRating: string
  poster: string | null
  trailer: string | null
}

export interface CatalogMovie extends Movie {
  hasUpcomingSessions: boolean
}

export interface Session {
  id: number
  movieId: number
  date: string
  time: string
  hallId: number
  hallName: string
  language: string
  subtitles: string | null
  format: string
}

export class ApiError extends Error {
  constructor(readonly status: number) {
    super('API request failed')
  }
}

async function get<T>(path: string): Promise<T> {
  const response = await fetch('/api' + path)
  if (!response.ok) throw new ApiError(response.status)
  return response.json() as Promise<T>
}

export const getMovies = () => get<CatalogMovie[]>('/movies')
export const getMovie = (id: string) => get<Movie>('/movies/' + encodeURIComponent(id))
export const getSessions = (movieId: number) => get<Session[]>('/movies/' + movieId + '/sessions')
export const getSession = (movieId: number | string, sessionId: number | string) =>
  get<Session>('/movies/' + encodeURIComponent(movieId) + '/sessions/' + encodeURIComponent(sessionId))
