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
  await page.getByRole('button', { name: 'Enlarge film still 1' }).click()
  await expect(page.getByRole('dialog').getByRole('img')).toBeVisible()
  await expect(page.getByRole('dialog')).toHaveAccessibleName('Picture 1')
  await page.getByRole('button', { name: 'Next picture' }).click()
  await expect(page.getByRole('dialog')).toHaveAccessibleName('Picture 2')
  await page.keyboard.press('ArrowLeft')
  await expect(page.getByRole('dialog')).toHaveAccessibleName('Picture 1')
  await page.mouse.click(3, 3)
  await expect(page.getByRole('dialog')).toBeHidden()
  await page.route('https://www.youtube-nocookie.com/**', (route) => route.fulfill({ body: '' }))
  await page.getByRole('button', { name: 'Watch trailer' }).click()
  await expect(page.getByRole('dialog').locator('iframe')).toHaveAttribute(
    'src',
    /youtube-nocookie\.com\/embed\/zSWdZVtXT7E/,
  )
  await page.getByRole('button', { name: 'Close' }).click()
  await page.getByRole('link', { name: 'Showtimes' }).click()
  await expect(page.locator('#sessions')).toBeFocused()
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

test('keeps the filtered catalogue and scroll position when returning from a film', async ({ page }) => {
  const films = Array.from({ length: 8 }, (_, index) => ({
    ...movie, id: index + 1, title: `Space film ${index + 1}`,
  }))
  let catalogueRequests = 0
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.route('**/api/auth/me', (route) => route.fulfill({ status: 401 }))
  await page.route('**/api/movies', (route) => {
    catalogueRequests++
    return route.fulfill({ json: films })
  })
  await page.route('**/api/movies/5', (route) => route.fulfill({ json: films[4] }))
  await page.route('**/api/movies/5/sessions', (route) => route.fulfill({ json: [] }))
  await page.goto('/')

  const search = page.getByRole('searchbox', { name: 'Search movies:' })
  await search.fill('Space')
  const genre = page.getByRole('button', { name: 'Science fiction', exact: true })
  await genre.click()
  await page.getByRole('button', { name: /Now showing/ }).click()
  await page.getByRole('button', { name: 'Next movies', exact: true }).click()
  const track = page.locator('#movies-track')
  await expect.poll(() => track.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0)
  const film = track.getByRole('link', { name: 'Space film 5', exact: true })
  await film.scrollIntoViewIfNeeded()
  const position = await page.evaluate(() => window.scrollY)
  const slide = await track.evaluate((element) => element.scrollLeft)
  await film.click()

  await expect(page.getByRole('heading', { name: 'Space film 5', level: 1 })).toBeVisible()
  await page.getByRole('link', { name: 'All movies' }).click()
  await expect(search).toHaveValue('Space')
  await expect(genre).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('button', { name: /Now showing/ })).toHaveAttribute('aria-pressed', 'true')
  await expect.poll(() => track.evaluate((element) => element.scrollLeft)).toBeCloseTo(slide, 0)
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeCloseTo(position, 0)
  expect(catalogueRequests).toBe(1)
})
