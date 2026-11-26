# BUBLIKI Cinema

**English** · [Eesti](README.et.md) · [Русский](README.ru.md)

## English

BUBLIKI is a student cinema web app. Browse films and showtimes, choose seats, and print demo tickets. Purchases are saved in the current browser, and demo checkout charges no money.

### First run

Install Node.js 24.12 or later, Git and Docker Desktop with Compose v2. Start Docker Desktop. Run these commands from the project root after cloning.

```sh
git clone https://github.com/klaccdeduska/kino_project.git
cd kino_project
npm run setup
npm run dev
```

Open [the site](http://localhost:5173). If PowerShell blocks npm, use `npm.cmd`.

### Try the demo

Open a film, pick a future session and choose seats. Complete demo checkout to see the printable ticket. If the schedule has expired, run `npm run db:refresh-sessions` from the project root and reload the catalogue.

[More commands, checks and troubleshooting](docs/README.md#english) · [SRS](SRS.md)

### Load testing

| Participant | Tool | Level | Scenario |
| --- | --- | --- | --- |
| Lera | [Artillery](docs/testing/artillery.md) | API | Concurrent booking of the same seat |

## Eesti

[Ava eestikeelne README](README.et.md).

<a id="russian"></a>

## Русский

[Открой README на русском](README.ru.md).
