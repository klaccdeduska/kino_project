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
  language: string
  subtitles: string | null
  format: string
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
      sessionId: session.value.id,
      hallId: session.value.hallId,
      hallName: session.value.hallName,
      date: session.value.date, time: session.value.time, seats
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
      `/api/movies/${encodeURIComponent(movieId)}/sessions/${encodeURIComponent(sessionId)}`
    )

    if (!response.ok) {
      if (response.status === 400 || response.status === 404) {
        throw new Error('Session not found. Please choose another session.')
      }

      throw new Error('Could not load the session.')
    }

    const data: Session = await response.json()
    const movieResponse = await fetch(`/api/movies/${encodeURIComponent(movieId)}`)
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
  <main class="booking-page">
    <div class="booking-shell">
      <header class="booking-topbar">
        <RouterLink to="/" class="brand">BOOBLICKI<span>CINEMA</span></RouterLink>
        <RouterLink to="/" class="back-button"><span aria-hidden="true">←</span> Back to movies</RouterLink>
      </header>

      <nav class="booking-steps" aria-label="Booking progress">
        <span class="step active" aria-current="step"><b>01</b> Choose seats</span>
        <span class="step"><b>02</b> Payment</span>
        <span class="step"><b>03</b> Your tickets</span>
      </nav>

      <div class="page-heading">
        <p class="eyebrow">MAKE YOURSELF COMFORTABLE</p>
        <h1>Your movie. Your seat.</h1>
        <p>Find your favourite spot and settle in for the big screen.</p>
      </div>

      <section v-if="loading" class="state-card" role="status">
        <span class="state-icon" aria-hidden="true">◌</span>
        <h2>Getting the hall ready</h2><p>Loading your session…</p>
      </section>
      <section v-else-if="error" class="state-card" role="alert">
        <h2>This session is unavailable</h2><p>{{ error }}</p>
        <RouterLink to="/" class="back-button">Choose another session →</RouterLink>
      </section>

      <template v-else-if="session">
        <section class="session-card" aria-label="Your session">
          <div class="session-title">
            <span class="format-badge">{{ session.format }}</span>
            <div><p class="eyebrow">YOU'RE WATCHING</p><h2>{{ movieTitle }}</h2></div>
          </div>
          <dl class="session-details">
            <div><dt>Date</dt><dd>{{ formatSessionDate(session.date) }}</dd></div>
            <div><dt>Time · {{ movieDuration }} min</dt><dd>{{ session.time }}–{{ getSessionEndTime(session.time, movieDuration) }}<small v-if="endsNextDay(session.time, movieDuration)"> +1 day</small></dd></div>
            <div><dt>Hall</dt><dd>{{ session.hallName }}</dd></div>
            <div><dt>Language</dt><dd>{{ session.language }}</dd></div>
          </dl>
          <p class="subtitles">Subtitles <span>{{ session.subtitles ?? 'Not specified' }}</span></p>
        </section>

        <p v-if="checkoutError" class="checkout-error" role="alert">{{ checkoutError }}</p>
        <SeatPicker :key="`${session.movieId}-${session.id}`" :occupied-seats="occupiedSeats(session.id)"
          :hall-name="session.hallName"
          :initial-seats="bookingState.draft?.sessionId === session.id ? bookingState.draft.seats : []"
          @checkout="checkout" />
        <footer class="booking-note"><span aria-hidden="true">✦</span> Demo booking · No real payment · Tickets saved in this browser</footer>
      </template>
    </div>
  </main>
</template>

<style scoped>
.booking-page { min-height: 100vh; padding: 28px 24px 40px; background: radial-gradient(ellipse at 80% 0%, #39275540, transparent 55%), #0d0d0f; color: #f2f2f3; }
.booking-shell { max-width: 1100px; margin: auto; }
.booking-topbar { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding-bottom: 28px; border-bottom: 1px solid #ffffff12; }
.brand { color: #fff; text-decoration: none; font-size: 20px; font-weight: 900; letter-spacing: 2px; }
.brand span { display: block; margin-top: 5px; font-size: 9px; letter-spacing: 6px; color: #b6a0ff; }
.back-button { display: inline-flex; align-items: center; gap: 10px; padding: 12px 18px; border: 1px solid #3c3a46; border-radius: 12px; background: #ffffff05; color: #e4dfef; font-size: 13px; text-decoration: none; transition: background 150ms; }
.back-button:hover { background: #b6a0ff18; border-color: #b6a0ff; }
.back-button:focus-visible { outline: 3px solid #c4b5fd; outline-offset: 4px; }
.booking-steps { display: flex; justify-content: center; gap: 44px; padding: 30px 0; }
.step { display: inline-flex; align-items: center; gap: 10px; color: #93909f; font-size: 12px; }
.step b { display: grid; place-items: center; width: 30px; height: 30px; border: 1px solid #383440; border-radius: 50%; font-size: 10px; }
.step.active { color: #e5dcff; }
.step.active b { color: #171320; background: #c4b5fd; border-color: #c4b5fd; box-shadow: 0 0 20px #b6a0ff25; }
.page-heading { margin: 16px 0 30px; }
.eyebrow { margin: 0 0 10px; color: #b6a0ff; font-size: 10px; font-weight: 700; letter-spacing: 2px; }
h1 { margin: 0; font-size: clamp(30px, 5vw, 48px); line-height: 1.15; letter-spacing: -1.5px; }
.page-heading > p:last-child { margin: 14px 0 0; color: #aaa6b4; font-size: 14px; line-height: 1.7; }
.session-card { margin-bottom: 24px; padding: 26px; border: 1px solid #3a3348; border-radius: 20px; background: linear-gradient(110deg, #211b2c, #18171e); }
.session-title { display: flex; align-items: center; gap: 16px; }
.format-badge { display: grid; place-items: center; flex-shrink: 0; min-width: 54px; height: 62px; padding: 8px; color: #d2c0ff; border: 1px solid #6d548b; border-radius: 12px; background: #b6a0ff12; font-weight: 700; }
.session-title h2 { margin: 0; font-size: clamp(20px, 3vw, 26px); }
.session-details { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin: 24px 0 0; padding-top: 22px; border-top: 1px solid #ffffff12; }
.session-details dt, .subtitles { color: #aaa6b4; font-size: 12px; }
.session-details dd { margin: 8px 0 0; font-size: 15px; font-weight: 600; }
.session-details small { color: #c4b5fd; font-size: 10px; }
.subtitles { margin: 20px 0 0; line-height: 1.6; }
.subtitles span { margin-left: 10px; color: #d0cbd9; }
.booking-note { margin-top: 24px; color: #9994a5; font-size: 12px; text-align: center; line-height: 1.8; }
.booking-note span { margin-right: 6px; color: #c4b5fd; }
.state-card { padding: 60px 24px; text-align: center; background: #19171f; border: 1px solid #393340; border-radius: 20px; }
.state-card p { margin-bottom: 24px; color: #b9b3c4; }
.state-icon { font-size: 40px; color: #c4b5fd; }
.checkout-error { padding: 16px; background: #451f2b; border: 1px solid #ac566e; border-radius: 12px; }
@media (max-width: 600px) {
  .booking-page { padding: 18px 14px 30px; }
  .booking-steps { gap: 16px; }
  .step { gap: 6px; font-size: 10px; }
  .step b { width: 24px; height: 24px; }
  .session-card { padding: 20px; }
  .session-details { grid-template-columns: repeat(2, 1fr); }
  .brand { font-size: 16px; }
  .back-button { padding: 10px 12px; font-size: 12px; }
}
@media (prefers-reduced-motion: reduce) { .back-button { transition: none; } }
</style>
