//это только макет, я потом переделаю еще -лера

<script setup lang="ts">
import { ref } from 'vue'

const rows = ['A', 'B', 'C', 'D', 'E']
const seatsPerRow = 8

// Временно занятые места для проверки интерфейса
const occupiedSeats = ['A-3', 'B-5', 'C-4']
const selectedSeats = ref<string[]>([])

function toggleSeat(seatId: string) {
  if (occupiedSeats.includes(seatId)) return

  if (selectedSeats.value.includes(seatId)) {
    selectedSeats.value = selectedSeats.value.filter(
      (id) => id !== seatId,
    )
  } else {
    selectedSeats.value.push(seatId)
  }
}
</script>

<template>
  <section class="seat-picker">
    <h2>Choice of seats</h2>
    <p>Demo hall — booking is not saved yet.</p>

    <div class="screen">SCREEN</div>

    <div class="seat-map">
      <div v-for="row in rows" :key="row" class="seat-row">
        <span class="row-label">{{ row }}</span>

        <button
          v-for="seat in seatsPerRow"
          :key="seat"
          class="seat"
          :class="{
            selected: selectedSeats.includes(`${row}-${seat}`),
          }"
          :disabled="occupiedSeats.includes(`${row}-${seat}`)"
          :aria-label="`Row ${row}, seat ${seat}`"
          :aria-pressed="selectedSeats.includes(`${row}-${seat}`)"
          @click="toggleSeat(`${row}-${seat}`)"
        >
          {{ seat }}
        </button>
      </div>
    </div>

    <p>Grey — occupied · Green — selected.</p>
    <p>
      Selected seats:
      <strong>{{ selectedSeats.join(', ') || 'none selected yet' }}</strong>
    </p>

    <button
      class="clear-seats"
      :disabled="selectedSeats.length === 0"
      @click="selectedSeats = []"
    >
      Clear selection
    </button>
  </section>
</template>

<style scoped>
.seat-picker {
  margin-top: 32px;
  padding: 24px;
  background: #202126;
  border-radius: 16px;
}

.screen {
  max-width: 440px;
  margin: 28px auto;
  padding: 12px;
  border-top: 3px solid #e8ff75;
  text-align: center;
  letter-spacing: 4px;
}

.seat-map {
  overflow-x: auto;
}

.seat-row {
  display: flex;
  justify-content: center;
  gap: 8px;
  min-width: 380px;
  margin-bottom: 8px;
}

.row-label {
  display: grid;
  place-items: center;
  width: 24px;
}

.seat {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  border: 1px solid #6b6d78;
  border-radius: 8px;
  background: #303139;
  color: white;
  cursor: pointer;
}

.seat.selected {
  background: #e8ff75;
  color: #111215;
}

.seat:disabled {
  background: #555;
  color: #aaa;
  cursor: not-allowed;
}

.clear-seats {
  padding: 10px 16px;
  border: 1px solid #6b6d78;
  border-radius: 8px;
  background: transparent;
  color: white;
  cursor: pointer;
}

.clear-seats:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>