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
  <main>
    <template v-if="order">
      <h1>Tickets purchased!</h1>

      <p>Your demo payment was successful. No money was charged.</p>
      <p>Order: {{ order.id }}</p>
      <p>Total paid (demo): {{ formatPrice(order.totalCents) }}</p>

      <article
        v-for="(seat, index) in order.seats"
        :key="seat"
        class="ticket"
      >
        <h2>{{ order.movieTitle }}</h2>

        <p>{{ formatSessionDate(order.date) }} — {{ order.time }}</p>

        <p>
          {{ order.hallName }}
          · Row {{ seat.split('-')[0] }}
          · Seat {{ seat.split('-')[1] }}
        </p>

        <p>Price: {{ formatPrice(getSeatPriceCents(seat)) }}</p>
        <p>Ticket: {{ order.id }}-{{ index + 1 }}</p>

        <small>Demo ticket · Not valid for cinema admission</small>
      </article>

      <button
        class="print-action"
        type="button"
        @click="printTickets"
      >
        Print / save tickets as PDF
      </button>
    </template>

    <template v-else>
      <h1>Order not found</h1>

      <p>
        Demo tickets are available only in the browser
        where you purchased them.
      </p>
    </template>

    <p class="print-action">
      <RouterLink to="/">Back to movies</RouterLink>
    </p>
  </main>
</template>

<style scoped>
.ticket {
  max-width: 40rem;
  margin: 1rem 0;
  padding: 1rem;
  border: 1px dashed #777;
  border-radius: 8px;
  overflow-wrap: anywhere;
  break-inside: avoid;
}

@media print {
  .print-action {
    display: none;
  }
}
</style>
