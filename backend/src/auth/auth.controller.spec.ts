import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { Server } from 'node:http';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { pool } from '../movies/movies.database';

jest.mock('../movies/movies.database', () => ({
  pool: { execute: jest.fn() },
}));
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed'),
  compare: jest.fn(),
}));

describe('Credentials HTTP validation', () => {
  let app: INestApplication<Server>;
  const { execute } = pool as unknown as { execute: jest.Mock };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [AuthService],
    }).compile();
    app = module.createNestApplication<INestApplication<Server>>();
    await app.init();
  });
  beforeEach(() => {
    jest.clearAllMocks();
    execute.mockReset();
  });
  afterAll(async () => app.close());

  it.each(['register', 'login'])(
    'rejects malformed %s bodies before querying the DB',
    async (action) => {
      for (const body of [
        {},
        { email: 123, password: 'password' },
        { email: 'bad', password: 'password' },
        { email: 'a@b.ee', password: 'a' },
        { email: 'a@b.ee', password: '😀'.repeat(19) },
      ]) {
        await request(app.getHttpServer())
          .post(`/api/auth/${action}`)
          .send(body)
          .expect(400);
      }
      await request(app.getHttpServer())
        .post(`/api/auth/${action}`)
        .expect(400);
      expect(execute).not.toHaveBeenCalled();
    },
  );

  it('normalizes email and reports concurrent duplicate registration as 409', async () => {
    execute.mockResolvedValueOnce([[], []] as never);
    execute.mockRejectedValueOnce({ code: 'ER_DUP_ENTRY' });
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: ' User@Example.ee ', password: 'password' })
      .expect(409);
    expect(execute).toHaveBeenNthCalledWith(1, expect.any(String), [
      'user@example.ee',
    ]);
  });
});
