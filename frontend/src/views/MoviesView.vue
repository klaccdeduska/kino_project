<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'

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

const movies = ref<Movie[]>([])
const search = ref('')
const selectedMovieId = ref<number | null>(null)
const sessionsMovieId = ref<number | null>(null)

interface Session {
  id: number
  movieId: number
  date: string
  time: string
}

const sessions = ref<Session[]>([])
const sessionsLoading = ref(false)
const sessionsError = ref('')
const selectedDate = ref('')

const filteredSessions = computed(() => {
  if (selectedDate.value === '') {
    return sessions.value
  }

  return sessions.value.filter(
    (session) => session.date === selectedDate.value
  )
})

function formatSessionDate(date: string) {
  const [year, month, day] = date.split('-')

  return `${day}.${month}.${year}`
}

function getSessionEndTime(time: string, duration: number) {
  const [hours = 0, minutes = 0] = time.split(':').map(Number)

  const endMinutes = hours * 60 + minutes + duration
  const endHours = Math.floor(endMinutes / 60) % 24
  const remainingMinutes = endMinutes % 60

  return `${String(endHours).padStart(2, '0')}:${String(remainingMinutes).padStart(2, '0')}`
}

function endsNextDay(time: string, duration: number) {
  const [hours = 0, minutes = 0] = time.split(':').map(Number)

  return hours * 60 + minutes + duration >= 24 * 60
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
      `http://localhost:3000/api/movies/${movieId}/sessions`
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
const loading = ref(true)
const error = ref('')

const filteredMovies = computed(() => {
  const query = search.value.trim().toLowerCase()

  return movies.value.filter((movie) =>
    movie.title.toLowerCase().includes(query),
  )
})

function toggleDetails(movieId: number) {
  selectedMovieId.value =
    selectedMovieId.value === movieId ? null : movieId
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

onMounted(loadMovies)
</script>

<template>
  <main>
    <h1>BOOBLICKI</h1>
    <h2>Movies</h2>
    <p>Movies loaded from our own database.</p>

    <label for="movie-search">Search movies:</label>
    <input id="movie-search" v-model="search" type="search" placeholder="Movie title" />

    <p v-if="loading">Loading movies...</p>

    <p v-else-if="error">{{ error }}</p>

    <p v-else-if="filteredMovies.length === 0">
      No movies found.
    </p>

    <template v-else>
      <article v-for="movie in filteredMovies" :key="movie.id">
        <img v-if="movie.poster" :src="movie.poster" :alt="movie.title + ' poster'" width="180" />
        <h2>{{ movie.title }}</h2>

        <p>
          {{ movie.genre }} · {{ movie.duration }} min
        </p>

        <p>
          {{ movie.releaseYear }} · {{ movie.ageRating }}
        </p>

        <button type="button" :aria-expanded="selectedMovieId === movie.id" @click="toggleDetails(movie.id)">
          {{ selectedMovieId === movie.id ? 'Hide details' : 'Details' }}
        </button>

        <div v-if="selectedMovieId === movie.id">
          <p>{{ movie.description }}</p>
          <p>Director: {{ movie.director }}</p>
        </div>

        <button type="button" :aria-expanded="sessionsMovieId === movie.id" @click="toggleSessions(movie.id)">
          {{ sessionsMovieId === movie.id ? 'Hide sessions' : 'Show sessions' }}
        </button>

        <div v-if="sessionsMovieId === movie.id">
          <h3>Available sessions</h3>

          <label>
            Date:
            <input v-model="selectedDate" type="date" />
          </label>

          <button type="button" @click="selectedDate = ''">
            All dates
          </button>

          <p v-if="sessionsLoading">Loading sessions...</p>

          <p v-else-if="sessionsError">
            {{ sessionsError }}
          </p>

          <p v-else-if="filteredSessions.length === 0">
            {{ selectedDate ? 'No sessions available for this date.' : 'No sessions available.' }}
          </p>

          <template v-else>
            <div v-for="session in filteredSessions" :key="session.id">
              <span>
                {{ formatSessionDate(session.date) }} —
                {{ session.time }}–{{ getSessionEndTime(session.time, movie.duration) }}
                <small v-if="endsNextDay(session.time, movie.duration)">
                  (next day)
                </small>
              </span>

              <RouterLink :to="{
                name: 'booking',
                params: { movieId: movie.id },
                query: {
                  sessionId: session.id,
                },
              }">
                Choose seats
              </RouterLink>
            </div>
          </template>
        </div>

        <hr />
      </article>
    </template>
  </main>
</template>
