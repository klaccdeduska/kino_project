<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import {
  formatSessionDate,
  getSessionEndTime,
  endsNextDay,
} from '../utils/session'

interface Movie {
  id: number
  title: string
  genre: string
  duration: number
  description: string
  releaseYear: number
  director: string
  ageRating: string
  poster: string | null
  trailer: string | null
}

interface Session {
  id: number
  movieId: number
  date: string
  time: string
  hallId: number
  hallName: string
  language: string
  subtitles: string | null
  format: string
}

const movies = ref<Movie[]>([])
const search = ref('')
const loading = ref(true)
const error = ref('')
const moviesTrack = ref<HTMLDivElement | null>(null)

const sessionsMovieId = ref<number | null>(null)
const sessions = ref<Session[]>([])
const sessionsLoading = ref(false)
const sessionsError = ref('')
const selectedDate = ref('')

const sessionsMovie = computed(() => {
  return movies.value.find(
    (movie) => movie.id === sessionsMovieId.value
  )
})

const filteredMovies = computed(() => {
  const query = search.value.trim().toLowerCase()

  return movies.value.filter((movie) =>
    movie.title.toLowerCase().includes(query),
  )
})

const moviePages = computed(() => {
  const pages: Movie[][] = []

  for (let i = 0; i < filteredMovies.value.length; i += 4) {
    pages.push(filteredMovies.value.slice(i, i + 4))
  }

  return pages
})

const availableDates = computed(() => {
  const dates = sessions.value.map((session) => session.date)

  return [...new Set(dates)].sort()
})

const filteredSessions = computed(() => {
  if (selectedDate.value === '') {
    return sessions.value
  }

  return sessions.value.filter(
    (session) => session.date === selectedDate.value,
  )
})

function scrollMovies(direction: number) {
  const track = moviesTrack.value
  if (!track || moviePages.value.length === 0) return

  const pageWidth = track.clientWidth
  if (pageWidth === 0) return

  const currentPage = Math.round(track.scrollLeft / pageWidth)
  const lastPage = moviePages.value.length - 1
  const nextPage = Math.max(
    0,
    Math.min(currentPage + direction, lastPage),
  )

  track.scrollTo({
    left: nextPage * pageWidth,
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? 'instant'
      : 'smooth',
  })
}

async function loadMovies() {
  loading.value = true
  error.value = ''

  try {
    const response = await fetch('http://localhost:3000/api/movies')

    if (!response.ok) {
      throw new Error('Failed to load movies')
    }

    movies.value = await response.json()
  } catch (err) {
    error.value = 'Could not load movies from the server.'
    console.error(err)
  } finally {
    loading.value = false
  }
}

async function toggleSessions(movieId: number) {
  if (sessionsMovieId.value === movieId) {
    sessionsMovieId.value = null
    return
  }

  sessionsMovieId.value = movieId
  selectedDate.value = ''
  sessions.value = []
  sessionsError.value = ''
  sessionsLoading.value = true

  try {
    const response = await fetch(
      `http://localhost:3000/api/movies/${movieId}/sessions`,
    )

    if (!response.ok) {
      throw new Error('Failed to load sessions')
    }

    const data: Session[] = await response.json()

    if (sessionsMovieId.value === movieId) {
      sessions.value = data
    }
  } catch (err) {
    if (sessionsMovieId.value === movieId) {
      sessionsError.value = 'Could not load sessions.'
    }

    console.error(err)
  } finally {
    if (sessionsMovieId.value === movieId) {
      sessionsLoading.value = false
    }
  }
}

onMounted(loadMovies)
</script>

<template>
  <main>
    <h1>BUBLIKI</h1>
    <h2>Movies</h2>

    <div class="movie-search">
      <label for="movie-search">Search movies:</label>
      <input id="movie-search" v-model="search" type="search" placeholder="Movie title" />
    </div>

    <p v-if="loading" role="status">Loading movies...</p>

    <p v-else-if="error" role="alert">
      {{ error }}
    </p>

    <p v-else-if="filteredMovies.length === 0">
      No movies found.
    </p>

    <div v-else class="movies-carousel">
      <button class="carousel-arrow" type="button" aria-label="Предыдущие фильмы" aria-controls="movies-track"
        :disabled="moviePages.length <= 1" @click="scrollMovies(-1)">
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round">
          <path d="m15 6-6 6 6 6" />
        </svg>
      </button>

      <div id="movies-track" :key="search" ref="moviesTrack" class="movies-grid" tabindex="0" role="region"
        aria-label="Афиша фильмов">
        <div v-for="(page, pageIndex) in moviePages" :key="pageIndex" class="movies-page">
          <article v-for="movie in page" :key="movie.id" class="movie-card">
            <img v-if="movie.poster" :src="movie.poster" :alt="movie.title + ' poster'" class="movie-poster" />

            <div v-else class="movie-poster poster-placeholder">
              No poster
            </div>

            <h2>{{ movie.title }}</h2>
            <p class="movie-director">{{ movie.director }}</p>
            <p>{{ movie.genre }} · {{ movie.duration }} min</p>
            <p>{{ movie.description }}</p>
            <p>{{ movie.releaseYear }} · {{ movie.ageRating }}</p>

            <button class="sessions-toggle" type="button" :aria-expanded="sessionsMovieId === movie.id"
              @click="toggleSessions(movie.id)">
              {{
                sessionsMovieId === movie.id
                  ? 'Hide sessions'
                  : 'Show sessions'
              }}
            </button>

          </article>
        </div>
      </div>

      <button class="carousel-arrow" type="button" aria-label="Следующие фильмы" aria-controls="movies-track"
        :disabled="moviePages.length <= 1" @click="scrollMovies(1)">
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round">
          <path d="m9 6 6 6-6 6" />
        </svg>
      </button>
    </div>
    <div v-if="sessionsMovie" class="movie-sessions">
      <h3>Sessions: {{ sessionsMovie.title }}</h3>

      <div class="session-dates" role="group" aria-label="Session dates">
        <button v-for="date in availableDates" :key="date" type="button" :class="{
          'date-button--selected': selectedDate === date,
        }" :aria-pressed="selectedDate === date" @click="selectedDate = date">
          {{ formatSessionDate(date) }}
        </button>
      </div>

      <label class="session-date-filter">
        Date:
        <input v-model="selectedDate" type="date" />
      </label>

      <button type="button" @click="selectedDate = ''">
        All dates
      </button>

      <p v-if="sessionsLoading" role="status">
        Loading sessions...
      </p>

      <p v-else-if="sessionsError" role="alert">
        {{ sessionsError }}
      </p>

      <p v-else-if="filteredSessions.length === 0">
        {{
          selectedDate
            ? 'No sessions available for this date.'
            : 'No sessions available.'
        }}
      </p>

      <template v-else>
        <div v-for="session in filteredSessions" :key="session.id" class="session-item">
          <div class="session-time">
            <strong>{{ session.time }}</strong>

            <span>
              Until {{ getSessionEndTime(session.time, sessionsMovie.duration) }}
              <small v-if="endsNextDay(session.time, sessionsMovie.duration)">
                (next day)
              </small>
            </span>
          </div>

          <div class="session-info">
            <span>{{ formatSessionDate(session.date) }}</span>
            <span>{{ session.hallName }} · {{ session.format }}</span>
            <span>Language: {{ session.language }}</span>
            <span>Subtitles: {{ session.subtitles ?? 'Not specified' }}</span>
          </div>

          <RouterLink class="session-book" :to="{
            name: 'booking',
            params: { movieId: sessionsMovie.id },
            query: { sessionId: session.id },
          }">
            Choose seats
          </RouterLink>
        </div>

      </template>
    </div>
  </main>
</template>

<style scoped>
main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
  color: #f2f2f3;
  font-family: Arial, sans-serif;
}

.movie-search {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}

.movies-carousel {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr) 44px;
  align-items: center;
  gap: 12px;
}

.movies-grid {
  display: flex;
  min-width: 0;
  align-items: stretch;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
}

.movies-grid::-webkit-scrollbar {
  display: none;
}

.movies-page {
  box-sizing: border-box;
  flex: 0 0 100%;
  min-width: 0;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  padding: 8px 8px 20px;
  scroll-snap-align: start;
}

.movie-card {
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: 12px;
  background: #18181c;
  border: 1px solid #303036;
  border-radius: 12px;
  box-shadow: 0 8px 24px #0004;
  overflow-wrap: anywhere;
}

.movie-poster {
  display: block;
  width: 100%;
  aspect-ratio: 2 / 3;
  object-fit: cover;
  border-radius: 8px;
}

.poster-placeholder {
  display: grid;
  place-items: center;
  background: #24242b;
  color: #a1a1ad;
}

.movie-card h2 {
  margin: 12px 0 6px;
  font-size: 18px;
  line-height: 1.25;
}

.movie-card p {
  margin: 0 0 8px;
  color: #d4d4da;
  font-size: 14px;
  line-height: 1.4;
}

.movie-card .movie-director {
  color: #a1a1ad;
}

button,
input {
  box-sizing: border-box;
  max-width: 100%;
  padding: 10px 14px;
  border: 1px solid #50505c;
  border-radius: 8px;
  background: #24242b;
  color: #f2f2f3;
  font: inherit;
}

input {
  min-width: 0;
  color-scheme: dark;
}

button {
  cursor: pointer;
}

button:hover:not(:disabled) {
  background: #353540;
}

button:disabled {
  opacity: 0.35;
  cursor: default;
}

button:focus-visible,
input:focus-visible,
a:focus-visible,
.movies-grid:focus-visible {
  outline: 2px solid #b6a0ff;
  outline-offset: 3px;
}

.sessions-toggle {
  width: 100%;
  margin-top: auto;
  padding: 8px 10px;
  font-size: 14px;
}

.movie-sessions {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #303036;
}

.movie-sessions h3 {
  margin: 0 0 12px;
  font-size: 16px;
}

.session-dates {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.session-date-filter {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.session-item {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
  margin-top: 12px;
  padding: 16px;
  background: #18181c;
  border: 1px solid #303036;
  border-radius: 10px;
}

.session-time,
.session-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.session-time {
  min-width: 150px;
}

.session-time strong {
  font-size: 26px;
}

.session-time>span {
  color: #a1a1ad;
  font-size: 14px;
}

.session-info {
  flex: 1;
}

.session-book {
  padding: 10px 18px;
  border: 1px solid #50505c;
  border-radius: 8px;
  background: #24242b;
  color: #f2f2f3;
  text-decoration: none;
  text-align: center;
}

.session-book:hover {
  background: #353540;
}

.date-button--selected {
  background: #c4b5fd;
  border-color: #c4b5fd;
  color: #171320;
}

.date-button--selected:hover:not(:disabled) {
  background: #d4c8ff;
}

a {
  color: #c4b5fd;
}

.carousel-arrow {
  display: grid;
  place-items: center;
  width: 44px;
  height: 64px;
  padding: 0;
  border: 1px solid #41414c;
  border-radius: 14px;
  background: #1c1c23;
  color: #f2f2f3;
  box-shadow: 0 6px 20px #0005;
  transition:
    background 160ms,
    border-color 160ms,
    box-shadow 160ms;
}

.carousel-arrow svg {
  width: 24px;
  height: 24px;
}

.carousel-arrow:hover:not(:disabled) {
  background: #30283f;
  border-color: #b6a0ff;
  box-shadow: 0 0 16px #b6a0ff26;
}

.carousel-arrow:active:not(:disabled) {
  background: #443456;
}

@media (max-width: 900px) {
  .movies-page {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 600px) {
  main {
    padding: 12px;
  }

  .movies-carousel {
    grid-template-columns: 32px minmax(0, 1fr) 32px;
    gap: 4px;
  }

  .carousel-arrow {
    width: 32px;
    height: 48px;
    border-radius: 10px;
  }

  .movies-page {
    gap: 12px;
  }
}

@media (max-width: 500px) {
  .movies-page {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (prefers-reduced-motion: reduce) {
  .carousel-arrow {
    transition: none;
  }
}
</style>
