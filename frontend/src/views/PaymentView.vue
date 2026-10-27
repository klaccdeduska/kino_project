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
  <main>
    <h1>Payment</h1>

    <p v-if="error" role="alert">
      {{ error }}
    </p>

    <template v-if="draft">
      <RouterLink
        :to="{
          name: 'booking',
          params: { movieId: draft.movieId },
          query: { sessionId: draft.sessionId },
        }"
      >
        Back to seats
      </RouterLink>

      <h2>{{ draft.movieTitle }}</h2>

      <p>{{ formatSessionDate(draft.date) }} — {{ draft.time }} · {{ draft.hallName }}</p>

      <ul>
        <li v-for="seat in draft.seats" :key="seat">
          Row {{ seat.split('-')[0] }}
          · Seat {{ seat.split('-')[1] }}
          — {{ formatPrice(getSeatPriceCents(seat)) }}
        </li>
      </ul>

      <p>Tickets: {{ draft.seats.length }}</p>

      <p>
        <strong>Total: {{ formatPrice(totalCents) }}</strong>
      </p>

      <p>
        This is a demo payment. No money will be charged
        and no card details are required.
      </p>

      <button
        type="button"
        :disabled="submitting"
        @click="pay"
      >
        {{ submitting ? 'Processing…' : 'Confirm demo payment' }}
      </button>
    </template>

    <template v-else>
      <p>No seats selected. Choose a movie and session to continue.</p>
      <RouterLink to="/">Back to movies</RouterLink>
    </template>
  </main>
</template>
