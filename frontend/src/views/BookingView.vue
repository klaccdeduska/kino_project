<script setup lang="ts">
import { ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import SeatPicker from '../components/SeatPicker.vue'
import { bookingState, occupiedSeats, startCheckout } from '../stores/booking'
import {
  formatSessionDate,
  getSessionEndTime,
  endsNextDay,
} from '../utils/session'

interface Session {
  id: number
  movieId: number
  date: string
  time: string
  hallId: number
  hallName: string
}

const route = useRoute()
const router = useRouter()
const movieTitle = ref('')
const movieDuration = ref(0)
const checkoutError = ref('')

function checkout(seats: string[]) {
  if (!session.value) return
  try {
    startCheckout({
      movieId: session.value.movieId, movieTitle: movieTitle.value,
      sessionId: session.value.id, date: session.value.date, time: session.value.time, seats
    })
    void router.push({ name: 'payment' })
  } catch {
    checkoutError.value = 'Could not save your selection. Please allow browser storage and try again.'
  }
}

const session = ref<Session | null>(null)
const loading = ref(false)
const error = ref('')

async function loadSession() {
  const movieId = String(route.params.movieId)
  const sessionId = route.query.sessionId

  session.value = null
  checkoutError.value = ''
  error.value = ''
  loading.value = true

  try {
    if (typeof sessionId !== 'string' || sessionId.trim() === '') {
      error.value = 'Please choose a session from the movie list.'
      return
    }

    const response = await fetch(
      `http://localhost:3000/api/movies/${encodeURIComponent(movieId)}/sessions/${encodeURIComponent(sessionId)}`
    )

    if (!response.ok) {
      if (response.status === 400 || response.status === 404) {
        throw new Error('Session not found. Please choose another session.')
      }

      throw new Error('Could not load the session.')
    }

    const data: Session = await response.json()
    const movieResponse = await fetch(`http://localhost:3000/api/movies/${encodeURIComponent(movieId)}`)
    if (!movieResponse.ok) throw new Error('Could not load the movie.')
    const movie: { title: string; duration: number } =
      await movieResponse.json()

    if (
      String(route.params.movieId) === movieId &&
      route.query.sessionId === sessionId
    ) {
      session.value = data
      movieTitle.value = movie.title
      movieDuration.value = movie.duration
    }
  } catch (err) {
    if (
      String(route.params.movieId) === movieId &&
      route.query.sessionId === sessionId
    ) {
      error.value =
        err instanceof Error ? err.message : 'Could not load the session.'
    }
  } finally {
    if (
      String(route.params.movieId) === movieId &&
      route.query.sessionId === sessionId
    ) {
      loading.value = false
    }
  }
}

watch(
  () => [route.params.movieId, route.query.sessionId],
  loadSession,
  { immediate: true }
)
</script>

<template>
  <main>
    <RouterLink to="/">Back to movies</RouterLink>

    <h1>Choose your seats</h1>

    <p v-if="loading">Loading session...</p>

    <p v-else-if="error">{{ error }}</p>

    <template v-else-if="session">
      <p>{{ movieTitle }}</p>
      <p>Hall: {{ session.hallName }}</p>
      <p>
        Session: {{ formatSessionDate(session.date) }} —
        {{ session.time }}–{{ getSessionEndTime(session.time, movieDuration) }}
        <small v-if="endsNextDay(session.time, movieDuration)">
          (next day)
        </small>
      </p>

      <p>Movie duration: {{ movieDuration }} min</p>
      <p>Demo booking. Purchases are saved in this browser only.</p>

      <p v-if="checkoutError" role="alert">{{ checkoutError }}</p>
      <SeatPicker :key="`${session.movieId}-${session.id}`" :occupied-seats="occupiedSeats(session.id)"
        :initial-seats="bookingState.draft?.sessionId === session.id ? bookingState.draft.seats : []"
        @checkout="checkout" />
    </template>
  </main>
</template>
