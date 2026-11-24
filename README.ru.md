# BUBLIKI Cinema

[English](README.md) · [Eesti](README.et.md) · **Русский**

BUBLIKI — учебный сайт кинотеатра. Здесь можно посмотреть фильмы и сеансы, выбрать места и распечатать демобилеты. Покупки сохраняются в текущем браузере, а демооплата не списывает деньги.

## Первый запуск

Установи Node.js 24.12 или новее, Git и Docker Desktop с Compose v2. Запусти Docker Desktop и выполни команды:

```sh
git clone https://github.com/klaccdeduska/kino_project.git
cd kino_project
npm run setup
npm run dev
```

Открой [сайт](http://localhost:5173). Если PowerShell блокирует npm, используй `npm.cmd`.

## Попробуй демо

Открой фильм, выбери будущий сеанс и место. После демооплаты можно открыть и распечатать билет. Если расписание закончилось, выполни `npm run db:refresh-sessions` из корня проекта и обнови каталог.

[Дополнительные команды, проверки и диагностика](docs/README.md#russian) · [SRS](SRS.md)
