# Prisma practice: movies and reviews

This backend uses NestJS and MariaDB. The running movie API still uses `mysql2`; Prisma is installed alongside it for learning tables, relations, migrations, and typed queries. No new HTTP endpoints are added.

## 1. How Prisma works

An **ORM** (object-relational mapper) lets TypeScript code work with database records using objects and methods. Prisma sends SQL to MariaDB for you; MariaDB still stores the actual data.

1. Describe tables in `prisma/schema.prisma`.
2. A migration turns a schema change into a versioned SQL file and applies it to the database.
3. Generate Prisma Client from the schema. It provides typed methods and editor autocomplete.
4. Use the client to create, read, update, and delete records (CRUD).

Changing the schema file alone does not change the database. Generating the client also does not create tables. A **seed** inserts sample records; it does not create tables.

Main tools to know:

| Tool | Purpose |
| --- | --- |
| Prisma schema | Define models, field types, keys, indexes, and relations |
| Prisma Client | Typed queries, filters, sorting, related data, and transactions |
| Prisma Migrate | Keep a history of database structure changes in Git |
| Seed script | Add sample data explicitly |
| Prisma Studio | Browse and edit records visually; edits change real data |
| `prisma db pull` | Read an existing database into the schema; it can rewrite the schema file |

This project uses Prisma ORM **7** and its MariaDB adapter. Follow v7 documentation when comparing tutorials. MariaDB uses Prisma's `mysql` provider and `mysql://` URLs.

## 2. Connect to the existing database

Start Docker Desktop, then from the project root:

```powershell
docker compose -f docker-compose.movies.yml up -d
cd backend
npm.cmd install
```

If you have no `backend/.env`, copy the example:

```powershell
Copy-Item .env.example .env
```

If `.env` already exists, keep it and add `DATABASE_URL` manually. Use your actual MariaDB password:

```dotenv
DATABASE_URL="mysql://kino_user:change_me@127.0.0.1:3308/kino"
```

The example matches the checked-in Compose defaults. Keep the existing `DB_*` variables too: the API uses them, while Prisma uses `DATABASE_URL`. Both should target the same database. Percent-encode special characters in URL passwords (for example, `@` becomes `%40`). Never commit `.env`.

All remaining npm/npx commands run from **backend**. On macOS/Linux, use `npm` / `npx` instead of `npm.cmd` / `npx.cmd`.

```powershell
npm.cmd run prisma:validate
npm.cmd run prisma:generate
```

Generated code goes into `backend/generated/prisma` and is ignored by Git. Generate again after changing the schema or installing on a new computer. Prisma tooling is excluded from the Nest build so the server entry point remains unchanged.

## 3. First migrations: choose the correct path

### A. Existing kino database (normal project setup)

Docker initializes `movies` from `database/movies.sql` on a new volume. That means even a newly started Compose database normally follows **this path**.

The `0_init` migration describes the existing table. First verify that the database has the table described in `database/movies.sql` and does not already have a `reviews` table. Back up data you care about before changing database structure. If your table differs, reconcile the baseline with the real schema before proceeding; do not accept a reset prompt.

```powershell
# Inspect migration history; before setup, a nonzero status is expected.
npm.cmd run prisma:status
# Run ONCE for an existing movies table with no Prisma migration history.
# This records history; it does not execute the baseline CREATE TABLE.
npx.cmd prisma migrate resolve --applied 0_init
# Apply the pending reviews migration.
npm.cmd run prisma:deploy
npm.cmd run prisma:generate
npm.cmd run prisma:seed
npm.cmd run prisma:status
```

If Prisma migrations are already recorded, skip `migrate resolve` and apply only pending migrations. The reviews migration adds a table and foreign key; it does not rewrite movie records. Do not mark `0_init` applied if `movies` does not exist.

### B. Truly empty database (no movies table)

Create an empty MariaDB database, grant your user access, and point `DATABASE_URL` at it. Do not initialize it with `movies.sql` first.

```powershell
npm.cmd run prisma:deploy
npm.cmd run prisma:generate
npm.cmd run prisma:seed
```

This applies both migrations and seeds only three movies. The Compose SQL initialization contains 12 movies; Prisma's small practice seed intentionally contains three.

### Seed behavior

```powershell
npm.cmd run prisma:seed
# Equivalent: npx.cmd prisma db seed
```

`prisma/seed-movies.json` copies movies 1–3, including posters, from `database/movies.sql`. The script upserts by ID with an empty update: missing movies are inserted and existing records are preserved. Running it twice does not duplicate movies. It does not insert reviews or delete data. In Prisma 7, run seeding explicitly; migrations do not automatically run it.

## 4. Understand the schema and relations

A **model** represents a table. A scalar field represents a column. A row is one record.

| Schema notation | Meaning here |
| --- | --- |
| `Int`, `String` | Whole number or text |
| `@id` | Primary key: uniquely identifies a row |
| `@default(autoincrement())` | Database assigns the next ID (Review only) |
| `String?` | Optional text; the column can contain SQL NULL |
| `@db.VarChar(255)` | MariaDB text column with a maximum of 255 characters |
| `@map("release_year")` | TypeScript uses `releaseYear`; SQL uses `release_year` |
| `@@map("movies")` | Model `Movie` uses the existing table `movies` |
| `@@index([movieId])` | Index for locating a movie's reviews |

Movie IDs are assigned manually because the current SQL table has no AUTO_INCREMENT. Supply an unused ID when creating a movie.

A **relation** connects records in different tables. One movie can have many reviews; each review belongs to exactly one movie. This is a **one-to-many** relation:

```text
Movie id=2 (Interstellar)
  ├── Review id=1, movieId=2
  └── Review id=2, movieId=2
```

To make this relation:

1. Give Movie a primary key (`id`).
2. Add `movieId Int` to Review. This column stores the selected movie's ID; it is the **foreign key**.
3. Add `movie Movie @relation(fields: [movieId], references: [id], onDelete: Restrict, onUpdate: Cascade)` to Review.
4. Add `reviews Review[]` to Movie, the other side of the relation.
5. Create/apply a migration, then generate the client. The checked-in `1_add_reviews` migration already does this example.

`movieId` is a real SQL column. `movie` and `reviews` are Prisma navigation fields, not additional columns. The foreign key prevents a review from pointing to a nonexistent movie. `Restrict` prevents deleting a movie that still has reviews; delete its reviews first if that is intended.

Other relation shapes: **one-to-one**, such as a movie with one optional details record, needs a unique foreign key; **many-to-many**, such as movies and actors, uses a join table because each movie can have many actors and each actor can appear in many movies. These are future exercises, not extra tables in this setup. The current `director` and `genre` fields remain plain text.

## 5. Practice typed queries

Create `prisma/practice.ts` with the following code, then run `npx.cmd tsx prisma/practice.ts`. Use a seeded database. This example creates one review per run and updates its text.

```ts
import { createPrismaClient } from './client';

const prisma = createPrismaClient();

async function main() {
  // CREATE: connect a new review to an existing movie.
  const review = await prisma.review.create({
    data: {
      authorName: 'Student',
      text: 'A great movie for our database practice!',
      movie: { connect: { id: 2 } },
    },
  });

  // READ: get one movie AND its related reviews.
  const movie = await prisma.movie.findUnique({
    where: { id: 2 },
    include: { reviews: true },
  });
  console.log(movie);

  // FILTER and SORT: only matching movies, ordered by title.
  console.log(await prisma.movie.findMany({
    where: { releaseYear: { gte: 2020 } },
    orderBy: { title: 'asc' },
  }));

  // UPDATE the review created above.
  await prisma.review.update({
    where: { id: review.id },
    data: { text: 'Now I understand foreign keys.' },
  });

  // DELETE: uncomment to remove just the review created in this run.
  // await prisma.review.delete({ where: { id: review.id } });
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => { await prisma.$disconnect(); });
```

Relations are not included automatically: request them with `include`. A connection to a missing movie fails. `findUnique` returns `null` if no record exists; `update` and `delete` fail if their target does not exist. A transaction (`prisma.$transaction(...)`) groups related writes so they succeed or fail together. Keep one shared client in a long-running app; scripts disconnect when finished. These snippets run in the backend, never in the Vue browser code. Prisma's TypeScript types do not replace validation of user input in an HTTP API.

## 6. Change tables with migrations

Practice adding `createdAt DateTime @default(now())` to Review, then:

```powershell
npm.cmd run prisma:migrate -- --name add_review_created_at
npm.cmd run prisma:generate
npm.cmd run prisma:seed
npm.cmd run prisma:status
```

`migrate dev` compares schemas, creates a SQL migration, and applies it locally. Review the SQL and commit the schema, configuration, migrations, package files, and seed together. Never edit a migration that has already been applied. For a teammate pulling existing migrations, run `prisma:deploy` and `prisma:generate` instead of creating the same migration again.

### Shadow database for development

`migrate dev` uses a temporary **shadow database** to replay history and detect drift. The Compose `kino_user` has permissions on `kino` only, so automatic shadow database creation can fail with a permissions error.

A database administrator can provision a separate shadow database. From the project root:

```powershell
docker compose -f docker-compose.movies.yml exec db mariadb -u root -p
```

Enter the actual Compose root password, then run:

```sql
CREATE DATABASE IF NOT EXISTS kino_shadow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON kino_shadow.* TO 'kino_user'@'%';
```

Add the following to `backend/.env` using your actual password:

```dotenv
SHADOW_DATABASE_URL="mysql://kino_user:change_me@127.0.0.1:3308/kino_shadow"
```

The shadow URL MUST point to a separate disposable database: Prisma clears it. Never use `kino` as the shadow database. `migrate deploy` and seeding do not need a shadow database.

### Command reference (from backend)

| Command | Use |
| --- | --- |
| `npm.cmd run prisma:validate` | Check schema/configuration |
| `npm.cmd run prisma:generate` | Regenerate typed client; no table changes |
| `npm.cmd run prisma:migrate -- --name describe_change` | Create/apply a local development migration |
| `npm.cmd run prisma:deploy` | Apply committed pending migrations |
| `npm.cmd run prisma:status` | Compare database migration history with files |
| `npm.cmd run prisma:seed` | Insert missing sample movies |
| `npm.cmd run prisma:studio` | Open the database browser |

Do not use `prisma migrate reset` or `docker compose down -v` on data you want to keep: they delete data. Do not use `db push` for this exercise; migrations are our shared history. If Prisma asks to reset because of drift, stop and inspect the difference rather than accepting.

## Verification and troubleshooting

- Connection refused: start MariaDB and check port 3308.
- Access denied: check both sets of credentials; changing Compose variables does not change passwords in an existing volume.
- Missing DATABASE_URL: create/update `backend/.env` and run commands from backend.
- Table already exists: check whether the existing-table baseline was recorded before applying migrations.
- Missing generated client: run `npm.cmd run prisma:generate`.
- Shadow permission error: provision/configure `kino_shadow` as described above.

For a disposable database, verify: both migrations apply; seeding twice leaves three movies; an existing movie edit survives seeding; two reviews can reference movie 2; an invalid movie ID fails; deleting a movie with reviews fails. For the baseline path, initialize that disposable database using `movies.sql` first, record `0_init`, deploy reviews, and confirm all 12 movies are unchanged. Never use your main database for destructive verification.

The normal backend checks are `npm.cmd run build` and `npm.cmd test -- --runInBand`. The existing HTTP API should still return the same movie fields because its query code is unchanged.

Official Prisma 7 references: [MySQL/MariaDB](https://www.prisma.io/docs/orm/v7/overview/databases/mysql), [relations](https://www.prisma.io/docs/orm/v7/prisma-schema/data-model/relations), [baselining](https://www.prisma.io/docs/orm/v7/prisma-migrate/workflows/baselining), [seeding](https://www.prisma.io/docs/orm/v7/prisma-migrate/workflows/seeding), [configuration](https://www.prisma.io/docs/orm/reference/prisma-config-reference).
