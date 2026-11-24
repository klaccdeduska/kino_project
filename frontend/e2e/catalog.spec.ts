import { test, expect } from '@playwright/test'
import type { CatalogMovie } from '../src/api'

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

test('shows a film from the cinema catalogue', async ({ page }) => {
  await page.route('**/api/movies', (route) => route.fulfill({ json: [movie] }))
  await page.route('**/api/auth/me', (route) => route.fulfill({ status: 401 }))

  await page.goto('/')

  await expect(
    page
      .locator('#movies-track')
      .getByRole('heading', { name: movie.title, exact: true }),
  ).toBeVisible()
})
