# Upgrade an existing BUBLIKI database

These steps apply to databases created by older checkouts. For a new volume, use [the normal setup](../README.md#first-run).

Back up the database before making schema changes. Run Compose commands from the project root. Keep the existing volume so the database and session IDs are preserved.

## 1. Inspect the existing schema

```sh
docker compose up -d --wait
docker compose exec db mariadb -u kino_user -p kino
```

```sql
SHOW TABLES;
SHOW CREATE TABLE movies;
SHOW COLUMNS FROM sessions;
SHOW INDEX FROM halls;
SHOW INDEX FROM sessions;
```

Apply only the SQL files relevant to the current state.

| State | Files in `database/`, in order |
| --- | --- |
| `sessions` exists but `halls` and `sessions.hall_id` are missing | `halls.sql`, `add-session-halls.sql` |
| `halls` exists but `sessions.hall_id` is missing | `add-session-halls.sql` |
| All three session fields `language`, `subtitles` and `format` are missing | `add-session-details.sql` |
| The original demo schedule needs its hall assignments and five overlap fixes | `assign-session-halls.sql`, `fix-demo-schedule.sql` |

For example, copy a selected file into the container and run it from the MariaDB shell.

```sh
docker compose cp database/add-session-halls.sql db:/tmp/add-session-halls.sql
docker compose exec db mariadb -u kino_user -p kino
```

```sql
SOURCE /tmp/add-session-halls.sql;
```

Run each legacy column addition only once. If only some expected columns exist, reconcile those columns before applying another script. Use the hall assignment script only for the original demo schedule. It rewrites hall assignments. Tickets already saved in browsers retain the showtimes recorded at purchase.

## 2. Record the Prisma baseline and deploy

Confirm that `backend/.env` includes a `DATABASE_URL` for the existing database before running Prisma. See the [Prisma guide](prisma.md#2-connect-to-the-database) for connection settings.

Check `npm run prisma:status` from `backend`. For an existing table without a corresponding recorded migration, compare its definition with the migration. Record `0_init` only if the existing `movies` table matches it, and `1_add_reviews` only if the existing `reviews` table matches it. Skip a baseline command when that migration is already recorded or its table is absent. Prisma creates missing tables during deploy.

```sh
cd backend
npm run prisma:status
# Run each resolve command only when its existing table was verified.
npx prisma migrate resolve --applied 0_init
npx prisma migrate resolve --applied 1_add_reviews
npm run prisma:deploy
npm run prisma:status
cd ..
npm run setup
```

Migration 2 adds missing profile fields and scheduling indexes. Resolve duplicate hall names and duplicate hall start times before deploying. Before migration 3, check that custom ratings are `All`, `6+`, `9+`, `12+`, `15+` or `18+` and user IDs fit a signed 32-bit integer.

After deployment, restart the development servers and check the catalogue and a future session. The original schedule test (`node scripts/test-schedule.mjs`) needs the running Compose database and creates and removes a disposable test database.
