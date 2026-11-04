<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { formatSessionDate } from '../utils/session'
import {
  bookingState,
  calculateTotalCents,
  formatPrice,
  getSeatPriceCents,
  purchase,
} from '../stores/booking'

const router = useRouter()

const draft = computed(() => bookingState.value.draft)

const totalCents = computed(
  () => calculateTotalCents(draft.value?.seats ?? []),
)

const submitting = ref(false)
const error = ref('')

async function pay() {
  if (submitting.value) return

  submitting.value = true
  error.value = ''

  try {
    const selection = draft.value
    if (!selection) throw new Error('Please choose your seats first.')
    const response = await fetch(`/api/movies/${selection.movieId}/sessions/${selection.sessionId}`)
    if (!response.ok) {
      throw new Error(response.status === 404
        ? 'Session is no longer available. Please choose another session.'
        : 'Could not verify the session. Please try again.')
    }
    if (draft.value !== selection) throw new Error('Your selection changed. Please try again.')
    const order = purchase()

    await router.replace({
      name: 'tickets',
      params: { orderId: order.id },
    })
  } catch (err) {
    error.value = err instanceof Error
      ? err.message
      : 'Could not complete the purchase.'

    submitting.value = false
  }
}
</script>

<template>
  <main class="payment-page">
    <div class="payment-shell">
      <header class="topbar">
        <RouterLink to="/" class="brand">BOOBLICKI<span>CINEMA</span></RouterLink>
        <RouterLink v-if="draft" class="back-button" :to="{
          name: 'booking', params: { movieId: draft.movieId }, query: { sessionId: draft.sessionId },
        }">← Back to seats</RouterLink>
        <RouterLink v-else to="/" class="back-button">← Back to movies</RouterLink>
      </header>

      <nav class="steps" aria-label="Booking progress">
        <span class="step complete"><b>✓</b> Choose seats</span>
        <span class="step active" aria-current="step"><b>02</b> Payment</span>
        <span class="step"><b>03</b> Your tickets</span>
      </nav>

      <div class="page-heading">
        <p class="eyebrow">ONE STEP CLOSER TO THE BIG SCREEN</p>
        <h1>Make it a movie night.</h1>
        <p>Review your seats and confirm your booking.</p>
      </div>

      <p v-if="error" class="error-message" role="alert">{{ error }}</p>

      <div v-if="draft" class="payment-layout">
        <section class="booking-card" aria-labelledby="booking-title">
          <div class="card-heading"><span class="eyebrow">YOUR BOOKING</span><span class="badge">{{ draft.hallName }}</span></div>
          <h2 id="booking-title">{{ draft.movieTitle }}</h2>
          <p class="session-line">{{ formatSessionDate(draft.date) }} — {{ draft.time }} · {{ draft.hallName }}</p>

          <div class="seats-heading"><h3>Your seats</h3><span>{{ draft.seats.length }} {{ draft.seats.length === 1 ? 'ticket' : 'tickets' }}</span></div>
          <ul class="seat-list">
            <li v-for="seat in draft.seats" :key="seat">
              <span class="seat-marker" aria-hidden="true">{{ seat.split('-')[0] }}</span>
              <div class="seat-info"><strong>Row {{ seat.split('-')[0] }} · Seat {{ seat.split('-')[1] }}</strong><span>{{ seat.startsWith('E-') ? 'VIP' : seat.startsWith('D-') ? 'Double' : 'Standard' }}</span></div>
              <strong class="seat-price">{{ formatPrice(getSeatPriceCents(seat)) }}</strong>
            </li>
          </ul>
          <p class="edit-note">Want a different view? <RouterLink :to="{ name: 'booking', params: { movieId: draft.movieId }, query: { sessionId: draft.sessionId } }">Change your seats →</RouterLink></p>
        </section>

        <aside class="summary-card" aria-labelledby="summary-title">
          <p class="eyebrow">THE FINAL DETAILS</p>
          <h2 id="summary-title">Order summary</h2>
          <div class="summary-line"><span>Tickets: {{ draft.seats.length }}</span><span>{{ formatPrice(totalCents) }}</span></div>
          <div class="total"><span>Total</span><strong>{{ formatPrice(totalCents) }}</strong></div>
          <div class="demo-notice"><span class="demo-icon" aria-hidden="true">✦</span><div><strong>Just a demo. Enjoy the experience.</strong><p>No money will be charged and no card details are required.</p></div></div>
          <button class="pay-button" type="button" :disabled="submitting || draft.seats.length === 0" :aria-busy="submitting" @click="pay">{{ submitting ? 'Processing…' : 'Confirm demo payment' }}</button>
          <p class="confirmation-note">Your tickets will be ready on the next page.</p>
        </aside>
      </div>

      <section v-else class="empty-state">
        <span aria-hidden="true">✦</span><h2>Your movie night starts with a seat.</h2>
        <p>No seats selected. Choose a movie and session to continue.</p>
        <RouterLink class="back-button" to="/">Browse movies →</RouterLink>
      </section>
      <footer>Demo booking · No real payment · Tickets saved in this browser</footer>
    </div>
  </main>
</template>

<style scoped>
.payment-page { min-height: 100vh; padding: 28px 24px 40px; background: radial-gradient(ellipse at 80% 0%, #39275540, transparent 55%), #0d0d0f; color: #f2f2f3; }
.payment-shell { max-width: 1100px; margin: auto; }
.topbar { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding-bottom: 28px; border-bottom: 1px solid #ffffff12; }
.brand { color: #fff; text-decoration: none; font-size: 20px; font-weight: 900; letter-spacing: 2px; }
.brand span { display: block; margin-top: 5px; font-size: 9px; letter-spacing: 6px; color: #b6a0ff; }
.back-button { display: inline-flex; align-items: center; gap: 10px; padding: 12px 18px; border: 1px solid #3c3a46; border-radius: 12px; background: #ffffff05; color: #e4dfef; font-size: 13px; text-decoration: none; transition: background 150ms; }
.back-button:hover { background: #b6a0ff18; border-color: #b6a0ff; }
.steps { display: flex; justify-content: center; gap: 44px; padding: 30px 0; }
.step { display: inline-flex; align-items: center; gap: 10px; color: #93909f; font-size: 12px; }
.step b { display: grid; place-items: center; width: 30px; height: 30px; border: 1px solid #383440; border-radius: 50%; font-size: 10px; }
.step.active { color: #e5dcff; }
.step.active b { color: #171320; background: #c4b5fd; border-color: #c4b5fd; box-shadow: 0 0 20px #b6a0ff25; }
.step.complete { color: #c4b5fd; }
.step.complete b { border-color: #786393; background: #b6a0ff12; }
.page-heading { margin: 16px 0 30px; }
.eyebrow { margin: 0 0 10px; color: #b6a0ff; font-size: 10px; font-weight: 700; letter-spacing: 2px; }
h1 { margin: 0; font-size: clamp(30px, 5vw, 48px); line-height: 1.15; letter-spacing: -1.5px; }
.page-heading > p:last-child { margin: 14px 0 0; color: #aaa6b4; font-size: 14px; line-height: 1.7; }
.payment-layout { display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr); align-items: start; gap: 24px; }
.booking-card, .summary-card { min-width: 0; padding: 28px; border: 1px solid #3a3348; border-radius: 20px; background: #17161c; box-shadow: 0 20px 70px #0002; }
.booking-card { background: linear-gradient(135deg, #211b2c, #17161c 65%); }
.card-heading { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
.card-heading .eyebrow { margin: 0; }
.badge { padding: 7px 12px; border: 1px solid #645078; border-radius: 8px; color: #d6c7f0; font-size: 11px; }
h2 { margin: 22px 0 12px; font-size: 25px; overflow-wrap: anywhere; }
.session-line { margin: 0; color: #bbb2c9; font-size: 13px; line-height: 1.8; }
.seats-heading { display: flex; justify-content: space-between; align-items: center; margin-top: 30px; padding-top: 24px; border-top: 1px solid #ffffff12; }
.seats-heading h3 { margin: 0; font-size: 15px; }
.seats-heading > span { color: #a69bb8; font-size: 12px; }
.seat-list { padding: 0; margin: 18px 0 0; list-style: none; }
.seat-list li { display: flex; align-items: center; gap: 14px; padding: 16px 0; border-bottom: 1px solid #ffffff0d; }
.seat-marker { display: grid; place-items: center; flex: 0 0 40px; height: 44px; background: #b6a0ff12; color: #d8c8ff; border: 1px solid #65507f; border-radius: 10px; font-weight: 700; }
.seat-info { display: flex; flex: 1; flex-direction: column; gap: 7px; font-size: 13px; }
.seat-info > span { color: #a99dbb; font-size: 11px; }
.seat-price { white-space: nowrap; font-size: 14px; }
.edit-note { margin: 24px 0 0; color: #a99dbb; font-size: 12px; line-height: 1.8; }
.edit-note a { display: inline-block; color: #d1bfff; margin-left: 4px; text-underline-offset: 4px; }
.summary-card h2 { margin-top: 12px; font-size: 22px; }
.summary-line { display: flex; justify-content: space-between; gap: 16px; margin-top: 28px; color: #bcb3c8; font-size: 14px; }
.total { display: flex; justify-content: space-between; align-items: center; gap: 16px; margin-top: 24px; padding-top: 24px; border-top: 1px solid #3a3348; font-size: 16px; }
.total strong { color: #e0d2ff; font-size: 32px; letter-spacing: -1px; white-space: nowrap; }
.demo-notice { display: flex; gap: 12px; margin: 26px 0 22px; padding: 16px; background: #b6a0ff0b; border: 1px solid #4a3c5f; border-radius: 12px; }
.demo-icon { color: #c4b5fd; }
.demo-notice strong { font-size: 12px; line-height: 1.6; color: #dcd0ee; }
.demo-notice p { margin: 7px 0 0; color: #aaa0b8; font-size: 12px; line-height: 1.7; }
.pay-button { width: 100%; min-height: 52px; padding: 14px 16px; border: 1px solid #c4b5fd; border-radius: 12px; background: #c4b5fd; color: #20152f; font: inherit; font-size: 14px; font-weight: 700; cursor: pointer; box-shadow: 0 5px 22px #b6a0ff20; transition: background 150ms, transform 150ms; }
.pay-button:hover:not(:disabled) { background: #d8cdff; transform: translateY(-1px); }
.pay-button:disabled { opacity: .5; cursor: not-allowed; }
a:focus-visible, button:focus-visible { outline: 3px solid #dfd4ff; outline-offset: 4px; }
.confirmation-note { margin: 14px 0 0; text-align: center; color: #a69bb8; font-size: 11px; line-height: 1.7; }
footer { margin-top: 30px; color: #9994a5; font-size: 12px; text-align: center; line-height: 1.8; }
.error-message { margin-bottom: 24px; padding: 16px; color: #ffd7e1; background: #451f2b; border: 1px solid #ac566e; border-radius: 12px; line-height: 1.6; }
.empty-state { padding: 56px 24px; text-align: center; background: #19171f; border: 1px solid #393340; border-radius: 20px; }
.empty-state > span { color: #c4b5fd; font-size: 32px; }
.empty-state p { color: #b9b3c4; margin-bottom: 24px; line-height: 1.7; }
@media (max-width: 760px) { .payment-layout { grid-template-columns: 1fr; } }
@media (max-width: 600px) {
  .payment-page { padding: 18px 14px 30px; }
  .steps { gap: 16px; }
  .step { gap: 6px; font-size: 10px; }
  .step b { width: 24px; height: 24px; }
  .brand { font-size: 16px; }
  .back-button { padding: 10px 12px; font-size: 12px; }
  .booking-card, .summary-card { padding: 22px 18px; }
  .seat-list li { gap: 10px; }
}
@media (prefers-reduced-motion: reduce) { .back-button, .pay-button { transition: none; } .pay-button:hover:not(:disabled) { transform: none; } }
</style>
