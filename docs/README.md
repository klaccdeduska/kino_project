# BUBLIKI project guide

[English](#english) · [Eesti](#eesti) · [Русский](#russian)

---

## English

[Project README](../README.md)

**Stack:** Vue 3, TypeScript, Vite, NestJS, MariaDB 11, Prisma migrations and Docker Compose. Compose also provides Redis.

### Setup details

Open [the frontend](http://localhost:5173). The [movie API](http://localhost:3000/api/movies) runs on port 3000. MariaDB uses port 3308 and Redis uses port 6380. If PowerShell blocks `npm.ps1`, use `npm.cmd` and `npx.cmd` in place of `npm` and `npx`.

On a fresh volume, `setup` installs dependencies, prepares `backend/.env`, generates a local JWT secret if needed, waits for MariaDB and applies Prisma migrations. It then loads demo data and generates Prisma Client. For a database from an older checkout, see the [upgrade notes](upgrade-notes.md).

### Daily commands

| Command | Use |
| --- | --- |
| `npm run dev` | Run the API and frontend. Press Ctrl+C to stop both. |
| `npm run db:status` | Show Compose service status and database health. |
| `npm run db:refresh-sessions` | Add demo showtimes for the next 30 days, starting tomorrow in Tallinn time. Existing sessions are preserved and conflicting slots are skipped. |
| `npm run update` | Fast-forward the checkout and rerun setup. Stop dev and commit or stash local changes first. |
| `npm run stop` | Stop MariaDB and Redis while keeping the volume. |

`compose.yaml` is discovered automatically when you run Compose from the project root. To start just the containers and wait for MariaDB to be ready, run `docker compose up -d --wait`. A deployed frontend needs a reverse proxy that sends `/api` to NestJS.

### Checks

```sh
npm --prefix backend run lint
npm --prefix frontend run lint
npm --prefix backend test -- --runInBand
npm --prefix backend run test:e2e -- --runInBand
npm --prefix frontend run test:unit -- --run
npm --prefix frontend run build
```

Both packages also provide `format:check`. For browser tests and local frontend development, see the [frontend guide](../frontend/README.md#english).

### Configuration and data

- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` and `DB_NAME` configure the API's MariaDB connection. `DATABASE_URL` is used by Prisma tools. Keep them pointed at the same database.
- `JWT_SECRET` signs the tokens stored in login cookies. Keep the generated value between restarts and keep `backend/.env` out of Git.
- `FRONTEND_URL` enables CORS for a separate browser origin. In the usual Vite setup, frontend requests use the same-origin `/api` proxy.
- The Compose volume stores films, halls, sessions and accounts. Tickets are stored separately in the current browser. Clearing site storage removes those tickets.

### Quick smoke test

1. Open `http://localhost:3000/api/movies` and confirm it returns the catalogue. Open `http://localhost:3000/api/movies/2/sessions` to check upcoming Interstellar screenings.
2. From the site, choose a session and a seat, confirm demo checkout and open the ticket. Refresh the page to check that the ticket remains available in the same browser.
3. If the catalogue loads but the session list is empty, refresh the demo schedule and reopen the film. Some films have showtimes only in a later week.

### Local diagnostics

```sh
docker compose ps
docker compose logs --tail 100 db redis
docker compose exec redis redis-cli ping
npm --prefix backend run prisma:status
```

For a schema change, use the [Prisma guide](prisma.md) before running migrations. If you are moving an older database onto Prisma, follow the [upgrade notes](upgrade-notes.md) and keep the existing volume.

### Troubleshooting

| Symptom | What to check |
| --- | --- |
| Docker is unavailable | Start Docker Desktop and run `docker compose version`. |
| MariaDB reports access denied | Match `backend/.env` to the credentials of the existing volume. Compose environment changes affect first initialization. |
| A port is in use | Check whether another process is using port 3000, 5173, 3308 or 6380. |
| No future showtimes | Run `npm run db:refresh-sessions` and reload the catalogue. |
| Existing database has missing columns or no Prisma history | Follow the [upgrade notes](upgrade-notes.md). |

[Prisma guide](prisma.md) · [SRS](../SRS.md) · [Printable SRS](../SRS.pdf) · [README archive](archive/README.before-issue-13.md) (historical commands)

---

## Eesti

[Project README](../README.et.md)

**Tehnoloogiad:** Vue 3, TypeScript, Vite, NestJS, MariaDB 11, Prisma migratsioonid ja Docker Compose. Compose käivitab ka Redise.

### Seadistuse üksikasjad

Ava [kasutajaliides](http://localhost:5173). [Filmide API](http://localhost:3000/api/movies) töötab pordil 3000, MariaDB pordil 3308 ja Redis pordil 6380. Kui PowerShell blokeerib `npm.ps1` skripti, kasuta `npm` ja `npx` asemel `npm.cmd` ja `npx.cmd`.

Uue andmeköite korral paigaldab `setup` sõltuvused, valmistab ette faili `backend/.env`, loob vajaduse korral kohaliku JWT saladuse, ootab MariaDB valmimist ja rakendab Prisma migratsioonid. Seejärel lisab ta näidisandmed ja genereerib Prisma Clienti. Varasema projekti andmebaasi puhul järgi [uuendamisjuhendit](upgrade-notes.md).

### Igapäevased käsud

| Käsk | Otstarve |
| --- | --- |
| `npm run dev` | Käivitab API ja kasutajaliidese. Ctrl+C peatab mõlemad. |
| `npm run db:status` | Näitab Compose’i teenuste olekut ja andmebaasi valmisolekut. |
| `npm run db:refresh-sessions` | Lisab 30 päeva demoseansid alates homsest Tallinna aja järgi. Olemasolevad seansid säilivad ja kattuvad ajad jäetakse vahele. |
| `npm run update` | Uuendab haru fast-forward’iga ja kordab seadistust. Esmalt peata arendusserverid ning talleta kohalikud muudatused commit’i või stash’i abil. |
| `npm run stop` | Peatab MariaDB ja Redise ning säilitab andmeköite. |

Compose leiab projekti juurkaustast faili `compose.yaml` automaatselt. Ainult konteinerite käivitamiseks ja MariaDB valmimise ootamiseks kasuta käsku `docker compose up -d --wait`. Avaldatud rakenduse puhul suuna `/api` päringud pöördproksi kaudu NestJS-ile.

### Kontrollid

```sh
npm --prefix backend run lint
npm --prefix frontend run lint
npm --prefix backend test -- --runInBand
npm --prefix backend run test:e2e -- --runInBand
npm --prefix frontend run test:unit -- --run
npm --prefix frontend run build
```

Mõlemas paketis töötab ka käsk `format:check`. Brauseritestide ja kohaliku arenduse kohta vaata [kasutajaliidese juhendit](../frontend/README.md#eesti).

### Seadistus ja andmed

- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` ja `DB_NAME` määravad API MariaDB ühenduse. Prisma tööriistad kasutavad `DATABASE_URL` väärtust. Mõlemad peavad osutama samale andmebaasile.
- `JWT_SECRET` allkirjastab sisselogimisküpsistes olevaid tokeneid. Säilita loodud väärtus taaskäivitustel ja hoia `backend/.env` Gitist väljas.
- `FRONTEND_URL` lubab CORS-i eraldi päritoluga kasutajaliidese jaoks. Tavalises Vite’i seadistuses käivad päringud sama päritoluga `/api` proksi kaudu.
- Compose’i andmeköites hoitakse filme, saale, seansse ja kontosid. Piletid asuvad kasutatavas brauseris. Saidi andmete kustutamisel kaovad ka piletid.

### Kiirkontroll

1. Ava `http://localhost:3000/api/movies` ja veendu, et API tagastab filmikataloogi. Interstellari tulevasi seansse saad kontrollida aadressil `http://localhost:3000/api/movies/2/sessions`.
2. Vali veebilehel seanss ja istekoht, kinnita demoost ning ava pilet. Laadi leht uuesti ja veendu, et pilet on samas brauseris alles.
3. Kui kataloog avaneb, aga seansside loend on tühi, värskenda demoajakava ja ava film uuesti. Mõne filmi seansid on alles järgmistel nädalatel.

### Kohalik diagnostika

```sh
docker compose ps
docker compose logs --tail 100 db redis
docker compose exec redis redis-cli ping
npm --prefix backend run prisma:status
```

Skeemi muutmisel järgi enne migratsioonide käivitamist [Prisma juhendit](prisma.md). Varasema andmebaasi üleviimisel Prismale järgi [uuendamisjuhendit](upgrade-notes.md) ja säilita senine andmeköide.

### Tõrkeotsing

| Sümptom | Mida kontrollida |
| --- | --- |
| Docker pole saadaval | Käivita Docker Desktop ja käsk `docker compose version`. |
| MariaDB keelab juurdepääsu | Kontrolli, et `backend/.env` vastab olemasoleva andmeköite kasutajaandmetele. Compose’i keskkonnamuudatused rakenduvad esmasel seadistamisel. |
| Port on hõivatud | Vaata, milline protsess kasutab porti 3000, 5173, 3308 või 6380. |
| Tulevasi seansse pole | Käivita `npm run db:refresh-sessions` ja laadi kataloog uuesti. |
| Vana andmebaasi veerud või Prisma ajalugu puuduvad | Järgi [uuendamisjuhendit](upgrade-notes.md). |

[Prisma harjutus](prisma.md) · [SRS](../SRS.md) · [Prinditav SRS](../SRS.pdf) · [README arhiiv](archive/README.before-issue-13.md) (varasemad käsud)

---

<a id="russian"></a>

## Русский

[Project README](../README.ru.md)

**Стек:** Vue 3, TypeScript, Vite, NestJS, MariaDB 11, миграции Prisma и Docker Compose. Compose также запускает Redis.

### Подробности установки

Открой [сайт кинотеатра](http://localhost:5173). [API фильмов](http://localhost:3000/api/movies) работает на порту 3000, MariaDB — на 3308, Redis — на 6380. Если PowerShell блокирует `npm.ps1`, используй `npm.cmd` и `npx.cmd` вместо `npm` и `npx`.

При первом запуске `setup` устанавливает зависимости, подготавливает `backend/.env`, при необходимости генерирует локальный секрет JWT, ждёт готовности MariaDB и применяет миграции Prisma. Затем он загружает демоданные и генерирует Prisma Client. Для базы из старой версии проекта см. [инструкцию по обновлению](upgrade-notes.md).

### Повседневные команды

| Команда | Что делает |
| --- | --- |
| `npm run dev` | Запускает API и фронтенд. Ctrl+C останавливает оба процесса. |
| `npm run db:status` | Показывает состояние контейнеров Compose и готовность базы. |
| `npm run db:refresh-sessions` | Добавляет демосеансы на 30 дней с завтрашнего дня по времени Таллина. Сохраняет существующие сеансы и пропускает пересекающиеся показы. |
| `npm run update` | Обновляет ветку через fast-forward и повторяет настройку. Сначала останови dev-серверы и закоммить изменения или убери их в stash. |
| `npm run stop` | Останавливает MariaDB и Redis с сохранением тома. |

Compose автоматически находит `compose.yaml` в корне проекта. Чтобы запустить только контейнеры и дождаться готовности MariaDB, выполни `docker compose up -d --wait`. При развёртывании направь запросы `/api` на NestJS через обратный прокси.

### Проверки

```sh
npm --prefix backend run lint
npm --prefix frontend run lint
npm --prefix backend test -- --runInBand
npm --prefix backend run test:e2e -- --runInBand
npm --prefix frontend run test:unit -- --run
npm --prefix frontend run build
```

В обеих частях проекта есть команда `format:check`. Проверки в браузере и локальная разработка описаны в [руководстве по фронтенду](../frontend/README.md#русский).

### Настройки и данные

- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` и `DB_NAME` задают подключение API к MariaDB. Инструменты Prisma используют `DATABASE_URL`. Обе настройки должны указывать на одну базу.
- `JWT_SECRET` подписывает токены, которые хранятся в cookie входа. Сохраняй сгенерированное значение между перезапусками и держи `backend/.env` вне Git.
- `FRONTEND_URL` включает CORS для фронтенда на отдельном адресе. При обычном запуске Vite запросы идут через прокси `/api` на том же адресе.
- В томе Compose хранятся фильмы, залы, сеансы и аккаунты. Билеты хранятся отдельно в браузере. Очистка данных сайта удалит их из этого браузера.

### Быстрая проверка

1. Открой `http://localhost:3000/api/movies` и проверь, что API возвращает каталог. Будущие показы Interstellar можно проверить по адресу `http://localhost:3000/api/movies/2/sessions`.
2. На сайте выбери сеанс и место, подтверди демооплату и открой билет. Обнови страницу и проверь, что билет доступен в том же браузере.
3. Если каталог загрузился, а сеансов нет, обнови деморасписание и снова открой фильм. У некоторых фильмов ближайшие показы будут на следующей неделе.

### Локальная диагностика

```sh
docker compose ps
docker compose logs --tail 100 db redis
docker compose exec redis redis-cli ping
npm --prefix backend run prisma:status
```

При изменении схемы перед запуском миграций см. [руководство по Prisma](prisma.md). Для перевода старой базы на Prisma следуй [инструкции по обновлению](upgrade-notes.md) и сохрани существующий том.

### Если что-то не работает

| Симптом | Что проверить |
| --- | --- |
| Docker недоступен | Запусти Docker Desktop и выполни `docker compose version`. |
| MariaDB отказывает в доступе | Сверь `backend/.env` с учётными данными существующего тома. Новые значения в Compose используются при первой инициализации. |
| Порт занят | Проверь, какие процессы используют порты 3000, 5173, 3308 или 6380. |
| Нет будущих сеансов | Выполни `npm run db:refresh-sessions` и обнови каталог. |
| В старой базе нет нужных полей или истории Prisma | Следуй [инструкции по обновлению](upgrade-notes.md). |

[Практика Prisma](prisma.md) · [SRS](../SRS.md) · [SRS для печати](../SRS.pdf) · [Архив README](archive/README.before-issue-13.md) (исторические команды)
