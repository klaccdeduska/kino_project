# Frontend

Languages / Keeled / Языки: [English](#english) · [Eesti](#eesti) · [Русский](#русский)

## English

This template should help get you started developing with Vue 3 in Vite.

### Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

### Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

### Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

### Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

### Project Setup

```sh
npm install
```

#### Compile and Hot-Reload for Development

```sh
npm run dev
```

#### Type-Check, Compile and Minify for Production

```sh
npm run build
```

#### Run Unit Tests with [Vitest](https://vitest.dev/)

```sh
npm run test:unit
```

#### Run End-to-End Tests with [Playwright](https://playwright.dev)

```sh
# Install browsers for the first run
npx playwright install

# When testing on CI, must build the project first
npm run build

# Runs the end-to-end tests
npm run test:e2e
# Runs the tests only on Chromium
npm run test:e2e -- --project=chromium
# Runs the tests of a specific file
npm run test:e2e -- tests/example.spec.ts
# Runs the tests in debug mode
npm run test:e2e -- --debug
```

---

## Eesti

See mall aitab alustada Vue 3 arendust Vite abil.

### Soovitatav arenduskeskkond

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (keela Vetur).

### Soovitatavad brauseriseaded

- Chromiumi-põhised brauserid (Chrome, Edge, Brave jne):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
  - [Luba Chrome DevToolsis kohandatud objektivormindaja](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Luba Firefox DevToolsis kohandatud objektivormindaja](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

### Tüübitugi `.vue` importidele TypeScriptis

TypeScript ei töötle vaikimisi `.vue` importide tüübiinfot, seega kasutame tüübikontrolliks `tsc` asemel `vue-tsc` käsureatööriista. Redaktoris vajame [Volarit](https://marketplace.visualstudio.com/items?itemName=Vue.volar), et TypeScripti keeleteenus tunneks `.vue` tüüpe.

### Seadistuse kohandamine

Vaata [Vite seadistuse juhendit](https://vite.dev/config/).

### Projekti seadistamine

```sh
npm install
```

#### Kompileerimine ja automaatne värskendamine arenduses

```sh
npm run dev
```

#### Tüübikontroll, kompileerimine ja minimeerimine tootmiskeskkonna jaoks

```sh
npm run build
```

#### Ühiktestide käivitamine tööriistaga [Vitest](https://vitest.dev/)

```sh
npm run test:unit
```

#### Läbivate testide käivitamine tööriistaga [Playwright](https://playwright.dev)

```sh
# Paigalda brauserid enne esimest käivitamist
npx playwright install

# CI-keskkonnas testimiseks koosta esmalt projekt
npm run build

# Käivita läbivad testid
npm run test:e2e
# Käivita testid ainult Chromiumis
npm run test:e2e -- --project=chromium
# Käivita ühe kindla faili testid
npm run test:e2e -- tests/example.spec.ts
# Käivita testid silumisrežiimis
npm run test:e2e -- --debug
```

---

## Русский

Этот шаблон помогает начать разработку на Vue 3 с Vite.

### Рекомендуемая среда разработки

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (отключи Vetur).

### Рекомендуемые настройки браузера

- Браузеры на Chromium (Chrome, Edge, Brave и другие):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
  - [Включи Custom Object Formatter в Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Включи Custom Object Formatter в Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

### Поддержка типов при импорте `.vue` в TypeScript

TypeScript по умолчанию не обрабатывает информацию о типах при импорте `.vue`, поэтому для проверки типов вместо `tsc` используется `vue-tsc`. В редакторе нужен [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar), чтобы языковая служба TypeScript распознавала типы `.vue`.

### Настройка конфигурации

Смотри [справочник конфигурации Vite](https://vite.dev/config/).

### Установка проекта

```sh
npm install
```

#### Сборка и горячая перезагрузка при разработке

```sh
npm run dev
```

#### Проверка типов, сборка и минификация для публикации

```sh
npm run build
```

#### Запуск модульных тестов с [Vitest](https://vitest.dev/)

```sh
npm run test:unit
```

#### Запуск сквозных тестов с [Playwright](https://playwright.dev)

```sh
# Установи браузеры перед первым запуском
npx playwright install

# Для тестирования в CI сначала собери проект
npm run build

# Запусти сквозные тесты
npm run test:e2e
# Запусти тесты только в Chromium
npm run test:e2e -- --project=chromium
# Запусти тесты из указанного файла
npm run test:e2e -- tests/example.spec.ts
# Запусти тесты в режиме отладки
npm run test:e2e -- --debug
```
