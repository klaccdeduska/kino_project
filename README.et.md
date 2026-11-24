# BUBLIKI Cinema

[English](README.md) · **Eesti** · [Русский](README.ru.md)

BUBLIKI on õppeprojekt, kus saab sirvida filme ja seansse, valida istekohti ning printida demopileteid. Piletid salvestatakse kasutatavasse brauserisse ja demoostu eest raha ei võeta.

## Esimene käivitus

Paigalda Node.js 24.12 või uuem, Git ja Docker Desktop koos Compose v2-ga. Käivita Docker Desktop ja käivita järgmised käsud:

```sh
git clone https://github.com/klaccdeduska/kino_project.git
cd kino_project
npm run setup
npm run dev
```

Ava [veebirakendus](http://localhost:5173). Kui PowerShell blokeerib npm-i, kasuta `npm.cmd`.

## Proovi demot

Ava film, vali tulevane seanss ja istekoht. Pärast demoostu saad pileti printida. Kui ajakava on aegunud, käivita projekti juurkaustas `npm run db:refresh-sessions` ja laadi kataloog uuesti.

[Lisakäsud, kontrollid ja tõrkeotsing](docs/README.md#eesti) · [SRS](SRS.md)
