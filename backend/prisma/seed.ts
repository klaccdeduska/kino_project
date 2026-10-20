import movies from './seed-movies.json';
import { createPrismaClient } from './client';

const prisma = createPrismaClient();

async function main() {
  // Copied from the first three records in database/movies.sql.
  // Empty update preserves edits and existing poster/trailer values.
  for (const movie of movies) {
    await prisma.movie.upsert({
      where: { id: movie.id },
      update: {},
      create: movie,
    });
  }
  console.log('Seed complete: ensured movies 1–3 exist; existing rows preserved.');
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
