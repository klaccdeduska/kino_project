<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { bookingState, formatPrice } from '../stores/booking'
import { formatSessionDate } from '../utils/session'

const orders = computed(() =>
  [...bookingState.value.orders].sort((left, right) =>
    `${right.date}T${right.time}`.localeCompare(`${left.date}T${left.time}`),
  ),
)

const upcoming = computed(() =>
  orders.value.filter(
    (order) =>
      new Date(`${order.date}T${order.time}:00`).getTime() >= Date.now(),
  ),
)

const past = computed(() =>
  orders.value.filter(
    (order) =>
      new Date(`${order.date}T${order.time}:00`).getTime() < Date.now(),
  ),
)
</script>

<template>
  <main class="my-tickets-page">
    <div class="shell">
      <header class="topbar">
        <RouterLink to="/" class="brand">
          BUBLIKI<span>CINEMA</span>
        </RouterLink>

        <RouterLink to="/" class="back-button">
          ← Movies
        </RouterLink>
      </header>

      <div class="page-heading">
        <p class="eyebrow">YOUR ACCOUNT</p>
        <h1>Minu piletileht</h1>
        <p>All of your purchased tickets in one place.</p>
      </div>

      <section v-if="orders.length === 0" class="empty-state">
        <span aria-hidden="true">🎟</span>
        <h2>No tickets yet</h2>
        <p>Choose a movie and session to get your first ticket.</p>
        <RouterLink to="/" class="primary-button">
          Browse movies
        </RouterLink>
      </section>

      <template v-else>
        <section class="ticket-section" aria-labelledby="upcoming-title">
          <div class="section-heading">
            <h2 id="upcoming-title">Upcoming</h2>
            <span>{{ upcoming.length }} orders</span>
          </div>

          <p v-if="upcoming.length === 0" class="none">
            No upcoming tickets.
          </p>

          <div v-else class="orders-grid">
            <article
              v-for="order in upcoming"
              :key="order.id"
              class="order-card"
            >
              <div class="order-top">
                <span class="status">Upcoming</span>
                <strong>{{ formatPrice(order.totalCents) }}</strong>
              </div>

              <h3>{{ order.movieTitle }}</h3>
              <p>{{ formatSessionDate(order.date) }} · {{ order.time }}</p>
              <p>{{ order.hallName }} · {{ order.seats.join(', ') }}</p>

              <RouterLink
                class="ticket-link"
                :to="{ name: 'tickets', params: { orderId: order.id } }"
              >
                View tickets →
              </RouterLink>
            </article>
          </div>
        </section>

        <section class="ticket-section" aria-labelledby="past-title">
          <div class="section-heading">
            <h2 id="past-title">Past visits</h2>
            <span>{{ past.length }} orders</span>
          </div>

          <p v-if="past.length === 0" class="none">
            No past tickets.
          </p>

          <div v-else class="orders-grid">
            <article
              v-for="order in past"
              :key="order.id"
              class="order-card past"
            >
              <div class="order-top">
                <span class="status">Visited</span>
                <strong>{{ formatPrice(order.totalCents) }}</strong>
              </div>

              <h3>{{ order.movieTitle }}</h3>
              <p>{{ formatSessionDate(order.date) }} · {{ order.time }}</p>
              <p>{{ order.hallName }} · {{ order.seats.join(', ') }}</p>

              <RouterLink
                class="ticket-link"
                :to="{ name: 'tickets', params: { orderId: order.id } }"
              >
                View tickets →
              </RouterLink>
            </article>
          </div>
        </section>
      </template>
    </div>
  </main>
</template>

<style scoped>
.my-tickets-page {
  min-height: 100vh;
  padding: 28px 24px 40px;
  background: radial-gradient(
    ellipse at 80% 0%,
    #39275540,
    transparent 55%
  ), #0d0d0f;
  color: #f2f2f3;
}

.shell {
  max-width: 1100px;
  margin: auto;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 28px;
  border-bottom: 1px solid #ffffff12;
}

.brand {
  color: #fff;
  text-decoration: none;
  font-size: 20px;
  font-weight: 900;
  letter-spacing: 2px;
}

.brand span {
  display: block;
  margin-top: 5px;
  font-size: 9px;
  letter-spacing: 6px;
  color: #b6a0ff;
}

.back-button {
  display: inline-flex;
  align-items: center;
  padding: 12px 18px;
  border: 1px solid #3c3a46;
  border-radius: 12px;
  background: #ffffff05;
  color: #e4dfef;
  text-decoration: none;
  font-size: 13px;
}

.page-heading {
  margin: 38px 0 30px;
}

.eyebrow {
  margin: 0 0 10px;
  color: #b6a0ff;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 2px;
}

h1 {
  margin: 0;
  font-size: clamp(32px, 5vw, 48px);
}

.page-heading > p:last-child {
  color: #aaa6b4;
}

.empty-state,
.order-card {
  border: 1px solid #3a3348;
  border-radius: 20px;
  background: #17161c;
}

.empty-state {
  padding: 56px 24px;
  text-align: center;
}

.empty-state > span {
  font-size: 38px;
}

.empty-state h2 {
  margin: 16px 0 8px;
}

.empty-state p {
  color: #aaa6b4;
}

.primary-button {
  display: inline-block;
  margin-top: 12px;
  padding: 12px 18px;
  border-radius: 10px;
  background: #c4b5fd;
  color: #20152f;
  text-decoration: none;
  font-weight: 700;
}

.ticket-section {
  margin-top: 34px;
}

.section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.section-heading h2 {
  margin: 0;
  font-size: 20px;
}

.section-heading span,
.none {
  color: #aaa6b4;
  font-size: 12px;
}

.orders-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.order-card {
  padding: 22px;
}

.order-card.past {
  opacity: 0.78;
}

.order-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.status {
  padding: 6px 10px;
  border: 1px solid #645078;
  border-radius: 999px;
  color: #d8c8ff;
  font-size: 11px;
}

.order-card h3 {
  margin: 18px 0 10px;
  font-size: 21px;
}

.order-card p {
  color: #bbb2c9;
  font-size: 13px;
  line-height: 1.7;
}

.ticket-link {
  display: inline-block;
  margin-top: 8px;
  color: #d1bfff;
  font-size: 13px;
  text-underline-offset: 4px;
}

@media (max-width: 700px) {
  .my-tickets-page {
    padding: 18px 14px 30px;
  }

  .orders-grid {
    grid-template-columns: 1fr;
  }
}
</style>