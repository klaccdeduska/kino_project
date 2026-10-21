<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { bookingState, formatPrice, purchase, ticketPriceCents } from '../stores/booking'

const router = useRouter()
const draft = computed(() => bookingState.value.draft)
const submitting = ref(false)
const error = ref('')

async function pay() {
  if (submitting.value) return
  submitting.value = true
  error.value = ''
  try {
    const order = purchase()
    await router.replace({ name: 'tickets', params: { orderId: order.id } })
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Could not complete the purchase.'
    submitting.value = false
  }
}
</script>

<template>
  <main>
    <h1>Payment</h1>
    <p v-if="error" role="alert">{{ error }}</p>
    <template v-if="draft">
      <RouterLink :to="{ name: 'booking', params: { movieId: draft.movieId }, query: { sessionId: draft.sessionId } }">Back to seats</RouterLink>
      <h2>{{ draft.movieTitle }}</h2>
      <p>{{ draft.date }} — {{ draft.time }} · Hall 1</p>
      <p>Seats: {{ draft.seats.join(', ') }}</p>
      <p>{{ draft.seats.length }} tickets × {{ formatPrice(ticketPriceCents) }}</p>
      <p><strong>Total: {{ formatPrice(draft.seats.length * ticketPriceCents) }}</strong></p>
      <p>This is a demo payment. No money will be charged and no card details are required.</p>
      <button type="button" :disabled="submitting" @click="pay">{{ submitting ? 'Processing…' : 'Confirm demo payment' }}</button>
    </template>
    <template v-else>
      <p>No seats selected. Choose a movie and session to continue.</p>
      <RouterLink to="/">Back to movies</RouterLink>
    </template>
  </main>
</template>
