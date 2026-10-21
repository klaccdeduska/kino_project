<script setup lang="ts">
import { computed, ref } from 'vue'
import { formatPrice, ticketPriceCents } from '../stores/booking'

const props = defineProps<{ occupiedSeats: string[]; initialSeats?: string[] }>()
const emit = defineEmits<{ checkout: [seats: string[]] }>()

const rows = ['A', 'B', 'C', 'D', 'E']
const seatsPerRow = 8
const selectedSeats = ref<string[]>((props.initialSeats || []).filter(id => !props.occupiedSeats.includes(id)))

const totalCents = computed(
  () => selectedSeats.value.length * ticketPriceCents,
)

function isOccupied(seatId: string) {
  return props.occupiedSeats.includes(seatId)
}

function isSelected(seatId: string) {
  return selectedSeats.value.includes(seatId)
}

function toggleSeat(seatId: string) {
  if (isOccupied(seatId)) return

  if (isSelected(seatId)) {
    selectedSeats.value = selectedSeats.value.filter(
      (id) => id !== seatId,
    )
  } else {
    selectedSeats.value.push(seatId)
  }
}

function clearSelection() {
  selectedSeats.value = []
}
</script>

<template>
  <section aria-label="Seat selection">
    <h2>Hall 1</h2>
    <p>Demonstration prices and seat availability.</p>

    <p>SCREEN</p>
    <hr />

    <div v-for="row in rows" :key="row">
      <span>Row {{ row }}: </span>

      <button
        v-for="seat in seatsPerRow"
        :key="seat"
        type="button"
        :disabled="isOccupied(`${row}-${seat}`)"
        :aria-label="`Row ${row}, seat ${seat}`"
        :aria-pressed="isSelected(`${row}-${seat}`)"
        @click="toggleSeat(`${row}-${seat}`)"
      >
        {{ seat }}
        {{ isOccupied(`${row}-${seat}`) ? '×' : '' }}
        {{ isSelected(`${row}-${seat}`) ? '✓' : '' }}
      </button>
    </div>

    <p>× — occupied, ✓ — selected.</p>

    <hr />

    <section aria-label="Selection summary" aria-live="polite">
      <h2>Your selection</h2>

      <p>Seats: {{ selectedSeats.join(', ') || 'None' }}</p>
      <p>Tickets: {{ selectedSeats.length }}</p>
      <p>Price per ticket: {{ formatPrice(ticketPriceCents) }}</p>
      <p>
        <strong>Total: {{ formatPrice(totalCents) }}</strong>
      </p>
    </section>

    <button
      type="button"
      :disabled="selectedSeats.length === 0"
      @click="clearSelection"
    >
      Clear selection
    </button>
    <button type="button" :disabled="selectedSeats.length === 0" @click="emit('checkout', [...selectedSeats])">
      Continue to payment
    </button>
  </section>
</template>
