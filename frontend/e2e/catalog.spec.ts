import { test, expect } from '@playwright/test'
import type { CatalogMovie } from '../src/api'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('kino-locale', 'en'))
})

const movie: CatalogMovie = {
  id: 1,
  title: 'Interstellar',
  genre: 'Science fiction',
  duration: 169,
  description: 'A team travels beyond Earth to find a new home for humanity.',
  releaseYear: 2014,
  director: 'Christopher Nolan',
  ageRating: '12+',
  poster: null,
  trailer: null,
  hasUpcomingSessions: true,
}

test('opens a movie from Top movies and keeps its showtimes on a direct visit', async ({ page }) => {
  await page.route('**/api/auth/me', (route) => route.fulfill({ status: 401 }))
  await page.route('**/api/movies', (route) => route.fulfill({ json: [movie] }))
  await page.route('**/api/movies/1', (route) => route.fulfill({ json: movie }))
  await page.route('**/api/movies/1/sessions', (route) => route.fulfill({
    json: [{
      id: 42,
      movieId: 1,
      date: '2030-11-23',
      time: '18:00',
      hallId: 1,
      hallName: 'Hall 1',
      language: 'English',
      subtitles: null,
      format: '2D',
    }],
  }))

  await page.goto('/')
  await expect(page.locator('#movies-track').getByRole('link', { name: movie.title }))
    .toHaveAttribute('href', '/movies/1')
  await page.getByRole('region', { name: 'Top movies' }).first()
    .getByRole('link', { name: movie.title }).click()
  await expect(page).toHaveURL(/\/movies\/1$/)
  await expect(page.getByRole('heading', { name: movie.title, level: 1 })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Choose seats' }))
    .toHaveAttribute('href', '/booking/1?sessionId=42')

  await page.reload()
  await expect(page.getByRole('heading', { name: 'Showtimes' })).toBeVisible()
  await expect(page.getByText('Hall 1 · 2D')).toBeVisible()
})

test('shows a film from the cinema catalogue', async ({ page }) => {
  await page.route('**/api/movies', (route) => route.fulfill({ json: [movie] }))
  await page.route('**/api/auth/me', (route) => route.fulfill({ status: 401 }))

  await page.goto('/')

  await expect(
    page
      .locator('#movies-track')
      .getByRole('heading', { name: movie.title, exact: true, level: 3 }),
  ).toBeVisible()

  const navigation = page.getByRole('navigation', { name: 'Main navigation' })
  await navigation.getByRole('link', { name: 'Sign in' }).click()
  await expect(
    page.getByRole('heading', { name: 'Sign in', level: 1 }),
  ).toBeVisible()

  await navigation.getByRole('link', { name: 'Movies' }).click()
  await expect(page).toHaveURL(/\/#movies$/)
  await expect(
    page.getByRole('heading', { name: 'Explore the cinema' }),
  ).toBeVisible()
})
