<script setup lang="ts">
import { ref } from 'vue'

const rows = ['A', 'B', 'C', 'D', 'E']
const seatsPerRow = 8

const occupiedSeats = ['A-3', 'B-5', 'C-4']
const selectedSeats = ref<string[]>([])

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

    <p aria-live="polite">
      Selected seats:
      {{ selectedSeats.join(', ') || 'None' }}
    </p>

    <p>Number of tickets: {{ selectedSeats.length }}</p>

    <button
      type="button"
      :disabled="selectedSeats.length === 0"
      @click="clearSelection"
    >
      Clear selection
    </button>
  </section>
</template>