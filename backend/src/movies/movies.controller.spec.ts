import { NotFoundException } from '@nestjs/common';
import { MoviesController } from './movies.controller';
import { pool } from './movies.database';

jest.mock('./movies.database', () => ({ pool: { query: jest.fn() } }));

describe('Upcoming sessions', () => {
  const { query } = pool as unknown as { query: jest.Mock };
  const controller = new MoviesController();
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
