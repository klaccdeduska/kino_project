# BOOBLICKI — Cinema Project

Languages / Keeled / Языки: [English](#english) · [Eesti](#eesti) · [Русский](#русский)

## English

### Prisma ORM practice

Prisma ORM 7 is installed in `backend` for learning alongside the existing mysql2 API. Start with the [beginner Prisma guide](backend/README.md#english): Movie and Review models, one-to-many relations, safe existing-database baselining, and query examples. The API continues to use its existing SQL queries.

Run from `backend` after configuring `.env` and following the guide's first-time baseline instructions:

```powershell
npm.cmd run prisma:validate
npm.cmd run prisma:deploy
npm.cmd run prisma:generate
npm.cmd run prisma:seed
npm.cmd run prisma:status
```

For your own schema changes: `npm.cmd run prisma:migrate -- --name describe_change`, then `npm.cmd run prisma:generate`. Development migrations require a separate shadow database; setup is in the guide. The seed inserts missing movies 1-3 from `database/movies.sql` and preserves existing rows.


BOOBLICKI is an educational cinema website. Movies are stored in our own MariaDB database and delivered to the Vue frontend through our own NestJS REST API. The project no longer uses the external Apollo Kino API.

### Current features

- Display 12 movies loaded from MariaDB through the backend API.
- Search movies by title.
- View movie information: title, genre, duration, description, release year, director, and age rating.
- Navigate from a movie listing to a separate seat selection page.
- Demonstration seating layout: 5 rows × 8 seats, including unavailable seats.
- Select and deselect available seats, see selected seats, and clear the selection.

**Limitations:** Seats and their availability are currently demonstration data, not persisted reservations. Seat selection resets when the page is refreshed or a different movie is selected. Payment and completed bookings have not been implemented. Movie poster and trailer fields are available in the API but currently contain `null` in the initial dataset.

### Tech stack

- **Frontend:** Vue 3, TypeScript, Vite, Vue Router.
- **Backend:** NestJS, TypeScript, `mysql2`, `dotenv`.
- **Database:** MariaDB 11, Docker Compose, persistent named volume.
- **Development:** VS Code, Git, GitHub, Docker Desktop.

### Project structure

```text
kino_project/
├── backend/
│   ├── src/
│   │   ├── main.ts                 # NestJS startup and CORS
│   │   └── movies/
│   │       ├── movies.controller.ts # Own REST API
│   │       └── movies.database.ts   # MariaDB connection pool
│   ├── .env                       # Local credentials; do not commit
│   └── package.json
├── frontend/
│   └── src/
│       ├── views/
│       │   ├── MoviesView.vue      # Movie list and search
│       │   └── BookingView.vue     # Separate seat selection page
│       └── components/
│           └── SeatPicker.vue      # Seat selector
├── database/
│   └── movies.sql                 # Initial database data
├── docker-compose.movies.yml     # MariaDB container
└── README.md
```

### Requirements and first-time setup

Install Node.js (version 24 used during development), Git and Docker Desktop with Docker Compose. Clone the repository:

```bash
git clone https://github.com/klaccdeduska/kino_project.git
cd kino_project
```

Start Docker Desktop. From the **project root**, start MariaDB:

```powershell
docker compose -f docker-compose.movies.yml up -d
docker compose -f docker-compose.movies.yml ps
```

The database runs on `localhost:3308` (container port `3306`); database name: `kino`. On a **new, empty Docker data volume**, the SQL initialization file creates the initial movie records. If the volume already exists, restarting the container does not re-import the SQL file or overwrite existing data. Do not run `down -v` unless you intentionally want to delete database data.

Create `backend/.env` locally using the MariaDB credentials configured in `docker-compose.movies.yml`:

```dotenv
DB_HOST=127.0.0.1
DB_PORT=3308
DB_USER=kino_user
DB_PASSWORD=YOUR_MARIADB_PASSWORD
DB_NAME=kino
```

The user and password must match the Compose configuration. `backend/.env` must be excluded from Git and never committed; only include placeholders in documentation. When using an existing volume, changing environment variables in Compose will not automatically change the database users' passwords.

Install dependencies **once on a new computer**, or again when `package.json` / lockfiles change:

```powershell
cd backend
npm.cmd install
cd ..\frontend
npm.cmd install
cd ..
```

### Start the project (Windows PowerShell, every time)

Open three terminals in VS Code. Run the following from `kino_project`:

**1. Database — terminal 1:**

```powershell
docker compose -f docker-compose.movies.yml up -d
```

**2. Backend — terminal 2:**

```powershell
cd backend
npm.cmd run start:dev
```

API: `http://localhost:3000/api/movies`

**3. Frontend — terminal 3 (from the project root):**

```powershell
cd frontend
npm.cmd run dev
```

Open the Vite `Local` URL, typically `http://localhost:5173`. Keep the backend and frontend terminals running. On macOS/Linux or where PowerShell permits npm scripts, `npm` can be used instead of `npm.cmd`.

### API endpoints

| Method | Endpoint | Result |
| --- | --- | --- |
| `GET` | `/api/movies` | All movies from MariaDB |
| `GET` | `/api/movies/:id` | One movie by ID (404 if not found) |

Movie data includes `id`, `title`, `genre`, `duration` (minutes), `description`, `releaseYear`, `director`, `ageRating`, `poster` and `trailer`. For local development, CORS is enabled for `http://localhost:5173` in `backend/src/main.ts`.

### Checks and troubleshooting

```powershell
# From the project root: check the database container
docker compose -f docker-compose.movies.yml ps

# Open a MariaDB shell (uses the root password from Compose)
docker compose -f docker-compose.movies.yml exec db mariadb -u root -p
```

Inside MariaDB:

```sql
USE kino;
SELECT COUNT(*) FROM movies;
SELECT id, title, duration FROM movies;
```

The initial dataset contains **12 movies**. If the frontend cannot load them, first check the API URL in your browser, then make sure the backend is running, `.env` matches MariaDB, and Vite is running on the expected CORS origin. If Vite selects another port, update the backend's CORS origin accordingly.

### Planned improvements

Movie posters, showtimes, cinemas/halls, persistent seat availability, registration/login, real booking and payment, movie management, and server-side booking validation.

---

## Eesti

### Prisma ORM-i harjutamine

Prisma ORM 7 on paigaldatud kausta `backend` õppimiseks olemasoleva mysql2 API kõrvale. Alusta [eestikeelsest Prisma juhendist](backend/README.md#eesti): mudelid Movie ja Review, üks-mitmele seosed, olemasoleva andmebaasi ohutu algmigratsiooni registreerimine ning päringunäited. API kasutab endiselt olemasolevaid SQL-päringuid.

Käivita kaustas `backend` pärast `.env` seadistamist ja juhendi esmakordse algmigratsiooni juhiste järgimist:

```powershell
npm.cmd run prisma:validate
npm.cmd run prisma:deploy
npm.cmd run prisma:generate
npm.cmd run prisma:seed
npm.cmd run prisma:status
```

Oma skeemimuudatusteks kasuta `npm.cmd run prisma:migrate -- --name describe_change` ja seejärel `npm.cmd run prisma:generate`. Arendusmigratsioonid vajavad eraldi variandmebaasi; seadistamine on juhendis. Seed lisab failist `database/movies.sql` puuduvad filmid 1–3 ning säilitab olemasolevad kirjed.

BOOBLICKI on õppeprojektina loodud kino veebileht. Filmide andmed asuvad meie enda MariaDB andmebaasis ning Vue kasutajaliides saab need meie NestJS REST API kaudu. Apollo Kino välist API-t enam ei kasutata.

### Praegused võimalused

- 12 filmi kuvamine oma andmebaasist.
- Filmide otsimine pealkirja järgi.
- Filmi kirjeldus, žanr, kestus, väljalaskeaasta, režissöör ja vanusepiirang.
- Filmide nimekirjast liikumine eraldi istekohtade valimise lehele.
- Näitlik saaliplaan: 5 rida × 8 kohta, sealhulgas hõivatud kohad.
- Vabade kohtade valimine ja valiku tühistamine, valitud kohtade kuvamine ning kogu valiku puhastamine.

**Piirangud:** Kohtade valik ei ole veel päris broneering ega salvestu andmebaasi; lehe värskendamisel või filmi vahetamisel valik lähtestatakse. Maksmine ja broneeringu lõplik vormistamine ei ole teostatud. Esialgsetel filmidel pole veel plakateid ja treilereid (`null`).

### Tehnoloogiad

- **Frontend:** Vue 3, TypeScript, Vite, Vue Router.
- **Backend:** NestJS, TypeScript, `mysql2`, `dotenv`.
- **Andmebaas:** MariaDB 11, Docker Compose, püsiv nimeline andmemaht.
- **Arendus:** VS Code, Git, GitHub, Docker Desktop.

### Projekti struktuur

```text
kino_project/
├── backend/
│   ├── src/
│   │   ├── main.ts                 # NestJS-i käivitus ja CORS
│   │   └── movies/
│   │       ├── movies.controller.ts # Meie REST API
│   │       └── movies.database.ts   # MariaDB ühenduste kogum
│   ├── .env                       # Kohalikud ühendusandmed; ära lisa Giti
│   └── package.json
├── frontend/
│   └── src/
│       ├── views/
│       │   ├── MoviesView.vue      # Filmide nimekiri ja otsing
│       │   └── BookingView.vue     # Eraldi istekohtade valimise leht
│       └── components/
│           └── SeatPicker.vue      # Istekohtade valik
├── database/
│   └── movies.sql                 # Andmebaasi algandmed
├── docker-compose.movies.yml     # MariaDB konteiner
└── README.md
```

### Esmakordne ettevalmistus

Vaja on Node.js-i (arenduses kasutati versiooni 24), Giti ja Docker Desktopi koos Docker Compose’iga. Käivita Docker Desktop.

```powershell
git clone https://github.com/klaccdeduska/kino_project.git
cd kino_project
docker compose -f docker-compose.movies.yml up -d
```

Loo lokaalne fail `backend/.env`, kasutades `docker-compose.movies.yml` failis määratud kasutajat ja parooli:

```dotenv
DB_HOST=127.0.0.1
DB_PORT=3308
DB_USER=kino_user
DB_PASSWORD=YOUR_MARIADB_PASSWORD
DB_NAME=kino
```

Ära lisa `.env` faili GitHubi. Andmebaasi algandmed imporditakse automaatselt ainult siis, kui Docker loob esimest korda tühja andmemahu. Olemasoleva andmemahu taaskäivitamine ei impordi SQL-faili uuesti ega kirjuta andmeid üle. Ära kasuta `down -v`, kui sa ei soovi andmebaasi andmeid kustutada. Andmebaas `kino` töötab aadressil `localhost:3308` (konteineri port `3306`). Kasutaja ja parool peavad vastama Compose’i seadistusele; olemasoleva andmemahu korral ei muuda Compose’i muutujate muutmine andmebaasi kasutajate paroole automaatselt. Dokumentatsioonis kasuta ainult näidisparoole.

Paigalda sõltuvused uues arvutis (või pärast sõltuvuste muudatusi):

```powershell
cd backend
npm.cmd install
cd ..\frontend
npm.cmd install
cd ..
```

### Projekti käivitamine (kolm terminali)

Käivita Docker Desktop. Iga käskude plokk algab projekti juurkaustast.

**1. Andmebaas:**

```powershell
docker compose -f docker-compose.movies.yml up -d
```

**2. Backend:**

```powershell
cd backend
npm.cmd run start:dev
```

**3. Frontend:**

```powershell
cd frontend
npm.cmd run dev
```

Hoia backendi ja frontendi terminalid töös. macOS-is/Linuxis või sobiva PowerShelli seadistuse korral võib kasutada `npm` käsku `npm.cmd` asemel.

Veebileht: `http://localhost:5173` (või Vite terminalis kuvatud aadress). API: `http://localhost:3000/api/movies`; üksik film: `http://localhost:3000/api/movies/1`.

### API otspunktid

| Meetod | Otspunkt | Tulemus |
| --- | --- | --- |
| `GET` | `/api/movies` | Kõik filmid MariaDB-st |
| `GET` | `/api/movies/:id` | Üks film ID järgi; puudumisel 404 |

Filmi andmed sisaldavad `id`, `title`, `genre`, `duration` (minutites), `description`, `releaseYear`, `director`, `ageRating`, `poster` ja `trailer`. Kohalikus arenduses on failis `backend/src/main.ts` CORS lubatud aadressile `http://localhost:5173`.

### Kontroll ja tõrkeotsing

Andmebaasi kontrollimiseks käivita juurkaustas:

```powershell
docker compose -f docker-compose.movies.yml ps
docker compose -f docker-compose.movies.yml exec db mariadb -u root -p
```

Seejärel MariaDB-s (root-parool on Compose’i seadistuses):

```sql
USE kino;
SELECT COUNT(*) FROM movies;
SELECT id, title, duration FROM movies;
```

Algandmetes on **12 filmi**. Kui kasutajaliides neid ei laadi, kontrolli esmalt brauseris API aadressi, seejärel backendi tööd, `.env` vastavust MariaDB-le ja Vite’i CORS-aadressi. Kui Vite valib teise pordi, uuenda backendi CORS-i seadistust.

### Edasine arendus

Filmiplakatid ja treilerid, seansid, kinod ja saalid, püsiv kohtade saadavus, registreerimine ja sisselogimine, päris broneerimine ja maksmine, filmide haldus ning broneeringute serveripoolne valideerimine. Projekt on arendamisel.

---

## Русский

### Практика Prisma ORM

Prisma ORM 7 установлен в `backend` для обучения рядом с существующим API на mysql2. Начни с [руководства Prisma на русском](backend/README.md#русский): модели Movie и Review, связи один ко многим, безопасная регистрация исходной миграции существующей базы и примеры запросов. API продолжает использовать существующие SQL-запросы.

Выполняй из `backend` после настройки `.env` и выполнения инструкций руководства по первоначальной регистрации миграции:

```powershell
npm.cmd run prisma:validate
npm.cmd run prisma:deploy
npm.cmd run prisma:generate
npm.cmd run prisma:seed
npm.cmd run prisma:status
```

Для своих изменений схемы: `npm.cmd run prisma:migrate -- --name describe_change`, затем `npm.cmd run prisma:generate`. Миграциям разработки нужна отдельная теневая база; её настройка описана в руководстве. Seed добавляет отсутствующие фильмы 1–3 из `database/movies.sql`, сохраняя существующие записи.

BOOBLICKI — учебный сайт кинотеатра. Теперь информация о фильмах хранится в **нашей MariaDB**, а frontend на Vue получает её через **наш REST API на NestJS**. Внешний Apollo Kino API больше не используется.

### Что уже работает

- Загрузка 12 фильмов из MariaDB через собственный API.
- Поиск фильмов по названию.
- Просмотр названия, жанра, продолжительности, описания, года выпуска, режиссёра и возрастного ограничения.
- Переход с афиши на отдельную страницу выбора мест для выбранного фильма.
- Демонстрационный зал: 5 рядов по 8 мест, выбор и отмена выбора, показ выбранных мест, недоступные места и очистка выбора.

**Пока не реализовано:** настоящая бронь мест в базе, оплата и оформление заказа. Выбранные места хранятся только в памяти страницы и сбрасываются после обновления или смены фильма. Поля постеров и трейлеров присутствуют в API, но в начальных данных пока имеют значение `null`.

### Технологии

- Frontend: **Vue 3, TypeScript, Vite, Vue Router**.
- Backend: **NestJS, TypeScript, mysql2, dotenv**.
- База: **MariaDB 11**, Docker Compose, постоянный Docker volume.
- Инструменты: VS Code, Git, GitHub, Docker Desktop.

### Структура проекта

```text
kino_project/
├── backend/
│   ├── src/
│   │   ├── main.ts                  # Запуск NestJS и CORS
│   │   └── movies/
│   │       ├── movies.controller.ts # Собственный API фильмов
│   │       └── movies.database.ts   # Подключение MariaDB
│   ├── .env                        # Локальный пароль, не загружать в Git
│   └── package.json
├── frontend/
│   └── src/
│       ├── views/
│       │   ├── MoviesView.vue       # Афиша и поиск
│       │   └── BookingView.vue      # Отдельная страница выбора мест
│       └── components/
│           └── SeatPicker.vue
├── database/
│   └── movies.sql                  # Первоначальные 12 фильмов
├── docker-compose.movies.yml      # Контейнер MariaDB
└── README.md
```

### Что нужно установить

Node.js (в разработке использовалась версия 24), Git, Docker Desktop с поддержкой Docker Compose.

Если проект ещё не скачан:

```powershell
git clone https://github.com/klaccdeduska/kino_project.git
cd kino_project
```

### Первый запуск на новом компьютере

Сначала открой Docker Desktop. В корне проекта выполни:

```powershell
docker compose -f docker-compose.movies.yml up -d
```

База `kino` доступна на `localhost:3308` (внутри контейнера — порт `3306`). При **первом создании пустого Docker volume** файл инициализации SQL загружает 12 фильмов. При повторном запуске данные сохраняются. Не используй `docker compose down -v`, если не хочешь удалить данные базы.

Создай **`backend/.env`** и подставь пароль из `docker-compose.movies.yml`:

```dotenv
DB_HOST=127.0.0.1
DB_PORT=3308
DB_USER=kino_user
DB_PASSWORD=YOUR_MARIADB_PASSWORD
DB_NAME=kino
```

Проверь, что имя пользователя и пароль совпадают с настройками Docker Compose. Исключи `.env` из Git и не добавляй его в GitHub; в документации используй только примеры паролей. Если база уже была создана, изменение пароля в Compose не изменяет пароль существующего пользователя автоматически.

Установка зависимостей **только при первой настройке компьютера** или после изменения зависимостей:

```powershell
cd backend
npm.cmd install
cd ..\frontend
npm.cmd install
cd ..
```

### Как запускать проект каждый раз — три терминала VS Code

Открой папку `kino_project`. Запусти Docker Desktop. Команды ниже рассчитаны на запуск **из корня проекта** в отдельных терминалах.

**Терминал 1 — база данных:**

```powershell
docker compose -f docker-compose.movies.yml up -d
```

**Терминал 2 — backend:**

```powershell
cd backend
npm.cmd run start:dev
```

API фильмов: http://localhost:3000/api/movies

**Терминал 3 — frontend:**

```powershell
cd frontend
npm.cmd run dev
```

Открой адрес `Local`, который покажет Vite: обычно http://localhost:5173. Оставь оба терминала с серверами открытыми. В Windows PowerShell используется `npm.cmd`, чтобы избежать возможной блокировки `npm.ps1`. На macOS/Linux или при подходящих настройках PowerShell можно использовать `npm`.

### Наш API

| Метод | Адрес | Результат |
| --- | --- | --- |
| `GET` | `/api/movies` | Все фильмы из MariaDB |
| `GET` | `/api/movies/:id` | Один фильм по ID; 404, если не найден |

Каждый фильм содержит `id`, `title`, `genre`, `duration` (в минутах), `description`, `releaseYear`, `director`, `ageRating`, `poster`, `trailer`.

В `backend/src/main.ts` разрешён CORS для `http://localhost:5173`. Если Vite запустится на другом порту, настройку CORS нужно обновить.

### Проверка базы и API

В корне проекта:

```powershell
docker compose -f docker-compose.movies.yml ps
docker compose -f docker-compose.movies.yml exec db mariadb -u root -p
```

В MariaDB (пароль root указан в Compose):

```sql
USE kino;
SELECT COUNT(*) FROM movies;
SELECT id, title, duration FROM movies;
```

В начальной базе должно быть **12 фильмов**. Если сайт не показывает фильмы, открой http://localhost:3000/api/movies и проверь, что backend запущен, `.env` настроен правильно и frontend работает на нужном порту.

### План разработки

Постеры и трейлеры, расписание сеансов, залы, сохранение бронирований, проверка свободных мест на сервере, регистрация пользователей, полноценная продажа билетов и управление фильмами.

**Статус:** проект в разработке; система выбора мест пока демонстрационная.
