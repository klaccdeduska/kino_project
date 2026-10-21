# BOOBLICKI — Cinema Project

[English](#english) · [Eesti](#eesti) · [Русский](#русский)

## English

### Halls: updating an existing database

Sessions now include `hallId` and `hallName`; both movie and booking pages display the hall. Date buttons, the calendar filter, and shared date/end-time formatting are also available. Seat layouts remain a separate feature.

After pulling the latest code, check your database in the MariaDB shell: `SHOW TABLES LIKE 'halls';` and `SHOW COLUMNS FROM sessions LIKE 'hall_id';`. If both already exist, skip the imports below. If sessions exist but halls and `hall_id` do not, run from the project root:

```powershell
docker compose -f docker-compose.movies.yml cp database/halls.sql db:/tmp/halls.sql
docker compose -f docker-compose.movies.yml cp database/add-session-halls.sql db:/tmp/add-session-halls.sql
docker compose -f docker-compose.movies.yml exec db mariadb -u kino_user -p kino
```

Enter your local database password, then run once:

```sql
SOURCE /tmp/halls.sql;
SOURCE /tmp/add-session-halls.sql;
SELECT s.id, s.hall_id, h.name FROM sessions AS s JOIN halls AS h ON h.id = s.hall_id;
exit;
```

This assigns existing sessions to Hall 1. Do not re-import `sessions.sql` or delete the Docker volume. If halls already exist but `hall_id` is missing, run only `add-session-halls.sql`. Repeating `halls.sql` duplicates halls; repeating the migration fails on the existing column. Restart the backend and check `/api/movies/1/sessions` for `hallId` and `hallName`.

For a **new database**, follow first-run instructions below: movies → halls → sessions → users. Do not run `add-session-halls.sql` on the new schema. The current session seed uses hall IDs 1 and 2: verify them with `SELECT id, name FROM halls;` and adjust the seed if your IDs differ. The SQL files are manual imports; Compose currently initializes only movies. Halls are not yet part of the Prisma schema, so inspect generated migrations before applying schema changes.

Educational cinema website: movies, sessions, seat selection, registration, and demo ticket purchases.

**Stack:** Vue 3 · TypeScript · NestJS · MariaDB · Docker.

Commands use **Windows PowerShell**. On macOS/Linux, use `npm` / `npx` instead of `npm.cmd` / `npx.cmd`.

### 1. Installation and first run

**Distribute existing demo sessions between halls:** after adding `hall_id`, run the following from the project root. If the schema is already updated, skip the hall creation and migration above and run only this step.

```powershell
docker compose -f docker-compose.movies.yml cp database/assign-session-halls.sql db:/tmp/assign-session-halls.sql
docker compose -f docker-compose.movies.yml exec db mariadb -u kino_user -p kino
```

In MariaDB:

```sql
SOURCE /tmp/assign-session-halls.sql;
SELECT s.movie_id, s.starts_at, h.name FROM sessions AS s JOIN halls AS h ON h.id = s.hall_id ORDER BY s.movie_id, s.starts_at;
exit;
```

The script updates existing records without changing session IDs or inserting duplicates. It is specific to the demo schedule and overwrites hall assignments for all sessions; do not use it on a customized schedule. Each of `Hall 1` and `Hall 2` must exist exactly once. On a fresh database, `sessions.sql` already assigns halls, so this step is unnecessary. Refresh the website after updating. Scheduling conflicts in the same hall are not checked yet.

Install **Node.js 24.12+**, **Git**, and **Docker Desktop**. For development: VS Code + Vue (Official) extension.

Clone the project and install dependencies:

```powershell
git clone https://github.com/klaccdeduska/kino_project.git
cd kino_project
npm.cmd ci --prefix backend
npm.cmd ci --prefix frontend
```

Start Docker Desktop, then run from the project root:

```powershell
docker compose -f docker-compose.movies.yml up -d
```

On a new empty Docker volume, this creates the `kino` database with 12 movies. Wait until MariaDB is ready before importing SQL.

Create `backend/.env`:

```dotenv
DB_HOST=127.0.0.1
DB_PORT=3308
DB_USER=kino_user
DB_PASSWORD=YOUR_PASSWORD
DB_NAME=kino
DATABASE_URL="mysql://kino_user:YOUR_PASSWORD@127.0.0.1:3308/kino"
```

Replace `YOUR_PASSWORD` with `MARIADB_PASSWORD` from Compose, or the current password of an existing database. URL-encode special characters in the URL: for example, `@` → `%40`. **Do not commit `.env`.**

Add sessions and the users table from the project root:

```powershell
docker compose -f docker-compose.movies.yml cp database/halls.sql db:/tmp/halls.sql
docker compose -f docker-compose.movies.yml cp database/sessions.sql db:/tmp/sessions.sql
docker compose -f docker-compose.movies.yml cp database/users.sql db:/tmp/users.sql
docker compose -f docker-compose.movies.yml exec db mariadb -u kino_user -p kino
```

Enter the password, then run in MariaDB:

```sql
SOURCE /tmp/halls.sql;
SOURCE /tmp/sessions.sql;
SOURCE /tmp/users.sql;
exit;
```

**Import sessions once, only when the table is missing or empty:** importing again creates duplicates. Continue with the next section.

### 2. Daily startup

Start Docker Desktop. Run these commands **from the project root**, using separate terminals for backend and frontend:

```powershell
# Database
docker compose -f docker-compose.movies.yml up -d
```

```powershell
# Backend
npm.cmd --prefix backend run start:dev
```

```powershell
# Frontend
npm.cmd --prefix frontend run dev
```

- **Website:** http://localhost:5173
- **API:** http://localhost:3000/api/movies

Keep backend and frontend running. Stop them with `Ctrl+C`. Stop the database while keeping its data:

```powershell
docker compose -f docker-compose.movies.yml stop
```

### 3. Updating the project

Save local changes with a commit or `git stash`, then run from the root:

```powershell
git pull
```

If dependencies changed:

```powershell
npm.cmd ci --prefix backend
npm.cmd ci --prefix frontend
```

If new Prisma migrations were added and Prisma is already configured, with the database running:

```powershell
cd backend
npm.cmd run prisma:deploy
npm.cmd run prisma:generate
cd ..
```

Apply new SQL scripts separately according to the change instructions. Restart backend and frontend afterwards.

**Neither `git pull` nor restarting Docker updates the database automatically.**

### 4. Working with the database

Open the SQL console from the root:

```powershell
docker compose -f docker-compose.movies.yml exec db mariadb -u kino_user -p kino
```

```sql
SHOW TABLES;
SELECT id, title FROM movies;
SELECT * FROM sessions;
SELECT id, email FROM users;
exit;
```

#### Prisma

Run commands from `backend`. Initial setup, baselining an existing database, and shadow database configuration are covered in [backend/README.md](backend/README.md#english).

| Command | Purpose |
|---|---|
| `npm.cmd run prisma:studio` | Open the data editor |
| `npm.cmd run prisma:status` | Check migrations |
| `npm.cmd run prisma:deploy` | Apply existing migrations |
| `npm.cmd run prisma:generate` | Regenerate Prisma Client |
| `npm.cmd run prisma:migrate -- --name describe_change` | Create a migration after changing the schema; requires a shadow database |
| `npm.cmd run prisma:seed` | Insert missing practice movies 1–3 |

Studio shows Prisma models: currently movies and reviews. Access sessions and users through SQL. Open the URL printed in the terminal; stop Studio with `Ctrl+C`. Saved edits change database records.

To apply an SQL file, copy it into the container and open the console. For example, update posters:

```powershell
docker compose -f docker-compose.movies.yml cp database/update_posters.sql db:/tmp/update_posters.sql
docker compose -f docker-compose.movies.yml exec db mariadb -u kino_user -p kino
```

Then in MariaDB:

```sql
SOURCE /tmp/update_posters.sql;
exit;
```

**Data persists in the Docker volume. `docker compose -f docker-compose.movies.yml down -v` and `prisma migrate reset` delete it.** Changing the password in Compose does not change an existing database password.

### 5. Checks and common errors

From the project root:

```powershell
# Build
npm.cmd --prefix backend run build
npm.cmd --prefix frontend run build

# Tests
npm.cmd --prefix backend test -- --runInBand
npm.cmd --prefix frontend run test:unit -- --run

# Database status and logs
docker compose -f docker-compose.movies.yml ps
docker compose -f docker-compose.movies.yml logs --tail 100 db
```

| Problem | Check |
|---|---|
| Database unavailable | Docker Desktop, container, port `3308` |
| `Access denied` | Password and settings in `backend/.env` |
| Missing sessions / users table | Import `sessions.sql` / `users.sql` |
| API unavailable | Backend process and terminal errors |
| API works, website cannot load data | Frontend port: CORS allows `5173` |
| Prisma: table already exists | Initial migration setup in `backend/README.md` |

---

## Eesti

### Saalid: olemasoleva andmebaasi uuendamine

Seansid sisaldavad nüüd välju `hallId` ja `hallName`; saali kuvatakse filmide ning kohtade valimise lehel. Lisatud on kuupäevanupud, kalendrifilter ja ühine kuupäeva/lõpuaja vormindus. Istekohtade plaan on eraldi arendus.

Pärast koodi uuendamist kontrolli MariaDB konsoolis: `SHOW TABLES LIKE 'halls';` ja `SHOW COLUMNS FROM sessions LIKE 'hall_id';`. Kui mõlemad on olemas, jäta import vahele. Kui seansid on olemas, kuid saalid ja `hall_id` puuduvad, käivita projekti juurkaustas:

```powershell
docker compose -f docker-compose.movies.yml cp database/halls.sql db:/tmp/halls.sql
docker compose -f docker-compose.movies.yml cp database/add-session-halls.sql db:/tmp/add-session-halls.sql
docker compose -f docker-compose.movies.yml exec db mariadb -u kino_user -p kino
```

Sisesta kohaliku andmebaasi parool ja käivita üks kord:

```sql
SOURCE /tmp/halls.sql;
SOURCE /tmp/add-session-halls.sql;
SELECT s.id, s.hall_id, h.name FROM sessions AS s JOIN halls AS h ON h.id = s.hall_id;
exit;
```

Olemasolevad seansid määratakse saali Hall 1. Ära impordi uuesti `sessions.sql` ega kustuta Docker volume'it. Kui saalid on juba olemas, kuid `hall_id` puudub, käivita ainult `add-session-halls.sql`. Saalide korduv import tekitab duplikaate; migratsiooni kordamine annab olemasoleva veeru vea. Taaskäivita backend ja kontrolli aadressil `/api/movies/1/sessions` välju `hallId` ja `hallName`.

**Uue andmebaasi** järjekord on allolevas juhendis: filmid → saalid → seansid → kasutajad. Uuel skeemil ära käivita `add-session-halls.sql`. Seansifail kasutab saalide ID-sid 1 ja 2: kontrolli neid käsuga `SELECT id, name FROM halls;` ning vajadusel muuda seansifaili. SQL-failid imporditakse käsitsi; Compose loob praegu ainult filmid. Saale pole veel Prisma skeemis, seega kontrolli genereeritud migratsioone enne skeemimuudatuste rakendamist.

Õppeprojektina loodud kino veebileht: filmid, seansid, istekohtade valik, registreerimine ja näitlik piletiost.

**Tehnoloogiad:** Vue 3 · TypeScript · NestJS · MariaDB · Docker.

Käsud on mõeldud **Windows PowerShellile**. macOS-is/Linuxis kasuta `npm` / `npx` käskude `npm.cmd` / `npx.cmd` asemel.

### 1. Paigaldamine ja esimene käivitus

**Olemasolevate näidisseansside jaotamine saalidesse:** pärast `hall_id` lisamist käivita projekti juurkaustas järgmised käsud. Kui skeem on juba uuendatud, jäta ülalolev saalide loomine ja migratsioon vahele ning tee ainult see samm.

```powershell
docker compose -f docker-compose.movies.yml cp database/assign-session-halls.sql db:/tmp/assign-session-halls.sql
docker compose -f docker-compose.movies.yml exec db mariadb -u kino_user -p kino
```

MariaDB konsoolis:

```sql
SOURCE /tmp/assign-session-halls.sql;
SELECT s.movie_id, s.starts_at, h.name FROM sessions AS s JOIN halls AS h ON h.id = s.hall_id ORDER BY s.movie_id, s.starts_at;
exit;
```

Skript uuendab kirjeid, säilitades seansside ID-d ega lisa duplikaate. See on mõeldud näidiskavale ja kirjutab kõigi seansside saalimäärangud üle; ära kasuta seda kohandatud kava puhul. Saalid `Hall 1` ja `Hall 2` peavad kumbki olemas olema täpselt üks kord. Uues andmebaasis määrab `sessions.sql` saalid juba ise, seega seda sammu pole vaja. Pärast uuendamist värskenda veebilehte. Samas saalis kattuvaid seansse veel ei kontrollita.

Paigalda **Node.js 24.12+**, **Git** ja **Docker Desktop**. Arendamiseks: VS Code + laiendus Vue (Official).

Laadi projekt alla ja paigalda sõltuvused:

```powershell
git clone https://github.com/klaccdeduska/kino_project.git
cd kino_project
npm.cmd ci --prefix backend
npm.cmd ci --prefix frontend
```

Käivita Docker Desktop, seejärel projekti juurkaustas:

```powershell
docker compose -f docker-compose.movies.yml up -d
```

Uuele tühjale Docker volume'ile luuakse automaatselt andmebaas `kino` koos 12 filmiga. Enne SQL-i importimist oota, kuni MariaDB on valmis.

Loo `backend/.env`:

```dotenv
DB_HOST=127.0.0.1
DB_PORT=3308
DB_USER=kino_user
DB_PASSWORD=YOUR_PASSWORD
DB_NAME=kino
DATABASE_URL="mysql://kino_user:YOUR_PASSWORD@127.0.0.1:3308/kino"
```

Asenda `YOUR_PASSWORD` Compose'i väärtusega `MARIADB_PASSWORD` või olemasoleva andmebaasi kehtiva parooliga. URL-is kodeeri erimärgid: näiteks `@` → `%40`. **Ära lisa `.env` faili Giti.**

Lisa seansid ja kasutajate tabel projekti juurkaustast:

```powershell
docker compose -f docker-compose.movies.yml cp database/halls.sql db:/tmp/halls.sql
docker compose -f docker-compose.movies.yml cp database/sessions.sql db:/tmp/sessions.sql
docker compose -f docker-compose.movies.yml cp database/users.sql db:/tmp/users.sql
docker compose -f docker-compose.movies.yml exec db mariadb -u kino_user -p kino
```

Sisesta parool, seejärel MariaDB-s:

```sql
SOURCE /tmp/halls.sql;
SOURCE /tmp/sessions.sql;
SOURCE /tmp/users.sql;
exit;
```

**Impordi seansid üks kord, ainult puuduva või tühja tabeli korral:** korduv import lisab duplikaate. Jätka järgmise jaotisega.

### 2. Igapäevane käivitamine

Käivita Docker Desktop. Käivita käsud **projekti juurkaustast**, backend ja frontend eraldi terminalides:

```powershell
# Andmebaas
docker compose -f docker-compose.movies.yml up -d
```

```powershell
# Backend
npm.cmd --prefix backend run start:dev
```

```powershell
# Frontend
npm.cmd --prefix frontend run dev
```

- **Veebileht:** http://localhost:5173
- **API:** http://localhost:3000/api/movies

Hoia backend ja frontend töös. Peatamiseks vajuta `Ctrl+C`. Andmebaasi peatamine andmeid säilitades:

```powershell
docker compose -f docker-compose.movies.yml stop
```

### 3. Projekti uuendamine

Salvesta oma muudatused commit'iga või käsuga `git stash`, seejärel juurkaustas:

```powershell
git pull
```

Kui sõltuvused muutusid:

```powershell
npm.cmd ci --prefix backend
npm.cmd ci --prefix frontend
```

Kui lisati Prisma migratsioone ja Prisma on juba seadistatud, käivita töötava andmebaasiga:

```powershell
cd backend
npm.cmd run prisma:deploy
npm.cmd run prisma:generate
cd ..
```

Rakenda uued SQL-skriptid eraldi muudatuse juhiste järgi. Seejärel taaskäivita backend ja frontend.

**`git pull` ega Dockeri taaskäivitamine ei uuenda andmebaasi automaatselt.**

### 4. Töö andmebaasiga

Ava SQL-konsool juurkaustast:

```powershell
docker compose -f docker-compose.movies.yml exec db mariadb -u kino_user -p kino
```

```sql
SHOW TABLES;
SELECT id, title FROM movies;
SELECT * FROM sessions;
SELECT id, email FROM users;
exit;
```

#### Prisma

Käivita käsud kaustas `backend`. Esmane seadistamine, olemasoleva andmebaasi algmigratsiooni registreerimine ja variandmebaasi seadistamine on kirjeldatud failis [backend/README.md](backend/README.md#eesti).

| Käsk | Otstarve |
|---|---|
| `npm.cmd run prisma:studio` | Ava andmete redaktor |
| `npm.cmd run prisma:status` | Kontrolli migratsioone |
| `npm.cmd run prisma:deploy` | Rakenda olemasolevad migratsioonid |
| `npm.cmd run prisma:generate` | Genereeri Prisma Client uuesti |
| `npm.cmd run prisma:migrate -- --name describe_change` | Loo migratsioon pärast skeemi muutmist; nõuab variandmebaasi |
| `npm.cmd run prisma:seed` | Lisa puuduvad õppefilmid 1–3 |

Studio kuvab Prisma mudeleid: praegu filme ja arvustusi. Seansside ja kasutajatega tööta SQL-i kaudu. Ava terminalis kuvatud aadress; Studio peatamiseks vajuta `Ctrl+C`. Salvestatud muudatused muudavad andmebaasi kirjeid.

SQL-faili rakendamiseks kopeeri see konteinerisse ja ava konsool. Näiteks plakatite uuendamine:

```powershell
docker compose -f docker-compose.movies.yml cp database/update_posters.sql db:/tmp/update_posters.sql
docker compose -f docker-compose.movies.yml exec db mariadb -u kino_user -p kino
```

Seejärel MariaDB-s:

```sql
SOURCE /tmp/update_posters.sql;
exit;
```

**Andmed säilivad Dockeri volume'is. `docker compose -f docker-compose.movies.yml down -v` ja `prisma migrate reset` kustutavad need.** Parooli muutmine Compose'is ei muuda olemasoleva andmebaasi parooli.

### 5. Kontroll ja levinud vead

Projekti juurkaustast:

```powershell
# Koostamine
npm.cmd --prefix backend run build
npm.cmd --prefix frontend run build

# Testid
npm.cmd --prefix backend test -- --runInBand
npm.cmd --prefix frontend run test:unit -- --run

# Andmebaasi olek ja logid
docker compose -f docker-compose.movies.yml ps
docker compose -f docker-compose.movies.yml logs --tail 100 db
```

| Probleem | Mida kontrollida |
|---|---|
| Andmebaas pole kättesaadav | Docker Desktop, konteiner, port `3308` |
| `Access denied` | Parool ja seaded failis `backend/.env` |
| Seansid / kasutajate tabel puuduvad | Failide `sessions.sql` / `users.sql` import |
| API pole kättesaadav | Backend ja vead selle terminalis |
| API töötab, veebileht ei laadi andmeid | Frontendi port: CORS lubab porti `5173` |
| Prisma: tabel on juba olemas | Migratsioonide esmane seadistamine failis `backend/README.md` |

---

## Русский

### Залы: обновление существующей базы

Сеансы теперь содержат `hallId` и `hallName`; зал отображается в списке фильмов и на странице выбора мест. Также добавлены кнопки дат, фильтр календаря и общее форматирование даты и времени окончания. Схема мест разрабатывается отдельно.

После получения свежего кода проверьте в консоли MariaDB: `SHOW TABLES LIKE 'halls';` и `SHOW COLUMNS FROM sessions LIKE 'hall_id';`. Если таблица и поле уже есть, импорт ниже пропустите. Если сеансы есть, а залов и `hall_id` ещё нет, выполните из корня проекта:

```powershell
docker compose -f docker-compose.movies.yml cp database/halls.sql db:/tmp/halls.sql
docker compose -f docker-compose.movies.yml cp database/add-session-halls.sql db:/tmp/add-session-halls.sql
docker compose -f docker-compose.movies.yml exec db mariadb -u kino_user -p kino
```

Введите пароль локальной базы, затем выполните один раз:

```sql
SOURCE /tmp/halls.sql;
SOURCE /tmp/add-session-halls.sql;
SELECT s.id, s.hall_id, h.name FROM sessions AS s JOIN halls AS h ON h.id = s.hall_id;
exit;
```

Существующие сеансы получат Hall 1. Не импортируйте повторно `sessions.sql` и не удаляйте Docker volume. Если залы уже созданы, но `hall_id` отсутствует, выполните только `add-session-halls.sql`. Повторный импорт залов создаёт дубликаты, а повторная миграция завершается ошибкой существующего столбца. Перезапустите backend и проверьте поля `hallId` и `hallName` в `/api/movies/1/sessions`.

Для **новой базы** используйте инструкцию первого запуска ниже: фильмы → залы → сеансы → пользователи. На новой схеме `add-session-halls.sql` не нужен. В файле сеансов используются ID залов 1 и 2: проверьте их через `SELECT id, name FROM halls;` и при отличиях исправьте файл сеансов. SQL-файлы импортируются вручную; Compose сейчас создаёт только фильмы. Залы пока не описаны в схеме Prisma, поэтому перед применением изменений схемы проверяйте сгенерированные миграции.
Учебный сайт кинотеатра: фильмы, сеансы, выбор мест, регистрация и демонстрационная покупка билетов.

**Стек:** Vue 3 · TypeScript · NestJS · MariaDB · Docker.

Команды — для **Windows PowerShell**. На macOS/Linux используй `npm` / `npx` вместо `npm.cmd` / `npx.cmd`.

### 1. Установка и первый запуск

**Распределение существующих учебных сеансов по залам:** после добавления `hall_id` выполните из корня проекта команды ниже. Если схема уже обновлена, пропустите создание залов и миграцию выше — нужен только этот шаг.

```powershell
docker compose -f docker-compose.movies.yml cp database/assign-session-halls.sql db:/tmp/assign-session-halls.sql
docker compose -f docker-compose.movies.yml exec db mariadb -u kino_user -p kino
```

В консоли MariaDB:

```sql
SOURCE /tmp/assign-session-halls.sql;
SELECT s.movie_id, s.starts_at, h.name FROM sessions AS s JOIN halls AS h ON h.id = s.hall_id ORDER BY s.movie_id, s.starts_at;
exit;
```

Скрипт обновляет записи, сохраняя ID сеансов и не добавляя дубликатов. Он рассчитан на учебное расписание и перезаписывает назначения залов всех сеансов; для собственного расписания его использовать не нужно. Залы `Hall 1` и `Hall 2` должны существовать каждый ровно в одном экземпляре. В новой базе `sessions.sql` уже назначает залы, поэтому этот шаг не нужен. После обновления перезагрузите страницу сайта. Пересечения показов в одном зале пока не проверяются.

Установи **Node.js 24.12+**, **Git**, **Docker Desktop**. Для разработки: VS Code + расширение Vue (Official).

Скачай проект и установи зависимости:

```powershell
git clone https://github.com/klaccdeduska/kino_project.git
cd kino_project
npm.cmd ci --prefix backend
npm.cmd ci --prefix frontend
```

Запусти Docker Desktop, затем из корня проекта:

```powershell
docker compose -f docker-compose.movies.yml up -d
```

На новом пустом Docker volume автоматически создаётся база `kino` с 12 фильмами. Дождись готовности MariaDB перед импортом SQL.

Создай `backend/.env`:

```dotenv
DB_HOST=127.0.0.1
DB_PORT=3308
DB_USER=kino_user
DB_PASSWORD=YOUR_PASSWORD
DB_NAME=kino
DATABASE_URL="mysql://kino_user:YOUR_PASSWORD@127.0.0.1:3308/kino"
```

`YOUR_PASSWORD` — значение `MARIADB_PASSWORD` из Compose, для существующей базы — её действующий пароль. Спецсимволы в URL кодируются: например, `@` → `%40`. **Не добавляй `.env` в Git.**

Добавь сеансы и таблицу пользователей из корня проекта:

```powershell
docker compose -f docker-compose.movies.yml cp database/halls.sql db:/tmp/halls.sql
docker compose -f docker-compose.movies.yml cp database/sessions.sql db:/tmp/sessions.sql
docker compose -f docker-compose.movies.yml cp database/users.sql db:/tmp/users.sql
docker compose -f docker-compose.movies.yml exec db mariadb -u kino_user -p kino
```

Введи пароль, затем в MariaDB:

```sql
SOURCE /tmp/halls.sql;
SOURCE /tmp/sessions.sql;
SOURCE /tmp/users.sql;
exit;
```

**Сеансы импортируй один раз в отсутствующую или пустую таблицу:** повторный импорт создаёт дубликаты. Затем запусти проект по следующему разделу.

### 2. Повседневный запуск

Запусти Docker Desktop. Команды выполняй **из корня проекта**, backend и frontend — в отдельных терминалах:

```powershell
# База данных
docker compose -f docker-compose.movies.yml up -d
```

```powershell
# Backend
npm.cmd --prefix backend run start:dev
```

```powershell
# Frontend
npm.cmd --prefix frontend run dev
```

- **Сайт:** http://localhost:5173
- **API:** http://localhost:3000/api/movies

Backend и frontend оставь работающими. Остановка — `Ctrl+C`. Остановить базу с сохранением данных:

```powershell
docker compose -f docker-compose.movies.yml stop
```

### 3. Обновление проекта

Сохрани свои изменения коммитом или через `git stash`, затем из корня:

```powershell
git pull
```

Если изменились зависимости:

```powershell
npm.cmd ci --prefix backend
npm.cmd ci --prefix frontend
```

Если появились Prisma-миграции и Prisma уже настроена, при работающей базе:

```powershell
cd backend
npm.cmd run prisma:deploy
npm.cmd run prisma:generate
cd ..
```

Новые SQL-скрипты применяй отдельно по инструкции к изменению. Затем перезапусти backend и frontend.

**`git pull` и перезапуск Docker сами базу не обновляют.**

### 4. Работа с базой

Открыть SQL-консоль из корня:

```powershell
docker compose -f docker-compose.movies.yml exec db mariadb -u kino_user -p kino
```

```sql
SHOW TABLES;
SELECT id, title FROM movies;
SELECT * FROM sessions;
SELECT id, email FROM users;
exit;
```

#### Prisma

Команды выполняются из `backend`. Первичная настройка, регистрация существующей базы и создание теневой базы описаны в [backend/README.md](backend/README.md#русский).

| Команда | Назначение |
|---|---|
| `npm.cmd run prisma:studio` | Открыть редактор данных |
| `npm.cmd run prisma:status` | Проверить миграции |
| `npm.cmd run prisma:deploy` | Применить готовые миграции |
| `npm.cmd run prisma:generate` | Обновить Prisma Client |
| `npm.cmd run prisma:migrate -- --name describe_change` | Создать миграцию после изменения схемы; нужна теневая база |
| `npm.cmd run prisma:seed` | Добавить отсутствующие учебные фильмы № 1–3 |

Studio показывает модели Prisma: сейчас фильмы и отзывы. Сеансы и пользователи доступны через SQL. Открой адрес из терминала; завершение Studio — `Ctrl+C`. Сохранённые изменения меняют данные в базе.

Для применения SQL-файла скопируй его в контейнер и открой консоль. Например, обновление постеров:

```powershell
docker compose -f docker-compose.movies.yml cp database/update_posters.sql db:/tmp/update_posters.sql
docker compose -f docker-compose.movies.yml exec db mariadb -u kino_user -p kino
```

Затем в MariaDB:

```sql
SOURCE /tmp/update_posters.sql;
exit;
```

**Данные сохраняются в Docker volume. `docker compose -f docker-compose.movies.yml down -v` и `prisma migrate reset` удаляют их.** Изменение пароля в Compose не меняет пароль существующей базы.

### 5. Проверки и частые ошибки

Из корня проекта:

```powershell
# Сборка
npm.cmd --prefix backend run build
npm.cmd --prefix frontend run build

# Тесты
npm.cmd --prefix backend test -- --runInBand
npm.cmd --prefix frontend run test:unit -- --run

# Состояние и логи базы
docker compose -f docker-compose.movies.yml ps
docker compose -f docker-compose.movies.yml logs --tail 100 db
```

| Проблема | Что проверить |
|---|---|
| База недоступна | Docker Desktop, контейнер, порт `3308` |
| `Access denied` | Пароль и параметры в `backend/.env` |
| Нет сеансов / таблицы пользователей | Импорт `sessions.sql` / `users.sql` |
| API недоступен | Backend и ошибки в его терминале |
| API работает, сайт не загружает данные | Порт frontend: CORS настроен на `5173` |
| Prisma: таблица уже существует | Первичную настройку миграций в `backend/README.md` |
