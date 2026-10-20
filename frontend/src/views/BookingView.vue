<script setup lang="ts">
import { ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import SeatPicker from '../components/SeatPicker.vue'

interface Session {
  id: number
  movieId: number
  date: string
  time: string
}

const route = useRoute()

const session = ref<Session | null>(null)
const loading = ref(false)
const error = ref('')

async function loadSession() {
  const movieId = String(route.params.movieId)
  const sessionId = route.query.sessionId

  session.value = null
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

    if (
      String(route.params.movieId) === movieId &&
      route.query.sessionId === sessionId
    ) {
      session.value = data
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
      <p>Movie ID: {{ session.movieId }}</p>
      <p>Session: {{ session.date }} — {{ session.time }}</p>
      <p>Demonstration hall. Your selection is not saved.</p>

      <SeatPicker :key="`${session.movieId}-${session.id}`" />
    </template>
  </main>
</template>