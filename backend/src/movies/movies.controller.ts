import {
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { MoviesService } from './movies.service';

@Controller('api/movies')
export class MoviesController {
  constructor(private readonly movies: MoviesService) {}

  @Get()
  findAll() {
    return this.movies.findAll();
  }

  @Get(':id/sessions/:sessionId')
  async findSession(
    @Param('id', ParseIntPipe) movieId: number,
    @Param('sessionId', ParseIntPipe) sessionId: number,
  ) {
    const session = await this.movies.findSession(movieId, sessionId);
    if (!session) throw new NotFoundException('Session not found');
    return session;
  }

  @Get(':id/sessions')
  findSessions(@Param('id', ParseIntPipe) movieId: number) {
    return this.movies.findSessions(movieId);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const movie = await this.movies.findOne(id);
    if (!movie) throw new NotFoundException('Movie not found');
    return movie;
  }
}
