import {
  BadGatewayException,
  Controller,
  Get,
} from '@nestjs/common';

interface ApolloMovie {
  ID: number;
  Title: string;
  LengthInMinutes: number;
  Genres: string;
  ShortSynopsis?: string;
  Images?: {
    EventLargeImagePortrait?: string | null;
    EventMediumImagePortrait?: string | null;
  };
}

@Controller('api/movies')
export class MoviesController {
  @Get()
  async findAll() {
    try {
      const response = await fetch(
        'https://www.apollokino.ee/xml/Events',
        {
          headers: { Accept: 'application/json' },
          signal: AbortSignal.timeout(10000),
        },
      );

      if (!response.ok) {
        throw new Error(`Apollo: HTTP ${response.status}`);
      }

      const data: unknown = await response.json();

      if (!Array.isArray(data)) {
        throw new Error('Apollo API response is not an array');
      }

      return (data as ApolloMovie[]).map((movie) => ({
        id: movie.ID,
        title: movie.Title,
        duration: movie.LengthInMinutes,
        genre: movie.Genres,
        description: movie.ShortSynopsis ?? '',
        poster:
          movie.Images?.EventLargeImagePortrait ??
          movie.Images?.EventMediumImagePortrait ??
          null,
      }));
    } catch (error) {
      console.error('Ошибка Apollo API:', error);
      throw new BadGatewayException(
        'Could not fetch movies from Apollo API. Please try again later.',
      );
    }
  }
}