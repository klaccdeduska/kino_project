<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { formatSessionDate } from '../utils/session'
import {
  bookingState,
  formatPrice,
  getSeatPriceCents,
} from '../stores/booking'

const route = useRoute()

const order = computed(() =>
  bookingState.value.orders.find(
    item => item.id === route.params.orderId,
  ),
)

function printTickets() {
  window.print()
}
</script>

<template>
  <main class="tickets-page">
    <div class="tickets-shell">
      <header class="topbar print-action">
        <RouterLink to="/" class="brand">BOOBLICKI<span>CINEMA</span></RouterLink>
        <RouterLink to="/" class="back-button">← Back to movies</RouterLink>
      </header>

      <template v-if="order">
        <nav class="steps print-action" aria-label="Booking progress">
          <span class="step complete"><b>✓</b> Choose seats</span>
          <span class="step complete"><b>✓</b> Payment</span>
          <span class="step active" aria-current="step"><b>03</b> Your tickets</span>
        </nav>

        <section class="success-heading" aria-labelledby="confirmation-title">
          <span class="success-icon" aria-hidden="true">✓</span>
          <div><p class="eyebrow">YOUR MOVIE NIGHT IS READY</p><h1 id="confirmation-title">Tickets purchased!</h1><p>Your demo payment was successful. No money was charged.</p></div>
        </section>

        <section class="order-summary" aria-label="Order summary">
          <div><span class="detail-label">Order reference</span><p class="order-reference">{{ order.id }}</p></div>
          <div><span class="detail-label">Tickets</span><p>{{ order.seats.length }}</p></div>
          <div><span class="detail-label">Total paid (demo)</span><p class="order-total">{{ formatPrice(order.totalCents) }}</p></div>
        </section>

        <div class="section-heading print-action"><h2>Your tickets</h2><span>One ticket. One great seat.</span></div>
        <div class="ticket-list">
          <article v-for="(seat, index) in order.seats" :key="seat" class="ticket" :aria-label="`Ticket ${index + 1}, row ${seat.split('-')[0]}, seat ${seat.split('-')[1]}`">
            <div class="ticket-main">
              <div class="ticket-heading"><span class="eyebrow">BOOBLICKI CINEMA</span><span class="category-badge">{{ seat.startsWith('E-') ? 'VIP' : seat.startsWith('D-') ? 'Double' : 'Standard' }}</span></div>
              <h2>{{ order.movieTitle }}</h2>
              <p class="session-line">{{ formatSessionDate(order.date) }} — {{ order.time }}</p>
              <p class="seat-line">{{ order.hallName }} · Row {{ seat.split('-')[0] }} · Seat {{ seat.split('-')[1] }}</p>
              <p class="ticket-reference">Ticket: {{ order.id }}-{{ index + 1 }}</p>
              <small>Demo ticket · Not valid for cinema admission</small>
            </div>
            <div class="ticket-stub">
              <span class="stub-label">YOUR SEAT</span>
              <strong class="seat-number">{{ seat.split('-')[0] }}<span>{{ seat.split('-')[1] }}</span></strong>
              <span class="stub-hall">{{ order.hallName }}</span>
              <strong class="ticket-price">Price: {{ formatPrice(getSeatPriceCents(seat)) }}</strong>
              <span class="ticket-count">{{ String(index + 1).padStart(2, '0') }} / {{ String(order.seats.length).padStart(2, '0') }}</span>
            </div>
          </article>
        </div>

        <section class="save-panel print-action" aria-labelledby="save-title">
          <div><h2 id="save-title">Keep your movie night handy.</h2><p>Print your tickets or save a PDF to your device.</p></div>
          <button type="button" class="primary-button" @click="printTickets">Print / save tickets as PDF</button>
        </section>
        <p class="browser-note print-action">Demo tickets are saved in this browser. Save a PDF if you want to keep a copy.</p>
      </template>

      <section v-else class="empty-state">
        <span class="empty-icon" aria-hidden="true">✦</span><p class="eyebrow">LET'S FIND YOUR MOVIE NIGHT</p>
        <h1>Order not found</h1><p>Demo tickets are available only in the browser where you purchased them.</p>
        <RouterLink class="back-button" to="/">Browse movies →</RouterLink>
      </section>
      <footer class="print-action">Demo booking · No real payment · Tickets saved in this browser</footer>
    </div>
  </main>
</template>

<style scoped>
.tickets-page { min-height: 100vh; padding: 28px 24px 40px; background: radial-gradient(ellipse at 80% 0%, #39275540, transparent 55%), #0d0d0f; color: #f2f2f3; }
.tickets-shell { max-width: 1100px; margin: auto; }
.topbar { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding-bottom: 28px; border-bottom: 1px solid #ffffff12; }
.brand { color: #fff; text-decoration: none; font-size: 20px; font-weight: 900; letter-spacing: 2px; }
.brand span { display: block; margin-top: 5px; font-size: 9px; letter-spacing: 6px; color: #b6a0ff; }
.back-button { display: inline-flex; align-items: center; padding: 12px 18px; border: 1px solid #3c3a46; border-radius: 12px; background: #ffffff05; color: #e4dfef; font-size: 13px; text-decoration: none; transition: background 150ms; }
.back-button:hover { background: #b6a0ff18; border-color: #b6a0ff; }
.steps { display: flex; justify-content: center; gap: 44px; padding: 30px 0; }
.step { display: inline-flex; align-items: center; gap: 10px; color: #93909f; font-size: 12px; }
.step b { display: grid; place-items: center; width: 30px; height: 30px; border: 1px solid #383440; border-radius: 50%; font-size: 10px; }
.step.active { color: #e5dcff; }
.step.active b { color: #171320; background: #c4b5fd; border-color: #c4b5fd; box-shadow: 0 0 20px #b6a0ff25; }
.step.complete { color: #c4b5fd; }
.step.complete b { border-color: #786393; background: #b6a0ff12; }
.success-heading { display: flex; align-items: center; gap: 24px; margin: 20px 0 32px; }
.success-icon { display: grid; place-items: center; flex: 0 0 68px; height: 68px; border: 1px solid #75618e; border-radius: 22px; background: #b6a0ff15; color: #d5c4ff; font-size: 32px; box-shadow: 0 0 40px #b6a0ff10; }
.eyebrow { margin: 0 0 10px; color: #b6a0ff; font-size: 10px; font-weight: 700; letter-spacing: 2px; }
h1 { margin: 0; font-size: clamp(30px, 5vw, 46px); line-height: 1.15; letter-spacing: -1.5px; }
.success-heading div > p:last-child { margin: 14px 0 0; color: #aaa6b4; font-size: 14px; line-height: 1.7; }
.order-summary { display: grid; grid-template-columns: minmax(0, 2fr) minmax(70px, .6fr) minmax(130px, 1fr); gap: 24px; padding: 24px 28px; background: #19161f; border: 1px solid #3a3348; border-radius: 16px; }
.detail-label { color: #a99db8; font-size: 11px; }
.order-summary p { margin: 10px 0 0; font-size: 15px; font-weight: 600; }
.order-reference { overflow-wrap: anywhere; font-family: monospace; font-weight: 400 !important; }
.order-summary .order-total { color: #e0d2ff; font-size: 22px; }
.section-heading { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin: 34px 0 18px; }
.section-heading h2 { margin: 0; font-size: 20px; }
.section-heading span { color: #a99db8; font-size: 12px; }
.ticket-list { display: grid; gap: 20px; }
.ticket { display: grid; grid-template-columns: minmax(0, 1fr) 200px; overflow: hidden; border: 1px solid #4b3b62; border-radius: 20px; background: linear-gradient(110deg, #241c30, #17161c 65%); break-inside: avoid; }
.ticket-main { min-width: 0; padding: 28px; }
.ticket-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.ticket-heading .eyebrow { margin: 0; }
.category-badge { padding: 6px 12px; border: 1px solid #645078; border-radius: 8px; color: #dac7f9; font-size: 11px; }
.ticket h2 { margin: 22px 0 14px; font-size: clamp(22px, 3vw, 29px); overflow-wrap: anywhere; }
.session-line { margin: 0 0 12px; color: #ddd3eb; font-size: 15px; }
.seat-line { color: #c1b5ce; font-size: 14px; line-height: 1.7; }
.ticket-reference { margin: 24px 0 10px; color: #a99db8; font: 11px/1.7 monospace; overflow-wrap: anywhere; }
.ticket small { color: #ac9dbc; font-size: 10px; line-height: 1.7; }
.ticket-stub { display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 14px; padding: 24px 16px; border-left: 2px dashed #5b486e; background: #b6a0ff08; }
.stub-label { color: #b6a0ff; font-size: 9px; letter-spacing: 3px; }
.seat-number { color: #d7c6ff; font-size: 48px; line-height: 1; letter-spacing: -3px; }
.seat-number span { margin-left: 7px; color: #f3edf9; }
.stub-hall { color: #c0b2d1; font-size: 12px; }
.ticket-price { font-size: 13px; }
.ticket-count { color: #a99db8; font: 11px monospace; letter-spacing: 3px; }
.save-panel { display: flex; align-items: center; justify-content: space-between; gap: 24px; margin-top: 28px; padding: 26px 28px; border: 1px solid #39323f; border-radius: 16px; background: #17151c; }
.save-panel h2 { margin: 0 0 10px; font-size: 18px; }
.save-panel p { margin: 0; color: #aaa0b8; font-size: 13px; line-height: 1.7; }
.primary-button { flex-shrink: 0; min-height: 50px; padding: 14px 24px; border: 1px solid #c4b5fd; border-radius: 12px; background: #c4b5fd; color: #20152f; font: inherit; font-size: 13px; font-weight: 700; cursor: pointer; transition: background 150ms, transform 150ms; }
.primary-button:hover { background: #d8cdff; transform: translateY(-1px); }
a:focus-visible, button:focus-visible { outline: 3px solid #dfd4ff; outline-offset: 4px; }
.browser-note, footer { color: #9990a6; font-size: 12px; text-align: center; line-height: 1.8; }
.browser-note { margin: 20px 0 0; }
footer { margin-top: 30px; }
.empty-state { margin-top: 40px; padding: 56px 24px; text-align: center; background: #19171f; border: 1px solid #393340; border-radius: 20px; }
.empty-icon { display: block; margin-bottom: 20px; color: #c4b5fd; font-size: 32px; }
.empty-state > p:not(.eyebrow) { color: #b9b3c4; margin: 20px 0 24px; line-height: 1.7; }
@media (max-width: 600px) {
  .tickets-page { padding: 18px 14px 30px; }
  .steps { gap: 16px; }
  .step { gap: 6px; font-size: 10px; }
  .step b { width: 24px; height: 24px; }
  .brand { font-size: 16px; }
  .back-button { padding: 10px 12px; font-size: 12px; }
  .success-heading { align-items: flex-start; gap: 14px; }
  .success-icon { flex-basis: 40px; height: 40px; border-radius: 13px; font-size: 22px; }
  .success-heading h1 { font-size: 29px; }
  .success-heading .eyebrow { font-size: 8px; letter-spacing: 1.5px; }
  .order-summary { grid-template-columns: 1fr 1fr; gap: 20px; padding: 22px; }
  .order-summary > div:first-child { grid-column: 1 / -1; }
  .section-heading span { font-size: 10px; }
  .ticket { grid-template-columns: minmax(0, 1fr); }
  .ticket-main { padding: 22px; }
  .ticket-stub { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding: 20px 22px; border-left: 0; border-top: 2px dashed #5b486e; }
  .seat-number { grid-column: 1; grid-row: 2 / 4; font-size: 38px; }
  .stub-hall, .ticket-price, .ticket-count { grid-column: 2; text-align: right; }
  .stub-hall { grid-row: 1; }
  .save-panel { flex-direction: column; align-items: stretch; padding: 22px; }
}
@media (prefers-reduced-motion: reduce) { .back-button, .primary-button { transition: none; } .primary-button:hover { transform: none; } }
@media print {
  .print-action { display: none !important; }
  .tickets-page { padding: 0; min-height: auto; background: white; color: #111; }
  .success-heading { margin: 0 0 20px; }
  .success-heading div > p:last-child { color: #333; }
  .success-icon { display: none; }
  h1 { font-size: 26px; }
  .order-summary { margin-bottom: 24px; padding: 16px; }
  .ticket, .order-summary, .ticket-stub { background: white; border-color: #777; box-shadow: none; }
  .ticket { grid-template-columns: minmax(0, 1fr) 150px; border-radius: 8px; }
  .ticket-main { padding: 20px; }
  .ticket-stub { display: flex; border-top: 0; border-left: 2px dashed #777; }
  .tickets-page :is(p, span, strong, small, .eyebrow, .category-badge) { color: #222; }
  .ticket h2 { font-size: 23px; }
  .seat-number { font-size: 38px; }
}
</style>

<style>
@media print {
  html, body { background: white !important; color: #111; color-scheme: light; }
}
</style>
