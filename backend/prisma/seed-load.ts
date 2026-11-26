
import 'dotenv/config';
import { createPrismaClient } from './client';

const MOVIE_COUNT = 500;
const HALL_COUNT = 20;
const SESSION_COUNT = 10_000;
const PREFIX = '[LOAD] ';

const databaseUrl = new URL(process.env.DATABASE_URL ?? '');

if (
    !['localhost', '127.0.0.1', '[::1]'].includes(databaseUrl.hostname) ||
    databaseUrl.port !== '3308'
) {
    throw new Error('Load seeding requires the local Docker database on port 3308.');
}

const prisma = createPrismaClient();

async function main() {
    console.log('Preparing load testing dataset...');

    const templateMovie = await prisma.movie.findFirst();

    if (!templateMovie) {
        throw new Error('Run the standard database seed first.');
    }

    await prisma.$transaction(async (tx) => {
        const existingMovies = await tx.movie.findMany({
            where: { title: { startsWith: PREFIX } },
        });

        const existingHalls = await tx.hall.count({
            where: { name: { startsWith: PREFIX } },
        });

        if (existingMovies.length > 0 || existingHalls > 0) {
            const existingSessions = await tx.session.count({
                where: {
                    movieId: { in: existingMovies.map((movie) => movie.id) },
                },
            });

            if (
                existingMovies.length === MOVIE_COUNT &&
                existingHalls === HALL_COUNT &&
                existingSessions === SESSION_COUNT
            ) {
                console.log('Load testing dataset already exists.');
                return;
            }

            throw new Error('An incomplete load testing dataset already exists.');
        }

        const maxMovieId = await tx.movie.aggregate({
            _max: {
                id: true,
            },
        });

        const firstMovieId = (maxMovieId._max.id ?? 0) + 1;

        await tx.movie.createMany({
            data: Array.from({ length: MOVIE_COUNT }, (_, i) => ({
                id: firstMovieId + i,
                title: `${PREFIX}Movie ${i + 1}`,
                genre: 'Action',
                duration: 120,
                description: 'Generated movie for load testing.',
                releaseYear: 2026,
                director: 'Test Director',
                ageRating: templateMovie.ageRating,
            })),
        });


        console.log(`Created ${MOVIE_COUNT} movies.`);

        await tx.hall.createMany({
            data: Array.from({ length: HALL_COUNT }, (_, i) => ({
                name: `${PREFIX}Hall ${i + 1}`,
            })),
        });

        console.log(`Created ${HALL_COUNT} halls.`);

        const movies = await tx.movie.findMany({
            where: { title: { startsWith: PREFIX } },
            orderBy: { id: 'asc' },
        });

        const halls = await tx.hall.findMany({
            where: { name: { startsWith: PREFIX } },
            orderBy: { id: 'asc' },
        });

        const startDate = new Date();
        startDate.setUTCDate(startDate.getUTCDate() + 2);
        startDate.setUTCHours(10, 0, 0, 0);

        const sessions = Array.from(
            { length: SESSION_COUNT },
            (_, i) => {
                const timeSlot = Math.floor(i / HALL_COUNT);

                return {
                    movieId: movies[i % movies.length].id,
                    hallId: halls[i % halls.length].id,
                    startsAt: new Date(
                        startDate.getTime() + timeSlot * 3 * 60 * 60 * 1000,
                    ),
                    language: 'English',
                    subtitles: 'Estonian',
                    format: '2D',
                };
            },
        );

        const batchSize = 1000;

        for (let i = 0; i < sessions.length; i += batchSize) {
            const batch = sessions.slice(i, i + batchSize);

            await tx.session.createMany({ data: batch });

            console.log(
                `Created ${Math.min(i + batchSize, SESSION_COUNT)} / ${SESSION_COUNT} sessions.`,
            );
        }
    }, { timeout: 120_000 });

    console.log('Load testing dataset is ready.');
}

main()
    .catch((error: unknown) => {
        console.error(error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
