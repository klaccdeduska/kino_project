import 'dotenv/config';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../generated/prisma/client';

// Share one client in a script. The NestJS API still uses its existing pool.
export function createPrismaClient() {
  if (!process.env.DATABASE_URL) {
    throw new Error('Set DATABASE_URL in backend/.env first.');
  }
  const url = new URL(process.env.DATABASE_URL);
  const adapter = new PrismaMariaDb({
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: decodeURIComponent(url.pathname.slice(1)),
    connectionLimit: 5,
  });
  return new PrismaClient({ adapter });
}
