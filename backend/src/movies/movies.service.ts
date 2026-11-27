import { Injectable } from '@nestjs/common';
import type { RowDataPacket } from 'mysql2';
import { DatabaseService } from '../database/database.service';

export interface MovieRow extends RowDataPacket {
  id: number;
  title: string;
  genre: string;
  duration: number;
  description: string;
  releaseYear: number;
  director: string;
  ageRating: string;
  poster: string | null;
  trailer: string | null;
  hasUpcomingSessions?: number;
}

export interface SessionRow extends RowDataPacket {
  id: number;
  movieId: number;
  date: string;
  time: string;
  hallId: number;
  hallName: string;
  language: string;
  subtitles: string | null;
  format: string;
}

const SELECT_MOVIES = `
  SELECT
    id,
    title,
    genre,
    duration,
    description,
    release_year AS releaseYear,
    director,
    age_rating AS ageRating,
    poster_url AS poster,
    trailer_url AS trailer
  FROM movies
`;

const SELECT_SESSIONS = `
  SELECT
    s.id,
    s.movie_id AS movieId,
    DATE_FORMAT(s.starts_at, '%Y-%m-%d') AS date,
    DATE_FORMAT(s.starts_at, '%H:%i') AS time,
    h.id AS hallId,
    h.name AS hallName,
    s.language,
    s.subtitles,
    s.format
  FROM sessions AS s
  JOIN halls AS h ON h.id = s.hall_id
`;

@Injectable()
export class MoviesService {
  constructor(private readonly database: DatabaseService) {}

  async findAll() {
    const [rows] = await this.database.pool.query<MovieRow[]>(`
      SELECT catalog.*, EXISTS (
        SELECT 1 FROM sessions AS s
        JOIN halls AS h ON h.id = s.hall_id
        WHERE s.movie_id = catalog.id AND s.starts_at > NOW()
      ) AS hasUpcomingSessions
      FROM (${SELECT_MOVIES}) AS catalog
      WHERE catalog.title NOT LIKE '[LOAD]%'
      ORDER BY catalog.id
    `);

    return rows.map((movie) => ({
      ...movie,
      hasUpcomingSessions: Boolean(movie.hasUpcomingSessions),
    }));
  }

  async findSession(movieId: number, sessionId: number) {
    const [rows] = await this.database.pool.query<SessionRow[]>(
      `${SELECT_SESSIONS} WHERE s.movie_id = ? AND s.id = ? AND s.starts_at > NOW()`,
      [movieId, sessionId],
    );
    return rows[0];
  }

  async findSessions(movieId: number) {
    const [rows] = await this.database.pool.query<SessionRow[]>(
      `${SELECT_SESSIONS} WHERE s.movie_id = ? AND s.starts_at > NOW() ORDER BY s.starts_at, s.id`,
      [movieId],
    );
    return rows;
  }

  async findOne(id: number) {
    const [rows] = await this.database.pool.query<MovieRow[]>(
      `${SELECT_MOVIES} WHERE id = ?`,
      [id],
    );
    return rows[0];
  }
}
