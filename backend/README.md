# Prisma / Backend

Languages / Keeled / Языки: [English](#english) · [Eesti](#eesti) · [Русский](#русский)

## English

﻿# Prisma practice: movies and reviews

This backend uses NestJS and MariaDB. The running movie API still uses `mysql2`; Prisma is installed alongside it for learning tables, relations, migrations, and typed queries. No new HTTP endpoints are added.

### 1. How Prisma works

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

### 2. Connect to the existing database

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

### 3. First migrations: choose the correct path

#### A. Existing kino database (normal project setup)

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

#### B. Truly empty database (no movies table)

Create an empty MariaDB database, grant your user access, and point `DATABASE_URL` at it. Do not initialize it with `movies.sql` first.

```powershell
npm.cmd run prisma:deploy
npm.cmd run prisma:generate
npm.cmd run prisma:seed
```

This applies both migrations and seeds only three movies. The Compose SQL initialization contains 12 movies; Prisma's small practice seed intentionally contains three.

#### Seed behavior

```powershell
npm.cmd run prisma:seed
# Equivalent: npx.cmd prisma db seed
```

`prisma/seed-movies.json` copies movies 1–3, including posters, from `database/movies.sql`. The script upserts by ID with an empty update: missing movies are inserted and existing records are preserved. Running it twice does not duplicate movies. It does not insert reviews or delete data. In Prisma 7, run seeding explicitly; migrations do not automatically run it.

### 4. Understand the schema and relations

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

### 5. Practice typed queries

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

### 6. Change tables with migrations

Practice adding `createdAt DateTime @default(now())` to Review, then:

```powershell
npm.cmd run prisma:migrate -- --name add_review_created_at
npm.cmd run prisma:generate
npm.cmd run prisma:seed
npm.cmd run prisma:status
```

`migrate dev` compares schemas, creates a SQL migration, and applies it locally. Review the SQL and commit the schema, configuration, migrations, package files, and seed together. Never edit a migration that has already been applied. For a teammate pulling existing migrations, run `prisma:deploy` and `prisma:generate` instead of creating the same migration again.

#### Shadow database for development

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

#### Command reference (from backend)

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

### Verification and troubleshooting

- Connection refused: start MariaDB and check port 3308.
- Access denied: check both sets of credentials; changing Compose variables does not change passwords in an existing volume.
- Missing DATABASE_URL: create/update `backend/.env` and run commands from backend.
- Table already exists: check whether the existing-table baseline was recorded before applying migrations.
- Missing generated client: run `npm.cmd run prisma:generate`.
- Shadow permission error: provision/configure `kino_shadow` as described above.

For a disposable database, verify: both migrations apply; seeding twice leaves three movies; an existing movie edit survives seeding; two reviews can reference movie 2; an invalid movie ID fails; deleting a movie with reviews fails. For the baseline path, initialize that disposable database using `movies.sql` first, record `0_init`, deploy reviews, and confirm all 12 movies are unchanged. Never use your main database for destructive verification.

The normal backend checks are `npm.cmd run build` and `npm.cmd test -- --runInBand`. The existing HTTP API should still return the same movie fields because its query code is unchanged.

Official Prisma 7 references: [MySQL/MariaDB](https://www.prisma.io/docs/orm/v7/overview/databases/mysql), [relations](https://www.prisma.io/docs/orm/v7/prisma-schema/data-model/relations), [baselining](https://www.prisma.io/docs/orm/v7/prisma-migrate/workflows/baselining), [seeding](https://www.prisma.io/docs/orm/v7/prisma-migrate/workflows/seeding), [configuration](https://www.prisma.io/docs/orm/reference/prisma-config-reference).

---

## Eesti

### Prisma harjutus: filmid ja arvustused

Backend kasutab NestJS-i ja MariaDB-d. Töötav filmide API kasutab endiselt `mysql2`; Prisma on paigaldatud kõrvale tabelite, seoste, migratsioonide ja tüübikindlate päringute õppimiseks. Uusi HTTP-otspunkte ei lisata.

### 1. Kuidas Prisma töötab

**ORM** (objektrelatsiooniline vastendus) võimaldab TypeScriptis andmebaasi kirjetega töötada objektide ja meetodite kaudu. Prisma saadab SQL-i MariaDB-le; tegelikud andmed jäävad MariaDB-sse.

1. Kirjelda tabelid failis `prisma/schema.prisma`.
2. Migratsioon muudab skeemimuudatuse versioonitud SQL-failiks ja rakendab selle andmebaasile.
3. Genereeri Prisma Client, mis pakub tüübikindlaid meetodeid ja redaktori automaattäitmist.
4. Kasuta klienti kirjete loomiseks, lugemiseks, muutmiseks ja kustutamiseks (CRUD).

Ainult skeemifaili muutmine ei muuda andmebaasi. Ka kliendi genereerimine ei loo tabeleid. **Algandmete skript** ehk seed lisab näidiskirjed, kuid ei loo tabeleid.

| Tööriist | Otstarve |
| --- | --- |
| Prisma schema | Mudelite, väljatüüpide, võtmete, indeksite ja seoste kirjeldamine |
| Prisma Client | Tüübikindlad päringud, filtrid, sortimine, seotud andmed ja tehingud |
| Prisma Migrate | Andmebaasi struktuurimuudatuste ajalugu Gitis |
| Algandmete skript | Näidisandmete eraldi lisamine |
| Prisma Studio | Kirjete visuaalne vaatamine ja muutmine; muudatused mõjutavad pärisandmeid |
| `prisma db pull` | Olemasoleva andmebaasi lugemine skeemi; võib skeemifaili üle kirjutada |

Projekt kasutab Prisma ORM-i versiooni **7** ja MariaDB adapterit. Õpetustega võrdlemisel kasuta v7 dokumentatsiooni. MariaDB puhul kasutatakse `mysql` pakkujat ja `mysql://` aadresse.

### 2. Ühendus olemasoleva andmebaasiga

Käivita Docker Desktop ja seejärel projekti juurkaustas:

```powershell
docker compose -f docker-compose.movies.yml up -d
cd backend
npm.cmd install
```

Kui faili `backend/.env` pole, kopeeri näidis:

```powershell
Copy-Item .env.example .env
```

Kui `.env` on juba olemas, säilita see ja lisa `DATABASE_URL` käsitsi. Kasuta tegelikku MariaDB parooli:

```dotenv
DATABASE_URL="mysql://kino_user:change_me@127.0.0.1:3308/kino"
```

Näidis vastab repositooriumi Compose'i vaikeseadetele. Säilita ka `DB_*` muutujad: API kasutab neid, Prisma aga `DATABASE_URL`-i. Mõlemad peavad viitama samale andmebaasile. Kodeeri parooli erimärgid URL-i jaoks (näiteks `@` → `%40`). Ära lisa `.env` faili Giti.

Kõik järgnevad npm/npx käsud käivita kaustas **backend**. macOS-is/Linuxis kasuta `npm` / `npx`, mitte `npm.cmd` / `npx.cmd`.

```powershell
npm.cmd run prisma:validate
npm.cmd run prisma:generate
```

Genereeritud kood asub kaustas `backend/generated/prisma` ja on Gitist välistatud. Genereeri see uuesti pärast skeemi muutmist või uude arvutisse paigaldamist. Prisma tööriistad on Nesti järgust välistatud, seega serveri käivituspunkt ei muutu.

### 3. Esimesed migratsioonid: vali õige tee

#### A. Olemasolev kino andmebaas (projekti tavapärane seadistus)

Docker loob uuel andmemahul tabeli `movies` failist `database/movies.sql`. Seetõttu järgib isegi äsja käivitatud Compose'i andmebaas tavaliselt **seda teed**.

Migratsioon `0_init` kirjeldab olemasolevat tabelit. Kontrolli esmalt, et tabel vastab failile `database/movies.sql` ja tabelit `reviews` veel pole. Varunda olulised andmed enne struktuuri muutmist. Kui tabel erineb, vii algmigratsioon tegeliku skeemiga vastavusse; ära nõustu lähtestamisega.

```powershell
# Kontrolli migratsiooniajalugu; enne seadistamist on nullist erinev väljumiskood ootuspärane.
npm.cmd run prisma:status
# Käivita ÜKS KORD olemasoleva movies tabeli korral, millel pole Prisma migratsiooniajalugu.
# See salvestab ajaloo ega käivita algmigratsiooni CREATE TABLE käsku.
npx.cmd prisma migrate resolve --applied 0_init
# Rakenda ootel arvustuste migratsioon.
npm.cmd run prisma:deploy
npm.cmd run prisma:generate
npm.cmd run prisma:seed
npm.cmd run prisma:status
```

Kui Prisma migratsioonide ajalugu on juba salvestatud, jäta `migrate resolve` vahele ja rakenda ainult ootel migratsioonid. Arvustuste migratsioon lisab tabeli ja välisvõtme ega kirjuta filme üle. Ära märgi `0_init` rakendatuks, kui tabelit `movies` pole.

#### B. Täiesti tühi andmebaas (movies tabelita)

Loo tühi MariaDB andmebaas, anna kasutajale ligipääs ja suuna `DATABASE_URL` sellele. Ära laadi eelnevalt faili `movies.sql`.

```powershell
npm.cmd run prisma:deploy
npm.cmd run prisma:generate
npm.cmd run prisma:seed
```

See rakendab mõlemad migratsioonid ja lisab ainult kolm filmi. Compose'i SQL-algandmetes on 12 filmi; Prisma väike õppeseed sisaldab teadlikult kolme.

#### Algandmete skripti käitumine

```powershell
npm.cmd run prisma:seed
# Samaväärne käsk: npx.cmd prisma db seed
```

`prisma/seed-movies.json` sisaldab failist `database/movies.sql` kopeeritud filme 1–3 koos plakatitega. Skript kasutab ID-põhist upsert-toimingut tühja uuendusega: puuduvad filmid lisatakse, olemasolevad säilitatakse. Teine käivitamine ei loo duplikaate. Skript ei lisa arvustusi ega kustuta andmeid. Prisma 7 puhul käivita seed eraldi; migratsioonid ei käivita seda automaatselt.

### 4. Skeem ja seosed

**Mudel** tähistab tabelit, skalaarväli veergu ning rida üht kirjet.

| Skeemi tähistus | Tähendus projektis |
| --- | --- |
| `Int`, `String` | Täisarv või tekst |
| `@id` | Primaarvõti: rea kordumatu tunnus |
| `@default(autoincrement())` | Andmebaas määrab järgmise ID (ainult Review) |
| `String?` | Valikuline tekst; veerg võib sisaldada SQL NULL-i |
| `@db.VarChar(255)` | MariaDB tekstiveerg pikkusega kuni 255 märki |
| `@map("release_year")` | TypeScriptis `releaseYear`, SQL-is `release_year` |
| `@@map("movies")` | Mudel `Movie` kasutab olemasolevat tabelit `movies` |
| `@@index([movieId])` | Indeks filmi arvustuste leidmiseks |

Filmide ID-d määratakse käsitsi, sest praeguses SQL-tabelis puudub AUTO_INCREMENT. Filmi loomisel anna kasutamata ID.

**Seos** ühendab eri tabelite kirjeid. Ühel filmil võib olla mitu arvustust; iga arvustus kuulub täpselt ühele filmile. See on seos **üks mitmele**:

```text
Movie id=2 (Interstellar)
  ├── Review id=1, movieId=2
  └── Review id=2, movieId=2
```

Seose loomiseks:

1. Anna mudelile Movie primaarvõti `id`.
2. Lisa mudelisse Review `movieId Int`. Veerg hoiab valitud filmi ID-d ehk **välisvõtit**.
3. Lisa mudelisse Review `movie Movie @relation(fields: [movieId], references: [id], onDelete: Restrict, onUpdate: Cascade)`.
4. Lisa mudelisse Movie `reviews Review[]` ehk seose teine pool.
5. Loo ja rakenda migratsioon ning genereeri klient. Repositooriumi migratsioon `1_add_reviews` teostab selle näite juba.

`movieId` on päris SQL-veerg. `movie` ja `reviews` on Prisma seostes liikumise väljad, mitte lisaveerud. Välisvõti keelab viite olematule filmile. `Restrict` keelab arvustustega filmi kustutamise; vajaduse korral kustuta esmalt selle arvustused.

Muud seosed: **üks ühele** (näiteks filmi üks valikuline lisateabe kirje) vajab unikaalset välisvõtit; **mitu mitmele** (filmid ja näitlejad) kasutab vahetabelit, sest filmis võib olla palju näitlejaid ja näitleja võib esineda paljudes filmides. Need on tulevased harjutused, mitte praeguse seadistuse lisatabelid. `director` ja `genre` jäävad tekstiväljadeks.

### 5. Tüübikindlate päringute harjutamine

Loo `prisma/practice.ts` järgmise koodiga ja käivita `npx.cmd tsx prisma/practice.ts`. Kasuta algandmetega andmebaasi. Näide loob igal käivitamisel ühe arvustuse ja muudab selle teksti.

```ts
import { createPrismaClient } from './client';

const prisma = createPrismaClient();

async function main() {
  // LOOMINE: seo uus arvustus olemasoleva filmiga.
  const review = await prisma.review.create({
    data: {
      authorName: 'Õpilane',
      text: 'Suurepärane film andmebaasiharjutuseks!',
      movie: { connect: { id: 2 } },
    },
  });

  // LUGEMINE: küsi üks film KOOS selle arvustustega.
  const movie = await prisma.movie.findUnique({
    where: { id: 2 },
    include: { reviews: true },
  });
  console.log(movie);

  // FILTREERIMINE ja SORTIMINE: ainult sobivad filmid pealkirja järjekorras.
  console.log(await prisma.movie.findMany({
    where: { releaseYear: { gte: 2020 } },
    orderBy: { title: 'asc' },
  }));

  // UUENDA eespool loodud arvustust.
  await prisma.review.update({
    where: { id: review.id },
    data: { text: 'Nüüd saan välisvõtmetest aru.' },
  });

  // KUSTUTAMINE: eemalda kommentaarimärgid ainult selle käivituse arvustuse kustutamiseks.
  // await prisma.review.delete({ where: { id: review.id } });
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => { await prisma.$disconnect(); });
```

Seotud kirjeid ei kaasata automaatselt: kasuta `include`. Olematu filmiga ühendamine ebaõnnestub. `findUnique` tagastab puuduva kirje korral `null`; `update` ja `delete` ebaõnnestuvad, kui sihtkirjet pole. Tehing (`prisma.$transaction(...)`) koondab seotud kirjutamised: need õnnestuvad või ebaõnnestuvad koos. Pidevalt töötavas rakenduses kasuta üht jagatud klienti; skriptid katkestavad ühenduse lõpetamisel. Näited töötavad backendis, mitte Vue brauserikoodis. Prisma TypeScripti tüübid ei asenda HTTP API kasutajasisendi valideerimist.

### 6. Tabelite muutmine migratsioonidega

Harjutamiseks lisa mudelisse Review `createdAt DateTime @default(now())`, seejärel:

```powershell
npm.cmd run prisma:migrate -- --name add_review_created_at
npm.cmd run prisma:generate
npm.cmd run prisma:seed
npm.cmd run prisma:status
```

`migrate dev` võrdleb skeeme, loob SQL-migratsiooni ja rakendab selle lokaalselt. Vaata SQL üle ning lisa skeem, seadistus, migratsioonid, paketifailid ja seed ühte commit'i. Ära muuda juba rakendatud migratsiooni. Olemasolevaid migratsioone alla laadiv tiimikaaslane käivitab `prisma:deploy` ja `prisma:generate`, mitte ei loo sama migratsiooni uuesti.

#### Variandmebaas arenduseks

`migrate dev` kasutab ajutist **variandmebaasi**, et ajalugu uuesti läbi mängida ja lahknevusi leida. Compose'i kasutajal `kino_user` on õigused ainult andmebaasile `kino`, mistõttu automaatne variandmebaasi loomine võib ebaõnnestuda.

Andmebaasi administraator saab luua eraldi variandmebaasi. Projekti juurkaustas:

```powershell
docker compose -f docker-compose.movies.yml exec db mariadb -u root -p
```

Sisesta Compose'i tegelik root-parool ja käivita:

```sql
CREATE DATABASE IF NOT EXISTS kino_shadow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON kino_shadow.* TO 'kino_user'@'%';
```

Lisa faili `backend/.env` tegeliku parooliga:

```dotenv
SHADOW_DATABASE_URL="mysql://kino_user:change_me@127.0.0.1:3308/kino_shadow"
```

Variandmebaasi URL PEAB viitama eraldi ajutisele andmebaasile: Prisma tühjendab selle. Ära kasuta `kino` andmebaasi variandmebaasina. `migrate deploy` ja seed ei vaja variandmebaasi.

#### Käskude ülevaade (backend kaustas)

| Käsk | Otstarve |
| --- | --- |
| `npm.cmd run prisma:validate` | Skeemi ja seadistuse kontroll |
| `npm.cmd run prisma:generate` | Tüübikindla kliendi uuendamine ilma tabelimuudatusteta |
| `npm.cmd run prisma:migrate -- --name describe_change` | Kohaliku arendusmigratsiooni loomine ja rakendamine |
| `npm.cmd run prisma:deploy` | Repositooriumi ootel migratsioonide rakendamine |
| `npm.cmd run prisma:status` | Andmebaasi migratsiooniajaloo võrdlemine failidega |
| `npm.cmd run prisma:seed` | Puuduvate näidisfilmide lisamine |
| `npm.cmd run prisma:studio` | Andmebaasi sirvimisliidese avamine |

Ära kasuta vajalike andmetega `prisma migrate reset` ega `docker compose down -v`: need kustutavad andmed. Ära kasuta selles harjutuses `db push`: migratsioonid on meie ühine ajalugu. Kui Prisma pakub lahknevuse tõttu lähtestamist, peatu ja uuri erinevust.

### Kontroll ja tõrkeotsing

- Ühendusest keelduti: käivita MariaDB ja kontrolli porti 3308.
- Ligipääs keelatud: kontrolli mõlemaid ühendusandmeid; Compose'i muutujate muutmine ei muuda olemasoleva andmemahu paroole.
- DATABASE_URL puudub: loo või uuenda `backend/.env` ja käivita käsud backend kaustas.
- Tabel on juba olemas: kontrolli, kas olemasoleva tabeli algmigratsioon märgiti enne migratsioonide rakendamist täidetuks.
- Genereeritud klient puudub: käivita `npm.cmd run prisma:generate`.
- Variandmebaasi õiguste viga: loo ja seadista `kino_shadow` eespool kirjeldatud viisil.

Kontrolli ajutises andmebaasis: mõlemad migratsioonid rakenduvad; kaks seed-käivitust jätavad kolm filmi; olemasoleva filmi muudatus säilib; kaks arvustust saavad viidata filmile 2; vigane filmi ID põhjustab vea; arvustustega filmi kustutamine ebaõnnestub. Olemasoleva baasi tee kontrollimiseks laadi esmalt ajutisse baasi `movies.sql`, märgi `0_init` rakendatuks, rakenda arvustuste migratsioon ja veendu, et kõik 12 filmi on muutmata. Ära kasuta põhiandmebaasi andmeid kustutavateks kontrollideks.

Backendi tavakontrollid on `npm.cmd run build` ja `npm.cmd test -- --runInBand`. HTTP API peab tagastama samad filmiväljad, sest päringukood ei muutu.

Prisma 7 ametlikud viited: [MySQL/MariaDB](https://www.prisma.io/docs/orm/v7/overview/databases/mysql), [seosed](https://www.prisma.io/docs/orm/v7/prisma-schema/data-model/relations), [algmigratsiooni registreerimine](https://www.prisma.io/docs/orm/v7/prisma-migrate/workflows/baselining), [algandmed](https://www.prisma.io/docs/orm/v7/prisma-migrate/workflows/seeding), [seadistus](https://www.prisma.io/docs/orm/reference/prisma-config-reference).

---

## Русский

### Практика Prisma: фильмы и отзывы

Backend использует NestJS и MariaDB. Работающий API фильмов по-прежнему использует `mysql2`; Prisma установлен рядом для изучения таблиц, связей, миграций и типизированных запросов. Новые HTTP-маршруты не добавляются.

### 1. Как работает Prisma

**ORM** (объектно-реляционное отображение) позволяет работать с записями базы из TypeScript через объекты и методы. Prisma отправляет SQL в MariaDB; сами данные по-прежнему хранятся в MariaDB.

1. Опиши таблицы в `prisma/schema.prisma`.
2. Миграция превращает изменение схемы в SQL-файл с историей версий и применяет его к базе.
3. Сгенерируй Prisma Client: он предоставляет типизированные методы и автодополнение в редакторе.
4. Используй клиент для создания, чтения, изменения и удаления записей (CRUD).

Изменение файла схемы само по себе не меняет базу. Генерация клиента тоже не создаёт таблицы. **Seed** добавляет примеры записей, но не создаёт таблицы.

| Инструмент | Назначение |
| --- | --- |
| Prisma schema | Описание моделей, типов полей, ключей, индексов и связей |
| Prisma Client | Типизированные запросы, фильтры, сортировка, связанные данные и транзакции |
| Prisma Migrate | История изменений структуры базы в Git |
| Seed-скрипт | Явное добавление примеров данных |
| Prisma Studio | Просмотр и редактирование записей; изменения затрагивают настоящие данные |
| `prisma db pull` | Чтение существующей базы в схему; может перезаписать файл схемы |

Проект использует Prisma ORM **7** и адаптер MariaDB. При сравнении с учебниками выбирай документацию v7. Для MariaDB используются провайдер `mysql` и адреса `mysql://`.

### 2. Подключение к существующей базе

Запусти Docker Desktop, затем выполни из корня проекта:

```powershell
docker compose -f docker-compose.movies.yml up -d
cd backend
npm.cmd install
```

Если `backend/.env` ещё нет, скопируй пример:

```powershell
Copy-Item .env.example .env
```

Если `.env` уже существует, сохрани его и добавь `DATABASE_URL` вручную. Укажи настоящий пароль MariaDB:

```dotenv
DATABASE_URL="mysql://kino_user:change_me@127.0.0.1:3308/kino"
```

Пример соответствует настройкам Compose в репозитории. Сохрани переменные `DB_*`: их использует API, а Prisma использует `DATABASE_URL`. Оба подключения должны вести к одной базе. Специальные символы пароля кодируй для URL (например, `@` → `%40`). Никогда не добавляй `.env` в Git.

Все дальнейшие команды npm/npx выполняются из **backend**. На macOS/Linux используй `npm` / `npx` вместо `npm.cmd` / `npx.cmd`.

```powershell
npm.cmd run prisma:validate
npm.cmd run prisma:generate
```

Сгенерированный код находится в `backend/generated/prisma` и исключён из Git. Генерируй его после изменения схемы и установки на новом компьютере. Инструменты Prisma исключены из сборки Nest, поэтому точка входа сервера остаётся прежней.

### 3. Первые миграции: выбери подходящий вариант

#### A. Существующая база kino (обычная настройка проекта)

На новом Docker volume таблица `movies` создаётся из `database/movies.sql`. Поэтому даже только что запущенная база Compose обычно относится к **этому варианту**.

Миграция `0_init` описывает существующую таблицу. Сначала проверь, что таблица соответствует `database/movies.sql` и что таблицы `reviews` ещё нет. Перед изменением структуры сохрани резервную копию важных данных. Если структура отличается, согласуй исходную миграцию с реальной схемой; не соглашайся на сброс базы.

```powershell
# Проверь историю миграций; до настройки ожидается ненулевой код завершения.
npm.cmd run prisma:status
# Выполни ОДИН РАЗ для существующей таблицы movies без истории миграций Prisma.
# Это записывает историю, но не выполняет CREATE TABLE исходной миграции.
npx.cmd prisma migrate resolve --applied 0_init
# Примени ожидающую миграцию отзывов.
npm.cmd run prisma:deploy
npm.cmd run prisma:generate
npm.cmd run prisma:seed
npm.cmd run prisma:status
```

Если история миграций Prisma уже записана, пропусти `migrate resolve` и примени только ожидающие миграции. Миграция отзывов добавляет таблицу и внешний ключ, не перезаписывая фильмы. Не отмечай `0_init` выполненной, если таблицы `movies` нет.

#### B. Полностью пустая база (без таблицы movies)

Создай пустую базу MariaDB, дай пользователю доступ и направь на неё `DATABASE_URL`. Не загружай предварительно `movies.sql`.

```powershell
npm.cmd run prisma:deploy
npm.cmd run prisma:generate
npm.cmd run prisma:seed
```

Это применяет обе миграции и добавляет только три фильма. Инициализация SQL в Compose содержит 12 фильмов; учебный seed Prisma намеренно содержит три.

#### Поведение seed

```powershell
npm.cmd run prisma:seed
# Аналогичная команда: npx.cmd prisma db seed
```

`prisma/seed-movies.json` содержит копии фильмов 1–3, включая постеры, из `database/movies.sql`. Скрипт выполняет upsert по ID с пустым обновлением: добавляет отсутствующие фильмы и сохраняет существующие записи. Повторный запуск не создаёт дубликатов. Скрипт не добавляет отзывы и не удаляет данные. В Prisma 7 seed запускается явно; миграции не запускают его автоматически.

### 4. Схема и связи

**Модель** представляет таблицу, скалярное поле — столбец, строка — одну запись.

| Обозначение | Значение в проекте |
| --- | --- |
| `Int`, `String` | Целое число или текст |
| `@id` | Первичный ключ: уникально определяет строку |
| `@default(autoincrement())` | База назначает следующий ID (только Review) |
| `String?` | Необязательный текст; столбец допускает SQL NULL |
| `@db.VarChar(255)` | Текстовый столбец MariaDB длиной до 255 символов |
| `@map("release_year")` | В TypeScript — `releaseYear`, в SQL — `release_year` |
| `@@map("movies")` | Модель `Movie` использует существующую таблицу `movies` |
| `@@index([movieId])` | Индекс для поиска отзывов фильма |

ID фильмов задаются вручную, поскольку в текущей SQL-таблице нет AUTO_INCREMENT. При создании фильма укажи свободный ID.

**Связь** соединяет записи разных таблиц. У одного фильма может быть много отзывов, а каждый отзыв относится ровно к одному фильму. Это связь **один ко многим**:

```text
Movie id=2 (Interstellar)
  ├── Review id=1, movieId=2
  └── Review id=2, movieId=2
```

Чтобы создать такую связь:

1. Добавь первичный ключ `id` модели Movie.
2. Добавь `movieId Int` модели Review. Этот столбец хранит ID выбранного фильма — **внешний ключ**.
3. Добавь в Review `movie Movie @relation(fields: [movieId], references: [id], onDelete: Restrict, onUpdate: Cascade)`.
4. Добавь в Movie поле `reviews Review[]` — обратную сторону связи.
5. Создай и примени миграцию, затем сгенерируй клиент. Сохранённая в репозитории миграция `1_add_reviews` уже реализует этот пример.

`movieId` — настоящий SQL-столбец. `movie` и `reviews` — поля навигации Prisma, а не дополнительные столбцы. Внешний ключ запрещает ссылаться на несуществующий фильм. `Restrict` запрещает удалять фильм с отзывами; при необходимости сначала удали его отзывы.

Другие связи: **один к одному** (например, одна необязательная запись с подробностями фильма) требует уникального внешнего ключа; **многие ко многим** (фильмы и актёры) использует промежуточную таблицу, поскольку у фильма много актёров, а актёр играет во многих фильмах. Это будущие упражнения, а не дополнительные таблицы текущей настройки. Поля `director` и `genre` остаются обычным текстом.

### 5. Практика типизированных запросов

Создай `prisma/practice.ts` с кодом ниже и запусти `npx.cmd tsx prisma/practice.ts`. Используй базу с выполненным seed. При каждом запуске пример создаёт один отзыв и обновляет его текст.

```ts
import { createPrismaClient } from './client';

const prisma = createPrismaClient();

async function main() {
  // СОЗДАНИЕ: свяжи новый отзыв с существующим фильмом.
  const review = await prisma.review.create({
    data: {
      authorName: 'Ученик',
      text: 'Отличный фильм для практики с базой данных!',
      movie: { connect: { id: 2 } },
    },
  });

  // ЧТЕНИЕ: получи один фильм ВМЕСТЕ с его отзывами.
  const movie = await prisma.movie.findUnique({
    where: { id: 2 },
    include: { reviews: true },
  });
  console.log(movie);

  // ФИЛЬТР И СОРТИРОВКА: подходящие фильмы в порядке названий.
  console.log(await prisma.movie.findMany({
    where: { releaseYear: { gte: 2020 } },
    orderBy: { title: 'asc' },
  }));

  // ОБНОВИ созданный выше отзыв.
  await prisma.review.update({
    where: { id: review.id },
    data: { text: 'Теперь я понимаю внешние ключи.' },
  });

  // УДАЛЕНИЕ: убери комментарий, чтобы удалить только отзыв текущего запуска.
  // await prisma.review.delete({ where: { id: review.id } });
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => { await prisma.$disconnect(); });
```

Связанные записи не загружаются автоматически: запроси их через `include`. Связь с отсутствующим фильмом завершится ошибкой. `findUnique` возвращает `null`, если записи нет; `update` и `delete` завершаются ошибкой, если цель не существует. Транзакция (`prisma.$transaction(...)`) объединяет записи: они выполняются или отменяются вместе. В постоянно работающем приложении используй один общий клиент; скрипты закрывают соединение по завершении. Код выполняется в backend, а не в браузерном Vue. Типы TypeScript в Prisma не заменяют проверку пользовательского ввода в HTTP API.

### 6. Изменение таблиц миграциями

Для практики добавь в Review `createdAt DateTime @default(now())`, затем выполни:

```powershell
npm.cmd run prisma:migrate -- --name add_review_created_at
npm.cmd run prisma:generate
npm.cmd run prisma:seed
npm.cmd run prisma:status
```

`migrate dev` сравнивает схемы, создаёт SQL-миграцию и применяет её локально. Проверь SQL и сохрани в одном коммите схему, конфигурацию, миграции, файлы пакетов и seed. Никогда не редактируй уже применённую миграцию. Если коллега получает готовые миграции, ему нужны `prisma:deploy` и `prisma:generate`, а не повторное создание той же миграции.

#### Теневая база для разработки

`migrate dev` использует временную **теневую базу** для повторного выполнения истории и поиска расхождений. Пользователь Compose `kino_user` имеет права только на `kino`, поэтому автоматическое создание теневой базы может завершиться ошибкой прав доступа.

Администратор может создать отдельную теневую базу. Из корня проекта:

```powershell
docker compose -f docker-compose.movies.yml exec db mariadb -u root -p
```

Введи настоящий пароль root из Compose, затем выполни:

```sql
CREATE DATABASE IF NOT EXISTS kino_shadow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON kino_shadow.* TO 'kino_user'@'%';
```

Добавь в `backend/.env`, указав настоящий пароль:

```dotenv
SHADOW_DATABASE_URL="mysql://kino_user:change_me@127.0.0.1:3308/kino_shadow"
```

Адрес теневой базы ОБЯЗАТЕЛЬНО должен вести к отдельной временной базе: Prisma очищает её. Никогда не используй `kino` как теневую базу. Для `migrate deploy` и seed теневая база не нужна.

#### Справочник команд (из backend)

| Команда | Назначение |
| --- | --- |
| `npm.cmd run prisma:validate` | Проверить схему и конфигурацию |
| `npm.cmd run prisma:generate` | Пересоздать типизированный клиент без изменения таблиц |
| `npm.cmd run prisma:migrate -- --name describe_change` | Создать и применить локальную миграцию разработки |
| `npm.cmd run prisma:deploy` | Применить ожидающие миграции из репозитория |
| `npm.cmd run prisma:status` | Сравнить историю миграций базы с файлами |
| `npm.cmd run prisma:seed` | Добавить отсутствующие учебные фильмы |
| `npm.cmd run prisma:studio` | Открыть интерфейс просмотра базы |

Не запускай `prisma migrate reset` или `docker compose down -v` для нужных данных: эти команды их удаляют. В этом упражнении не используй `db push`: миграции — наша общая история. Если Prisma предлагает сброс из-за расхождений, остановись и изучи разницу.

### Проверка и устранение ошибок

- Соединение отклонено: запусти MariaDB и проверь порт 3308.
- Доступ запрещён: проверь оба набора учётных данных; изменение переменных Compose не меняет пароли в существующем volume.
- Отсутствует DATABASE_URL: создай или обнови `backend/.env`, запускай команды из backend.
- Таблица уже существует: проверь регистрацию исходной миграции существующей таблицы до применения миграций.
- Нет сгенерированного клиента: выполни `npm.cmd run prisma:generate`.
- Ошибка прав теневой базы: создай и настрой `kino_shadow`, как описано выше.

На временной базе проверь: обе миграции применяются; два запуска seed оставляют три фильма; изменения существующего фильма сохраняются после seed; два отзыва могут ссылаться на фильм 2; неверный ID фильма вызывает ошибку; удаление фильма с отзывами запрещено. Для проверки существующей базы сначала загрузи `movies.sql` во временную базу, отметь `0_init`, примени миграцию отзывов и убедись, что все 12 фильмов сохранились без изменений. Никогда не используй основную базу для разрушительных проверок.

Обычные проверки backend: `npm.cmd run build` и `npm.cmd test -- --runInBand`. HTTP API должен возвращать прежние поля фильмов, поскольку код запросов не изменён.

Официальная документация Prisma 7: [MySQL/MariaDB](https://www.prisma.io/docs/orm/v7/overview/databases/mysql), [связи](https://www.prisma.io/docs/orm/v7/prisma-schema/data-model/relations), [регистрация исходной миграции](https://www.prisma.io/docs/orm/v7/prisma-migrate/workflows/baselining), [начальные данные](https://www.prisma.io/docs/orm/v7/prisma-migrate/workflows/seeding), [конфигурация](https://www.prisma.io/docs/orm/reference/prisma-config-reference).
