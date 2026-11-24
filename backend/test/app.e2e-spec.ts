import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { DatabaseService } from '../src/database/database.service';
import { MoviesModule } from '../src/movies/movies.module';

describe('Movie catalogue (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [MoviesModule],
    })
      .overrideProvider(DatabaseService)
      .useValue({
        pool: {
          query: jest
            .fn()
            .mockResolvedValue([[{ id: 1, hasUpcomingSessions: 1 }]]),
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/api/movies (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/movies')
      .expect(200)
      .expect([{ id: 1, hasUpcomingSessions: true }]);
  });

  afterEach(async () => {
    await app.close();
  });
});
