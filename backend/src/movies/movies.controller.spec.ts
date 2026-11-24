import { NotFoundException } from '@nestjs/common';
import { MoviesController } from './movies.controller';
import type { DatabaseService } from '../database/database.service';
import { MoviesService } from './movies.service';

describe('Upcoming sessions', () => {
  const query = jest.fn();
  const database = { pool: { query } } as unknown as DatabaseService;
  const controller = new MoviesController(new MoviesService(database));
  beforeEach(() => jest.resetAllMocks());

  it('returns upcoming-session availability as booleans in one catalog query', async () => {
    query.mockResolvedValue([[{ id: 1, hasUpcomingSessions: 1 }, { id: 2, hasUpcomingSessions: 0 }], []]);
    await expect(controller.findAll()).resolves.toEqual([
      { id: 1, hasUpcomingSessions: true },
      { id: 2, hasUpcomingSessions: false },
    ]);
    expect(query).toHaveBeenCalledTimes(1);
    expect(query).toHaveBeenCalledWith(expect.stringContaining('s.starts_at > NOW()'));
  });

  it('filters session lists in SQL without serving stale cached results', async () => {
    query.mockResolvedValue([[], []] as never);
    await expect(controller.findSessions(1)).resolves.toEqual([]);
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('s.starts_at > NOW()'),
      [1],
    );
  });

  it('rejects direct links to unavailable or started sessions', async () => {
    query.mockResolvedValue([[], []] as never);
    await expect(controller.findSession(1, 10)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('s.starts_at > NOW()'),
      [1, 10],
    );
  });
});
