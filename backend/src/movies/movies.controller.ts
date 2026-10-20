
import {
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
} from '@nestjs/common';

import { pool } from './movies.database';
import type { RowDataPacket } from 'mysql2';

interface MovieRow extends RowDataPacket {
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
}

interface SessionRow extends RowDataPacket {
  id: number;
  movieId: number;
  date: string;
  time: string;
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

@Controller('api/movies')
export class MoviesController {

  @Get()
  async findAll() {
    const [rows] = await pool.query<MovieRow[]>(
      `${SELECT_MOVIES} ORDER BY id`
    );

    return rows;
  }

  @Get(':id/sessions/:sessionId')
  async findSession(
    @Param('id', ParseIntPipe) movieId: number,
    @Param('sessionId', ParseIntPipe) sessionId: number
  ) {
    const [rows] = await pool.query<SessionRow[]>(
      `
      SELECT
        id,
        movie_id AS movieId,
        DATE_FORMAT(starts_at, '%Y-%m-%d') AS date,
        DATE_FORMAT(starts_at, '%H:%i') AS time
      FROM sessions
      WHERE movie_id = ? AND id = ?
    `,
      [movieId, sessionId]
    );

    const session = rows[0];

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    return session;
  }

  @Get(':id/sessions')
  async findSessions(
    @Param('id', ParseIntPipe) movieId: number
  ) {
    const [rows] = await pool.query<SessionRow[]>(
      `
      SELECT
        id,
        movie_id AS movieId,
        DATE_FORMAT(starts_at, '%Y-%m-%d') AS date,
        DATE_FORMAT(starts_at, '%H:%i') AS time
      FROM sessions
      WHERE movie_id = ?
      ORDER BY starts_at, id
    `,
      [movieId]
    );

    return rows;
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number
  ) {
    const [rows] = await pool.query<MovieRow[]>(
      `${SELECT_MOVIES} WHERE id = ?`,
      [id]
    );

    if (rows.length === 0) {
      throw new NotFoundException('Movie not found');
    }

    return rows[0];
  }
}
