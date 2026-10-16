<script setup lang="ts">
import { computed, ref } from 'vue'

const rows = ['A', 'B', 'C', 'D', 'E']
const seatsPerRow = 8
const ticketPriceCents = 800

const occupiedSeats = ['A-3', 'B-5', 'C-4']
const selectedSeats = ref<string[]>([])

const totalCents = computed(
  () => selectedSeats.value.length * ticketPriceCents,
)

function formatPrice(cents: number) {
  return `${(cents / 100).toFixed(2)} €`
}

function isOccupied(seatId: string) {
  return occupiedSeats.includes(seatId)
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
  </section>
</template>