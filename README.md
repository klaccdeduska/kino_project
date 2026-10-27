# BUBLIKI — Cinema Project

**Language / Keel / Язык:** [English](#english) · [Eesti](#eesti) · [Русский](#russian)

<a id="english"></a>
## English

A student cinema project: Vue 3 + TypeScript frontend, NestJS API, MariaDB 11,
Redis session cache, demo seat selection, payment and printable tickets.
Bookings are saved in this browser only; demo payments do not charge money.

### Requirements and command conventions

Install **Node.js 24.12+**, **Git** and **Docker Desktop**. Start Docker Desktop.
All commands below run from the **project root**, unless another terminal is named.
Examples use Windows PowerShell. On macOS/Linux, replace `npm.cmd` / `npx.cmd`
with `npm` / `npx`; `Copy-Item` is the PowerShell equivalent of `cp`.
On Windows, `npm.cmd` avoids execution-policy errors from `npm.ps1`.

```powershell
node --version
npm.cmd --version
git --version
docker version
docker compose version
```

### Automatic setup and daily commands

```powershell
git clone https://github.com/klaccdeduska/kino_project.git
cd kino_project
npm.cmd run setup
npm.cmd run dev
```

Open **http://localhost:5173**. API: **http://localhost:3000/api/movies**.
MariaDB: `127.0.0.1:3308`; Redis: `127.0.0.1:6380`.

| Command from the project root | What it does |
| --- | --- |
| `npm.cmd run setup` | Installs both packages with `npm ci`, creates `.env` if missing, adds a missing `DATABASE_URL` from `DB_*`, starts MariaDB and Redis, waits for MariaDB, creates missing SQL tables and generates Prisma Client |
| `npm.cmd run dev` | Starts containers, checks the session schema, starts backend and frontend together |
| `npm.cmd run db:status` | Shows Compose containers; it does not check API responses |
| `npm.cmd run update` | Requires a clean Git working tree, runs `git pull --ff-only`, then `setup` |
| `npm.cmd run stop` | Stops MariaDB and Redis while preserving data; stop `dev` with Ctrl+C first |

`Ctrl+C` in the `dev` terminal stops both development servers, leaving containers
running. `setup` preserves an existing `.env` and existing tables, even empty ones.
It adds `DATABASE_URL` only if missing, using the saved `DB_*` values.
It does not repair partial imports or apply SQL/Prisma migrations. For an older
schema, use the upgrade section below. No command above deletes the database volume.

Before updating, stop `dev` and commit your work (or save it using
`git stash push -u -m "Before update"`). Then:

```powershell
npm.cmd run update
npm.cmd run dev
```

If you stashed changes, restore them with `git stash pop` after the update and
resolve any conflicts. A divergent branch needs a separate Git merge/rebase;
`--ff-only` deliberately stops instead of deciding for you.

Before rerunning `setup`, stop all existing frontend/backend processes with Ctrl+C.
Windows can lock files in `node_modules` while Vite is running (EPERM).

### Manual setup: the steps behind setup

After cloning and entering the project directory:

```powershell
npm.cmd ci --prefix backend
npm.cmd ci --prefix frontend
if (!(Test-Path backend/.env)) { Copy-Item backend/.env.example backend/.env }
docker compose -f docker-compose.movies.yml up -d
docker compose -f docker-compose.movies.yml ps
```

Check readiness; repeat until MariaDB reports `mysqld is alive`:

```powershell
docker compose -f docker-compose.movies.yml exec db mariadb-admin ping -u kino_user -p
```

Enter the database password when asked (`change_me` for the checked-in local
Compose defaults). Keep `DB_*` and `DATABASE_URL` in `backend/.env` consistent.
The API uses `DB_*`; Prisma uses `DATABASE_URL`. If an older `.env` has no
`DATABASE_URL`, add it before generating Prisma Client; match your real credentials:

```dotenv
DATABASE_URL="mysql://kino_user:change_me@127.0.0.1:3308/kino"
```
 Redis defaults to
`redis://127.0.0.1:6380`; override with `REDIS_URL` in `backend/.env` if necessary.

Compose imports **only movies** automatically on a fresh volume. For a fresh
manual installation, copy the remaining SQL files:

```powershell
docker compose -f docker-compose.movies.yml cp database/halls.sql db:/tmp/halls.sql
docker compose -f docker-compose.movies.yml cp database/sessions.sql db:/tmp/sessions.sql
docker compose -f docker-compose.movies.yml cp database/users.sql db:/tmp/users.sql
docker compose -f docker-compose.movies.yml exec db mariadb -u kino_user -p kino
```

In the MariaDB console, inspect first:

```sql
SHOW TABLES;
```

Run each `SOURCE` **only if that table is missing**. Skip existing tables:

```sql
SOURCE /tmp/halls.sql;
SOURCE /tmp/sessions.sql;
SOURCE /tmp/users.sql;
SHOW TABLES;
SELECT id, name FROM halls;
SELECT COUNT(*) FROM sessions;
exit;
```

The fresh seed uses Hall 1 and Hall 2 with IDs 1 and 2. Do not import it into a
customized schedule. A repeated sessions import is rejected by a unique constraint;
`CREATE TABLE IF NOT EXISTS` does not upgrade an existing table.

```powershell
npm.cmd --prefix backend run prisma:generate
```

Start the servers in **two terminals**, both from the project root:

```powershell
# Terminal 1
npm.cmd --prefix backend run start:dev
```

```powershell
# Terminal 2
npm.cmd --prefix frontend run dev
```

For a manual update: stop both servers, commit/stash changes, run
`git pull --ff-only`, repeat dependency installation and Prisma generation, apply
any required migrations below, then start both servers again. Commands for a manual update (after saving local work):

```powershell
git pull --ff-only
npm.cmd ci --prefix backend
npm.cmd ci --prefix frontend
npm.cmd --prefix backend run prisma:generate
```

Stop each terminal
with Ctrl+C; stop containers with:

```powershell
docker compose -f docker-compose.movies.yml stop
```

### Existing database upgrades and Prisma

Inspect the schema before applying a migration:

```powershell
docker compose -f docker-compose.movies.yml exec db mariadb -u kino_user -p kino
```

```sql
SHOW TABLES;
SHOW COLUMNS FROM sessions;
SHOW INDEX FROM halls;
SHOW INDEX FROM sessions;
exit;
```

| State | Files to apply in order |
| --- | --- |
| Sessions exist, but `halls` and `hall_id` are missing | `halls.sql`, then `add-session-halls.sql` |
| Halls exist, only `hall_id` is missing | `add-session-halls.sql` |
| All three of `language`, `subtitles`, `format` are missing | `add-session-details.sql` |
| Original demo schedule needs Hall 1/2 assignments and conflict fixes | `assign-session-halls.sql`, then `fix-demo-schedule.sql` |

Copy **only the needed files** with the same `docker compose ... cp` pattern as
above, open MariaDB and use `SOURCE /tmp/<filename>.sql;`. Legacy column migrations
run once. If only some expected columns exist, inspect and reconcile the schema
manually. Do not run hall assignment on a custom schedule: it rewrites assignments.
The schedule fix preserves IDs and moves five original demo showings. Its unique
indexes reject existing duplicates; review those manually. Never delete the Docker
volume to apply an upgrade. Already saved browser tickets retain their old times.
After SQL changes, restart the backend; cached session lists expire after 60 seconds.

Prisma currently covers only movies/reviews; the running API uses `mysql2`.
Normal setup does not need reviews. For the optional Prisma exercise with the
existing `movies` table and **no Prisma migration history**:

```powershell
# Run this baseline command once, only after checking the existing movies schema:
cd backend
npx.cmd prisma migrate resolve --applied 0_init
npm.cmd run prisma:deploy
npm.cmd run prisma:generate
npm.cmd run prisma:seed
npm.cmd run prisma:status
cd ..
```

If migration history already exists, skip `resolve`. The seed preserves existing
movies and ensures movies 1–3 exist. For schema details, a truly empty database,
Prisma Studio and development migrations, see [backend guide](backend/README.md#english).

### Checks and troubleshooting

```powershell
npm.cmd --prefix frontend run test:unit -- --run
npm.cmd --prefix frontend run build
npm.cmd --prefix backend run test -- --runInBand
npm.cmd --prefix backend run build
npm.cmd --prefix backend run prisma:validate
node scripts/test-schedule.mjs
```

The SQL test requires the running Compose database and uses a separate temporary
database, which it removes after testing. Backend e2e tests also need MariaDB/Redis:
`npm.cmd --prefix backend run test:e2e -- --runInBand --forceExit`.
`--forceExit` is needed because the current scaffold leaves connection handles open.
The frontend Playwright test is still a scaffold expecting `You did it!`;
it is not a passing project check (issue #11).

Useful diagnostics (from the root):

```powershell
docker compose -f docker-compose.movies.yml logs --tail 100 db redis
docker compose -f docker-compose.movies.yml exec redis redis-cli ping
Invoke-RestMethod http://localhost:3000/api/movies
Invoke-RestMethod http://localhost:3000/api/movies/1/sessions
```

| Symptom | Action |
| --- | --- |
| Docker connection error | Start Docker Desktop and retry `docker version` |
| Access denied from MariaDB | Match `.env` to the password of the existing volume; editing Compose does not change that password |
| Port already in use | Stop the previous server/container using 3000, 5173, 3308 or 6380; keep frontend port 5173 because CORS uses it |
| Redis connection error / sessions fail | Run `docker compose -f docker-compose.movies.yml up -d redis`, then check `redis-cli ping` |
| Missing table/column | Follow the conditional SQL steps above; rerunning `setup` does not migrate existing tables |
| Update says local changes exist | Commit/stash your work first; this is an intentional protection |
| No upcoming demo dates | The seed has fixed dates, 21–27 October 2026; refreshing those dates is separate work |

[Choose language](#bubliki--cinema-project)

---

<a id="eesti"></a>
## Eesti

Õppeprojekt: Vue 3 ja TypeScripti kasutajaliides, NestJS API, MariaDB 11,
Redis seansside vahemälu, istekohtade valik, näidismakse ja prinditavad piletid.
Broneeringud salvestatakse ainult sellesse brauserisse. Päris raha ei võeta.

### Nõuded ja käskude kasutamine

Vaja on **Node.js 24.12+**, **Giti** ja töötavat **Docker Desktopi**.
Kõik käsud käivitatakse **projekti juurkaustast**, kui pole öeldud teisiti.
Näited on Windows PowerShelli jaoks. macOS/Linuxis kasuta `npm` / `npx`
(`npm.cmd` / `npx.cmd` asemel) ning `cp` (`Copy-Item` asemel).
Windowsis väldib `npm.cmd` faili `npm.ps1` käivituspoliitika vigu.

```powershell
node --version
npm.cmd --version
git --version
docker version
docker compose version
```

### Automaatne seadistus ja igapäevased käsud

```powershell
git clone https://github.com/klaccdeduska/kino_project.git
cd kino_project
npm.cmd run setup
npm.cmd run dev
```

Veebileht: **http://localhost:5173**. API: **http://localhost:3000/api/movies**.
MariaDB: `127.0.0.1:3308`; Redis: `127.0.0.1:6380`.

| Käsk projekti juurkaustast | Tegevus |
| --- | --- |
| `npm.cmd run setup` | Paigaldab mõlema paketi sõltuvused käsuga `npm ci`, loob puuduva `.env` faili, lisab puuduva `DATABASE_URL` väärtuse `DB_*` põhjal, käivitab MariaDB ja Redise, ootab MariaDB valmimist, loob puuduvad SQL-tabelid ja genereerib Prisma Clienti |
| `npm.cmd run dev` | Käivitab konteinerid, kontrollib seansitabeli veerge ning käivitab backendi ja frontendi koos |
| `npm.cmd run db:status` | Näitab konteinerite olekut, kuid ei kontrolli API vastuseid |
| `npm.cmd run update` | Nõuab puhast Giti töökausta; käivitab `git pull --ff-only` ja seejärel `setup` |
| `npm.cmd run stop` | Peatab MariaDB ja Redise, säilitades andmed; enne peata `dev` käsuga Ctrl+C |

`Ctrl+C` peatab mõlemad arendusserverid, kuid konteinerid jäävad tööle.
`setup` säilitab olemasoleva `.env` ja tabelid, ka tühjad tabelid. See ei paranda
poolikuid importe ega rakenda SQL/Prisma migratsioone. Puuduv `DATABASE_URL`
lisatakse salvestatud `DB_*` v??rtuste p?hjal. Vanema skeemi jaoks kasuta
allolevat uuendamise osa. Need käsud ei kustuta andmebaasi Docker volume'it.

Enne uuendamist peata `dev` ja salvesta muudatused commit'iga või käsuga
`git stash push -u -m "Before update"`. Seejärel:

```powershell
npm.cmd run update
npm.cmd run dev
```

Stash'i kasutamisel taasta muudatused pärast uuendamist käsuga `git stash pop`
ja lahenda võimalikud konfliktid. Lahknenud harud vajavad eraldi merge'i/rebase'i;
`--ff-only` peatub ega tee seda otsust sinu eest.

Enne `setup` kordamist peata kõik frontendi/backendi protsessid käsuga Ctrl+C.
Töötav Vite võib Windowsis lukustada `node_modules` failid (EPERM).

### Käsitsi seadistamine: setup'i sammud

Pärast kloonimist ja projekti kausta sisenemist:

```powershell
npm.cmd ci --prefix backend
npm.cmd ci --prefix frontend
if (!(Test-Path backend/.env)) { Copy-Item backend/.env.example backend/.env }
docker compose -f docker-compose.movies.yml up -d
docker compose -f docker-compose.movies.yml ps
```

Korda valmiduse kontrolli, kuni vastus on `mysqld is alive`:

```powershell
docker compose -f docker-compose.movies.yml exec db mariadb-admin ping -u kino_user -p
```

Sisesta andmebaasi parool (kohaliku Compose'i näidisparool on `change_me`).
Hoia `backend/.env` faili `DB_*` ja `DATABASE_URL` kooskõlas: API kasutab esimest,
Prisma teist. Kui vanemas `.env` failis `DATABASE_URL` puudub, lisa see enne
Prisma Clienti genereerimist, kasutades oma tegelikke ?hendusandmeid:

```dotenv
DATABASE_URL="mysql://kino_user:change_me@127.0.0.1:3308/kino"
```

Redise vaikeaadress on `redis://127.0.0.1:6380`; vajadusel määra
samas `.env` failis `REDIS_URL`.

Compose impordib uue volume'i puhul automaatselt **ainult filmid**.
Uue käsitsi paigalduse jaoks kopeeri ülejäänud SQL-failid:

```powershell
docker compose -f docker-compose.movies.yml cp database/halls.sql db:/tmp/halls.sql
docker compose -f docker-compose.movies.yml cp database/sessions.sql db:/tmp/sessions.sql
docker compose -f docker-compose.movies.yml cp database/users.sql db:/tmp/users.sql
docker compose -f docker-compose.movies.yml exec db mariadb -u kino_user -p kino
```

MariaDB konsoolis kontrolli esmalt:

```sql
SHOW TABLES;
```

Käivita iga `SOURCE` **ainult siis, kui vastav tabel puudub**. Olemasolev jäta vahele:

```sql
SOURCE /tmp/halls.sql;
SOURCE /tmp/sessions.sql;
SOURCE /tmp/users.sql;
SHOW TABLES;
SELECT id, name FROM halls;
SELECT COUNT(*) FROM sessions;
exit;
```

Näidisseansid kasutavad saale Hall 1 ja Hall 2 ID-dega 1 ja 2. Ära impordi neid
kohandatud kavasse. Korduva seansiimpordi keelab unikaalsuspiirang.
`CREATE TABLE IF NOT EXISTS` ei uuenda olemasolevat tabelit.

```powershell
npm.cmd --prefix backend run prisma:generate
```

Käivita serverid **kahes terminalis**, mõlemad projekti juurkaustast:

```powershell
# Terminal 1
npm.cmd --prefix backend run start:dev
```

```powershell
# Terminal 2
npm.cmd --prefix frontend run dev
```

Käsitsi uuendamiseks peata serverid, salvesta muudatused commit'i/stash'iga,
käivita `git pull --ff-only`, paigalda sõltuvused uuesti ja genereeri Prisma Client,
rakenda vajalikud migratsioonid ning käivita serverid. Peata mõlemad terminalid
käsuga Ctrl+C. Käsitsi uuendamise käsud pärast kohalike muudatuste salvestamist:

```powershell
git pull --ff-only
npm.cmd ci --prefix backend
npm.cmd ci --prefix frontend
npm.cmd --prefix backend run prisma:generate
```

Konteinerite peatamine:

```powershell
docker compose -f docker-compose.movies.yml stop
```

### Olemasoleva andmebaasi uuendamine ja Prisma

Enne migratsiooni kontrolli skeemi:

```powershell
docker compose -f docker-compose.movies.yml exec db mariadb -u kino_user -p kino
```

```sql
SHOW TABLES;
SHOW COLUMNS FROM sessions;
SHOW INDEX FROM halls;
SHOW INDEX FROM sessions;
exit;
```

| Olukord | Failid rakendamise järjekorras |
| --- | --- |
| Seansid on olemas, kuid `halls` ja `hall_id` puuduvad | `halls.sql`, siis `add-session-halls.sql` |
| Saalid on olemas, kuid `hall_id` puudub | `add-session-halls.sql` |
| Kõik kolm veergu `language`, `subtitles`, `format` puuduvad | `add-session-details.sql` |
| Algne näidiskava vajab saalide jaotamist ja kattumiste parandust | `assign-session-halls.sql`, siis `fix-demo-schedule.sql` |

Kopeeri **ainult vajalikud failid** ülal näidatud `docker compose ... cp` käsuga,
ava MariaDB ja käivita `SOURCE /tmp/<failinimi>.sql;`. Vanad veerumigratsioonid
käivitatakse üks kord. Kui osa veerge on juba olemas, korrasta skeem käsitsi.
Ära kasuta saalide jaotamist kohandatud kaval: see kirjutab määrangud üle.
Kava parandus säilitab ID-d ja nihutab viit algset näidisseanssi. Unikaalsed
indeksid lükkavad duplikaadid tagasi; need tuleb käsitsi üle vaadata. Uuendamiseks
ära kustuta Docker volume'it. Brauseris varem salvestatud piletitel jääb vana aeg.
Pärast SQL-muudatusi taaskäivita backend; seansside vahemälu aegub 60 sekundiga.

Prisma hõlmab praegu ainult filme/arvustusi; API kasutab `mysql2`.
Tavakäivituseks pole arvustuste tabelit vaja. Valikuline Prisma harjutus olemasoleva
`movies` tabeliga, kui **Prisma migratsiooniajalugu veel puudub**:

```powershell
# Baseline ainult üks kord ja pärast movies tabeli skeemi kontrollimist:
cd backend
npx.cmd prisma migrate resolve --applied 0_init
npm.cmd run prisma:deploy
npm.cmd run prisma:generate
npm.cmd run prisma:seed
npm.cmd run prisma:status
cd ..
```

Kui migratsiooniajalugu on olemas, jäta `resolve` vahele. Seed säilitab olemasolevad
filmid ja tagab filmide 1–3 olemasolu. Täpsemad skeemi, tühja andmebaasi, Studio ja
arendusmigratsioonide juhised: [backendi juhend](backend/README.md#eesti).

### Kontrollid ja veaotsing

```powershell
npm.cmd --prefix frontend run test:unit -- --run
npm.cmd --prefix frontend run build
npm.cmd --prefix backend run test -- --runInBand
npm.cmd --prefix backend run build
npm.cmd --prefix backend run prisma:validate
node scripts/test-schedule.mjs
```

SQL-test vajab töötavat Compose'i andmebaasi ja kasutab eraldi ajutist andmebaasi,
mille pärast testi eemaldab. Backendi e2e-test vajab samuti MariaDB-d/Redist:
`npm.cmd --prefix backend run test:e2e -- --runInBand --forceExit`.
`--forceExit` on vajalik, sest praegune mallitest jätab ühendused avatuks.
Frontendi Playwrighti test on endiselt mallitest tekstiga `You did it!`;
see ei ole praegu läbiv projektikontroll (issue #11).

Diagnostika projekti juurkaustast:

```powershell
docker compose -f docker-compose.movies.yml logs --tail 100 db redis
docker compose -f docker-compose.movies.yml exec redis redis-cli ping
Invoke-RestMethod http://localhost:3000/api/movies
Invoke-RestMethod http://localhost:3000/api/movies/1/sessions
```

| Probleem | Lahendus |
| --- | --- |
| Dockeriga ei saa ühendust | Käivita Docker Desktop ja korda `docker version` |
| MariaDB vastab Access denied | Kontrolli olemasoleva volume'i parooli ja `.env` faili; Compose'i muutmine parooli ei muuda |
| Port on kasutusel | Peata varasem protsess pordil 3000, 5173, 3308 või 6380; frontendi port peab CORS-i tõttu jääma 5173 |
| Redis või seansid ei tööta | `docker compose -f docker-compose.movies.yml up -d redis`, seejärel `redis-cli ping` |
| Tabel/veerg puudub | Kasuta ülalolevaid tingimuslikke SQL-samme; `setup` ei migreeri olemasolevaid tabeleid |
| Update leiab kohalikke muudatusi | Tee commit või stash; see on tahtlik kaitse |
| Tulevasi näidiskuupäevi pole | Näidiskava kuupäevad on 21.–27.10.2026; nende uuendamine on eraldi töö |

[Vali keel](#bubliki--cinema-project)

---

<a id="russian"></a>
## Русский

Учебный кинотеатр: Vue 3 + TypeScript, API на NestJS, MariaDB 11,
Redis для кеша сеансов, выбор мест, демооплата и печать билетов.
Бронирования сохраняются только в этом браузере. Настоящие деньги не списываются.

### Требования и обозначения

Нужны **Node.js 24.12+**, **Git** и запущенный **Docker Desktop**.
Все команды выполняются **из корня проекта**, если явно не указано другое.
Примеры рассчитаны на Windows PowerShell. На macOS/Linux используйте `npm` / `npx`
вместо `npm.cmd` / `npx.cmd` и `cp` вместо `Copy-Item`.
На Windows `npm.cmd` обходит ограничение политики выполнения файла `npm.ps1`.

```powershell
node --version
npm.cmd --version
git --version
docker version
docker compose version
```

### Автоматическая установка и повседневные команды

```powershell
git clone https://github.com/klaccdeduska/kino_project.git
cd kino_project
npm.cmd run setup
npm.cmd run dev
```

Сайт: **http://localhost:5173**. API: **http://localhost:3000/api/movies**.
MariaDB: `127.0.0.1:3308`; Redis: `127.0.0.1:6380`.

| Команда из корня проекта | Что делает |
| --- | --- |
| `npm.cmd run setup` | Устанавливает зависимости обоих пакетов через `npm ci`, создаёт отсутствующий `.env`, добавляет недостающий `DATABASE_URL` из `DB_*`, запускает MariaDB и Redis, ждёт готовности MariaDB, создаёт отсутствующие SQL-таблицы и генерирует Prisma Client |
| `npm.cmd run dev` | Запускает контейнеры, проверяет поля таблицы сеансов, запускает backend и frontend вместе |
| `npm.cmd run db:status` | Показывает контейнеры Compose, но не проверяет ответы API |
| `npm.cmd run update` | Требует чистую рабочую папку Git, выполняет `git pull --ff-only`, затем `setup` |
| `npm.cmd run stop` | Останавливает MariaDB и Redis, сохраняя данные; перед этим завершите `dev` через Ctrl+C |

`Ctrl+C` в терминале `dev` останавливает оба сервера, оставляя контейнеры работать.
`setup` сохраняет существующий `.env` и таблицы, даже пустые. Он не исправляет
частично выполненные импорты и не применяет SQL/Prisma-миграции. Недостающий
`DATABASE_URL` добавляется на основе сохранённых `DB_*`. Для старой схемы
используйте раздел обновления ниже. Эти команды не удаляют Docker volume с данными.

Перед обновлением остановите `dev` и сохраните изменения коммитом или командой
`git stash push -u -m "Before update"`. Затем:

```powershell
npm.cmd run update
npm.cmd run dev
```

Если использовали stash, после обновления выполните `git stash pop` и разрешите
возможные конфликты. При расхождении веток нужен отдельный merge/rebase;
`--ff-only` намеренно останавливается и не принимает это решение за вас.

Перед повторным `setup` остановите все процессы frontend/backend через Ctrl+C.
Работающий Vite может блокировать файлы `node_modules` в Windows (EPERM).

### Ручная установка: что делает setup

После клонирования и перехода в папку проекта:

```powershell
npm.cmd ci --prefix backend
npm.cmd ci --prefix frontend
if (!(Test-Path backend/.env)) { Copy-Item backend/.env.example backend/.env }
docker compose -f docker-compose.movies.yml up -d
docker compose -f docker-compose.movies.yml ps
```

Проверяйте готовность, пока MariaDB не ответит `mysqld is alive`:

```powershell
docker compose -f docker-compose.movies.yml exec db mariadb-admin ping -u kino_user -p
```

Введите пароль базы при запросе (`change_me` для локальных настроек Compose).
Значения `DB_*` и `DATABASE_URL` в `backend/.env` должны указывать на одну базу:
API использует `DB_*`, Prisma — `DATABASE_URL`. Если в старом `.env` нет
`DATABASE_URL`, добавьте его до генерации Prisma Client с вашими данными подключения:

```dotenv
DATABASE_URL="mysql://kino_user:change_me@127.0.0.1:3308/kino"
```

Redis по умолчанию доступен по
`redis://127.0.0.1:6380`; при необходимости задайте `REDIS_URL` в том же `.env`.

На новом volume Compose автоматически импортирует **только фильмы**.
Для новой базы при ручной установке скопируйте остальные SQL-файлы:

```powershell
docker compose -f docker-compose.movies.yml cp database/halls.sql db:/tmp/halls.sql
docker compose -f docker-compose.movies.yml cp database/sessions.sql db:/tmp/sessions.sql
docker compose -f docker-compose.movies.yml cp database/users.sql db:/tmp/users.sql
docker compose -f docker-compose.movies.yml exec db mariadb -u kino_user -p kino
```

Сначала проверьте таблицы в консоли MariaDB:

```sql
SHOW TABLES;
```

Выполняйте каждый `SOURCE` **только если соответствующая таблица отсутствует**.
Для существующих таблиц пропустите команду:

```sql
SOURCE /tmp/halls.sql;
SOURCE /tmp/sessions.sql;
SOURCE /tmp/users.sql;
SHOW TABLES;
SELECT id, name FROM halls;
SELECT COUNT(*) FROM sessions;
exit;
```

Учебные сеансы используют Hall 1 и Hall 2 с ID 1 и 2. Не импортируйте их поверх
собственного расписания. Повторный импорт сеансов отклоняется ограничением
уникальности. `CREATE TABLE IF NOT EXISTS` не обновляет существующую таблицу.

```powershell
npm.cmd --prefix backend run prisma:generate
```

Запустите серверы **в двух терминалах**, оба из корня проекта:

```powershell
# Терминал 1
npm.cmd --prefix backend run start:dev
```

```powershell
# Терминал 2
npm.cmd --prefix frontend run dev
```

Для ручного обновления остановите серверы, сохраните изменения коммитом/stash,
выполните `git pull --ff-only`, повторите установку зависимостей и генерацию Prisma,
примените нужные миграции ниже и снова запустите серверы. Завершите каждый терминал
через Ctrl+C. Команды ручного обновления после сохранения локальных изменений:

```powershell
git pull --ff-only
npm.cmd ci --prefix backend
npm.cmd ci --prefix frontend
npm.cmd --prefix backend run prisma:generate
```

Остановите контейнеры:

```powershell
docker compose -f docker-compose.movies.yml stop
```

### Обновление существующей базы и Prisma

Перед миграцией проверьте схему:

```powershell
docker compose -f docker-compose.movies.yml exec db mariadb -u kino_user -p kino
```

```sql
SHOW TABLES;
SHOW COLUMNS FROM sessions;
SHOW INDEX FROM halls;
SHOW INDEX FROM sessions;
exit;
```

| Состояние | Файлы в порядке применения |
| --- | --- |
| Сеансы есть, но `halls` и `hall_id` отсутствуют | `halls.sql`, затем `add-session-halls.sql` |
| Залы есть, отсутствует только `hall_id` | `add-session-halls.sql` |
| Отсутствуют все три поля `language`, `subtitles`, `format` | `add-session-details.sql` |
| Исходному учебному расписанию нужны распределение по залам и исправление пересечений | `assign-session-halls.sql`, затем `fix-demo-schedule.sql` |

Скопируйте **только нужные файлы** по образцу `docker compose ... cp` выше,
откройте MariaDB и выполните `SOURCE /tmp/<имя-файла>.sql;`. Старые миграции столбцов
выполняются один раз. Если часть полей уже существует, согласуйте схему вручную.
Не применяйте распределение залов к собственному расписанию: оно перезаписывает
назначения. Исправление расписания сохраняет ID и переносит пять исходных сеансов.
Уникальные индексы отклоняют существующие дубликаты — разберите их вручную.
Не удаляйте Docker volume ради обновления. У ранее сохранённых в браузере билетов
останется старое время. После SQL-изменений перезапустите backend; кеш списка
сеансов истекает через 60 секунд.

Prisma пока описывает только фильмы/отзывы; API использует `mysql2`.
Для обычного запуска отзывы не нужны. Необязательная практика Prisma для базы
с существующей таблицей `movies` и **без истории Prisma-миграций**:

```powershell
# Baseline выполняется один раз, после проверки схемы существующей movies:
cd backend
npx.cmd prisma migrate resolve --applied 0_init
npm.cmd run prisma:deploy
npm.cmd run prisma:generate
npm.cmd run prisma:seed
npm.cmd run prisma:status
cd ..
```

Если история миграций уже есть, пропустите `resolve`. Seed сохраняет существующие
фильмы и добавляет фильмы 1–3, если их нет. О схеме, полностью пустой базе, Prisma
Studio и миграциях разработки: [руководство backend](backend/README.md#русский).

### Проверки и устранение ошибок

```powershell
npm.cmd --prefix frontend run test:unit -- --run
npm.cmd --prefix frontend run build
npm.cmd --prefix backend run test -- --runInBand
npm.cmd --prefix backend run build
npm.cmd --prefix backend run prisma:validate
node scripts/test-schedule.mjs
```

SQL-тесту нужна запущенная база Compose: он использует отдельную временную базу
и удаляет её после проверки. E2e-тесту backend также нужны MariaDB/Redis:
`npm.cmd --prefix backend run test:e2e -- --runInBand --forceExit`.
`--forceExit` нужен, поскольку текущий шаблонный тест оставляет подключения открытыми.
Тест Playwright во frontend пока шаблонный и ожидает `You did it!`;
это пока не проходящая проверка проекта (issue #11).

Диагностика из корня проекта:

```powershell
docker compose -f docker-compose.movies.yml logs --tail 100 db redis
docker compose -f docker-compose.movies.yml exec redis redis-cli ping
Invoke-RestMethod http://localhost:3000/api/movies
Invoke-RestMethod http://localhost:3000/api/movies/1/sessions
```

| Ошибка | Что делать |
| --- | --- |
| Нет подключения к Docker | Запустите Docker Desktop, повторите `docker version` |
| MariaDB отвечает Access denied | Сверьте `.env` с паролем существующего volume; изменение Compose не меняет этот пароль |
| Порт занят | Остановите предыдущий процесс на 3000, 5173, 3308 или 6380; frontend должен остаться на 5173 из-за настройки CORS |
| Ошибка Redis / не загружаются сеансы | `docker compose -f docker-compose.movies.yml up -d redis`, затем проверка `redis-cli ping` |
| Нет таблицы/столбца | Используйте условные SQL-шаги выше; `setup` не мигрирует существующие таблицы |
| Update сообщает о локальных изменениях | Сначала commit/stash; это предусмотренная защита |
| Нет будущих учебных дат | Даты сеансов фиксированы: 21–27 октября 2026 года; их обновление — отдельная задача |

[Выбрать язык](#bubliki--cinema-project)
