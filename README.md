# BOOBLICKI — Cinema Project

Languages / Keeled / Языки:
[English](#english) · [Eesti](#eesti) · [Русский](#русский)

## English

An educational cinema website project with movie listings and a seat selection interface.

### Features

- Browse movie cards.
- Search movies by title.
- View movie descriptions.
- Demonstration seating plan: 5 rows with 8 seats each.
- Select and deselect seats.
- Display selected seat numbers.
- Disable demonstration occupied seats.
- Clear the selection.

Selected seats are currently stored only in page memory.
The selection resets when the page is refreshed or another movie is selected.
Booking and payment have not been implemented yet.

### Technologies

- Frontend: Vue 3, TypeScript, Vite.
- Backend: NestJS, TypeScript.
- Database: MariaDB.
- Tools: Git, GitHub, Docker, Adminer.

Integration with the external Apollo Kino API has been discontinued.
Further development focuses on our own database.

### Project structure

- `frontend/` — website interface.
- `frontend/src/App.vue` — movie listings, search and movie descriptions.
- `frontend/src/components/SeatPicker.vue` — seat selection interface.
- `backend/` — server application.

### Requirements

For local development, install:

- Node.js 24.
- Git.
- Docker with Docker Compose support — for MariaDB.

Clone the repository:

```bash
git clone https://github.com/klaccdeduska/kino_project.git
cd kino_project
```

### Database

Start Docker and run this command from the project root:

```bash
docker compose up -d
```

On a new computer, create the database, tables and initial data
according to the project configuration. Starting the container
does not transfer database contents from another computer.

Backend connection settings are stored in a local `.env` file.
Create it with your MariaDB connection settings.
The `.env` file is excluded from Git and must not be committed
to a public repository.

### Starting the backend

In the first terminal:

```bash
cd backend
npm install
npm run start:dev
```

The server usually starts at `http://localhost:3000`.

### Starting the frontend

In a second terminal, starting from the project root:

```bash
cd frontend
npm install
npm run dev
```

Open the address shown next to `Local` in the terminal.
It is usually `http://localhost:5173`.

Keep both terminals running.

In Windows PowerShell, use `npm.cmd` if the execution policy
blocks `npm`.

Backend:

```powershell
npm.cmd install
npm.cmd run start:dev
```

Frontend:

```powershell
npm.cmd install
npm.cmd run dev
```

### Checking the interface

1. Open the movie listings.
2. Enter part of a movie title in the search field.
3. Click the movie details button.
4. Select an available seat — it should turn green.
5. Click it again — it should become unselected.
6. Check that occupied seats cannot be selected.
7. Click the clear selection button.
8. Select another movie — the seat selection should reset.

### Development plan

- Movie showtimes.
- Cinemas, halls and seats stored in the database.
- User registration and login.
- Persistent bookings.
- Server-side seat availability checks.
- Ticket price calculation.
- Movie and showtime management.
- Order checkout.

### Status

The project is under development.
The seating plan is a demonstration.

---

## Eesti

Õppeprojekt: kino veebileht filmikava ja istekohtade valimise liidesega.

### Võimalused

- Filmikaartide vaatamine.
- Filmide otsimine pealkirja järgi.
- Filmide kirjelduste vaatamine.
- Näitlik saaliplaan: 5 rida, igas reas 8 istekohta.
- Istekohtade valimine ja valiku tühistamine.
- Valitud istekohtade numbrite kuvamine.
- Näitlikult hõivatud istekohtade valimise blokeerimine.
- Kõigi valikute tühistamine.

Valitud istekohad salvestatakse praegu ainult lehe mällu.
Lehe värskendamisel või teise filmi valimisel valik lähtestatakse.
Broneerimine ja maksmine ei ole veel teostatud.

### Tehnoloogiad

- Kasutajaliides: Vue 3, TypeScript, Vite.
- Serverirakendus: NestJS, TypeScript.
- Andmebaas: MariaDB.
- Tööriistad: Git, GitHub, Docker, Adminer.

Välise Apollo Kino API kasutamine on lõpetatud.
Edasine arendus keskendub oma andmebaasile.

### Projekti struktuur

- `frontend/` — veebilehe kasutajaliides.
- `frontend/src/App.vue` — filmikava, otsing ja filmide kirjeldused.
- `frontend/src/components/SeatPicker.vue` — istekohtade valimise liides.
- `backend/` — serverirakendus.

### Ettevalmistus

Projekti kohalikuks käivitamiseks on vaja:

- Node.js 24.
- Git.
- Docker koos Docker Compose’i toega — MariaDB jaoks.

Klooni repositoorium:

```bash
git clone https://github.com/klaccdeduska/kino_project.git
cd kino_project
```

### Andmebaas

Käivita Docker ja sisesta projekti juurkaustas:

```bash
docker compose up -d
```

Uues arvutis tuleb luua andmebaas, tabelid ja algandmed
vastavalt projekti seadistustele. Konteineri käivitamine
ei kanna andmebaasi sisu teisest arvutist üle.

Serverirakenduse ühenduse seadistused asuvad kohalikus `.env` failis.
Loo fail oma MariaDB ühenduse andmetega.
Faili `.env` ei lisata Git’i ning seda ei tohi avalikku
repositooriumisse üles laadida.

### Serverirakenduse käivitamine

Esimeses terminalis:

```bash
cd backend
npm install
npm run start:dev
```

Server käivitub tavaliselt aadressil `http://localhost:3000`.

### Kasutajaliidese käivitamine

Teises terminalis, alustades projekti juurkaustast:

```bash
cd frontend
npm install
npm run dev
```

Ava terminalis rea `Local` juures kuvatud aadress.
Tavaliselt on see `http://localhost:5173`.

Mõlemad terminalid peavad jääma tööle.

Kui Windows PowerShelli käivituspoliitika blokeerib käsu `npm`,
kasuta selle asemel `npm.cmd`.

Serverirakendus:

```powershell
npm.cmd install
npm.cmd run start:dev
```

Kasutajaliides:

```powershell
npm.cmd install
npm.cmd run dev
```

### Kasutajaliidese kontrollimine

1. Ava filmikava.
2. Sisesta otsinguväljale osa filmi pealkirjast.
3. Vajuta filmi üksikasjade nuppu.
4. Vali vaba istekoht — see peaks muutuma roheliseks.
5. Vajuta samale istekohale uuesti — valik peaks tühistuma.
6. Kontrolli, et hõivatud istekohta ei saa valida.
7. Vajuta kõigi valikute tühistamise nuppu.
8. Vali teine film — istekohtade valik peaks lähtestuma.

### Arendusplaan

- Filmiseansside ajakava.
- Kinode, saalide ja istekohtade salvestamine andmebaasi.
- Kasutajate registreerimine ja sisselogimine.
- Broneeringute salvestamine.
- Istekohtade saadavuse kontrollimine serveris.
- Piletihinna arvutamine.
- Filmide ja seansside haldamine.
- Tellimuse vormistamine.

### Staatus

Projekt on arendamisel.
Saaliplaan on näitlik.

---

## Русский

Учебный проект сайта кинотеатра с афишей и интерфейсом выбора мест.

### Возможности

- Просмотр карточек фильмов.
- Поиск фильмов по названию.
- Просмотр описания фильма.
- Демонстрационная схема зала: 5 рядов по 8 мест.
- Выбор и снятие выбора мест.
- Отображение выбранных мест.
- Блокировка демонстрационных занятых мест.
- Очистка выбора.

Выбор мест пока хранится только в памяти страницы.
Он сбрасывается при обновлении страницы или переключении фильма.
Бронирование и оплата ещё не реализованы.

### Технологии

- Frontend: Vue 3, TypeScript, Vite.
- Backend: NestJS, TypeScript.
- База данных: MariaDB.
- Инструменты: Git, GitHub, Docker, Adminer.

Работа с внешним Apollo Kino API прекращена.
Дальнейшая разработка ориентирована на собственную базу данных.

### Структура проекта

- `frontend/` — интерфейс сайта.
- `frontend/src/App.vue` — афиша, поиск и описание фильма.
- `frontend/src/components/SeatPicker.vue` — интерфейс выбора мест.
- `backend/` — серверная часть приложения.

### Подготовка

Для локального запуска нужны:

- Node.js 24.
- Git.
- Docker с поддержкой Docker Compose — для MariaDB.

Клонируйте репозиторий:

```bash
git clone https://github.com/klaccdeduska/kino_project.git
cd kino_project
```

### База данных

Запустите Docker и выполните из корня проекта:

```bash
docker compose up -d
```

На новом компьютере необходимо создать базу, таблицы и начальные
данные по настройкам проекта. Запуск контейнера сам по себе
не переносит данные с другого компьютера.

Настройки подключения backend находятся в локальном `.env`.
Создайте его с параметрами вашей MariaDB.
Файл `.env` не хранится в Git и не должен содержаться
в публичном репозитории.

### Запуск backend

В первом терминале:

```bash
cd backend
npm install (прописывать только на новом компе)
npm run start:dev
```

Обычно сервер запускается на `http://localhost:3000`.

### Запуск frontend

Во втором терминале, из корня проекта:

```bash
cd frontend
npm install (прописывать только на новом компе)
npm run dev
```

Откройте адрес из строки `Local` в терминале.
Обычно это `http://localhost:5173`.

Оба терминала должны оставаться работающими.

В Windows PowerShell (или в VS Code Power Shell) используйте `npm.cmd`, если запуск `npm`
блокируется политикой выполнения сценариев.

Backend:

```powershell
npm.cmd install (прописывать только на новом компе)
npm.cmd run start:dev
```

Frontend:

```powershell
npm.cmd install (прописывать только на новом компе)
npm.cmd run dev
```

### Проверка интерфейса

1. Откройте афишу.
2. Введите часть названия фильма в поле поиска.
3. Нажмите «Подробнее».
4. Выберите свободное место — оно должно стать зелёным.
5. Нажмите его повторно — выбор должен сняться.
6. Проверьте, что занятое место нельзя выбрать.
7. Нажмите «Очистить выбор».
8. Переключите фильм — выбранные места должны сброситься.

### План разработки

- Расписание сеансов.
- Кинотеатры, залы и места в базе данных.
- Регистрация и вход пользователей.
- Сохранение бронирований.
- Проверка доступности мест на сервере.
- Расчёт стоимости билетов.
- Управление фильмами и сеансами.
- Оформление заказа.

### Статус

Проект находится в разработке.
Схема мест является демонстрационной.
