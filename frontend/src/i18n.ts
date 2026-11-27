import { createI18n } from 'vue-i18n'

export type Locale = 'et' | 'ru' | 'en'

const messages = {
  en: {
    nav: {
      mainNavigation: 'Main navigation',
      language: 'Site language',
      languageSaveFailed: 'Language changed on this device but could not be saved to your profile.',
      movies: 'Movies',
      searchMovies: 'Search movies',
      tickets: 'My tickets',
      profile: 'Profile',
      login: 'Sign in',
      signUp: 'Sign up',
      logout: 'Log out',
    },
    auth: { signIn: 'Sign in', register: 'Create account' },
    profile: { title: 'My profile', save: 'Save profile', language: 'Language' },
  },
  et: {
    nav: {
      mainNavigation: 'Peamenüü',
      language: 'Saidi keel',
      languageSaveFailed: 'Keel muudeti selles seadmes, kuid profiili salvestamine ebaõnnestus.',
      movies: 'Filmid',
      searchMovies: 'Otsi filme',
      tickets: 'Minu piletid',
      profile: 'Profiil',
      login: 'Logi sisse',
      signUp: 'Loo konto',
      logout: 'Logi välja',
    },
    auth: { signIn: 'Logi sisse', register: 'Loo konto' },
    profile: { title: 'Minu profiil', save: 'Salvesta profiil', language: 'Keel' },
  },
  ru: {
    nav: {
      mainNavigation: 'Главная навигация',
      language: 'Язык сайта',
      languageSaveFailed: 'Язык изменён на этом устройстве, но не сохранён в профиле.',
      movies: 'Фильмы',
      searchMovies: 'Поиск фильмов',
      tickets: 'Мои билеты',
      profile: 'Профиль',
      login: 'Войти',
      signUp: 'Регистрация',
      logout: 'Выйти',
    },
    auth: { signIn: 'Войти', register: 'Создать аккаунт' },
    profile: { title: 'Мой профиль', save: 'Сохранить профиль', language: 'Язык' },
  },
}

const saved = localStorage.getItem('kino-locale')
const initialLocale: Locale =
  saved === 'et' || saved === 'ru' || saved === 'en' ? saved : 'et'

export const i18n = createI18n({
  legacy: false,
  locale: initialLocale,
  fallbackLocale: 'en',
  messages,
})

export function setLocale(locale: Locale) {
  i18n.global.locale.value = locale
  localStorage.setItem('kino-locale', locale)
}
