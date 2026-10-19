
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
