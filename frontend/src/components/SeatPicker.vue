<script setup lang="ts">
import { computed, ref } from 'vue'
import { formatPrice, ticketPriceCents } from '../stores/booking'

type SeatCategory = 'standard' | 'double' | 'vip'

interface HallRow {
  id: string
  category: SeatCategory
}

const props = defineProps<{
  occupiedSeats: string[]
  initialSeats?: string[]
}>()

const emit = defineEmits<{
  checkout: [seats: string[]]
}>()

const rows: HallRow[] = [
  { id: 'A', category: 'standard' },
  { id: 'B', category: 'standard' },
  { id: 'C', category: 'standard' },
  { id: 'D', category: 'double' },
  { id: 'E', category: 'vip' },
]

const seatsPerRow = 8

const categoryLabels: Record<SeatCategory, string> = {
  standard: 'Стандарт',
  double: 'Двойные',
  vip: 'VIP',
}

function getSeatGroup(row: HallRow, seat: number): string[] {
  if (row.category === 'double') {
    return [
      `${row.id}-${seat * 2 - 1}`,
      `${row.id}-${seat * 2}`,
    ]
  }

  return [`${row.id}-${seat}`]
}

function isGroupOccupied(seatIds: string[]) {
  return seatIds.some(id => props.occupiedSeats.includes(id))
}

function normalizeInitialSeats(): string[] {
  const initialSeats = new Set(props.initialSeats ?? [])
  const result: string[] = []

  for (const row of rows) {
    const groupCount =
      row.category === 'double' ? seatsPerRow / 2 : seatsPerRow

    for (let seat = 1; seat <= groupCount; seat++) {
      const group = getSeatGroup(row, seat)

      if (
        group.some(id => initialSeats.has(id)) &&
        !isGroupOccupied(group)
      ) {
        result.push(...group)
      }
    }
  }

  return result
}

const selectedSeats = ref<string[]>(normalizeInitialSeats())

const totalCents = computed(
  () => selectedSeats.value.length * ticketPriceCents,
)

const selectedGroups = computed(() => {
  const result: string[] = []

  for (const row of rows) {
    const groupCount =
      row.category === 'double' ? seatsPerRow / 2 : seatsPerRow

    for (let seat = 1; seat <= groupCount; seat++) {
      const group = getSeatGroup(row, seat)

      if (isGroupSelected(group)) {
        const label = group.join(' + ')
        result.push(`${label} (${categoryLabels[row.category]})`)
      }
    }
  }

  return result
})

function isGroupSelected(seatIds: string[]) {
  return seatIds.every(id => selectedSeats.value.includes(id))
}

function toggleGroup(seatIds: string[]) {
  if (isGroupOccupied(seatIds)) return

  if (isGroupSelected(seatIds)) {
    selectedSeats.value = selectedSeats.value.filter(
      id => !seatIds.includes(id),
    )
  } else {
    selectedSeats.value = [
      ...new Set([...selectedSeats.value, ...seatIds]),
    ]
  }
}

function seatLabel(row: HallRow, seat: number) {
  if (row.category === 'double') {
    return `${seat * 2 - 1}–${seat * 2}`
  }

  return String(seat)
}

function seatDescription(row: HallRow, seat: number) {
  const group = getSeatGroup(row, seat)
  const price = formatPrice(group.length * ticketPriceCents)

  return `Ряд ${row.id}, места ${seatLabel(row, seat)}, ${
    categoryLabels[row.category]
  }, ${price}`
}

function clearSelection() {
  selectedSeats.value = []
}
</script>

<template>
  <section aria-label="Выбор мест">
    <h2>Зал 1</h2>
    <p>Демонстрационные цены и доступность мест.</p>

    <p>ЭКРАН</p>
    <hr />

    <div
      v-for="row in rows"
      :key="row.id"
      class="seat-row"
    >
      <span class="row-label">
        Ряд {{ row.id }} · {{ categoryLabels[row.category] }}
      </span>

      <div class="row-seats">
        <button
          v-for="seat in (
            row.category === 'double'
              ? seatsPerRow / 2
              : seatsPerRow
          )"
          :key="seat"
          type="button"
          class="seat"
          :class="[
            `seat--${row.category}`,
            {
              'seat--selected': isGroupSelected(
                getSeatGroup(row, seat),
              ),
            },
          ]"
          :disabled="isGroupOccupied(getSeatGroup(row, seat))"
          :aria-label="seatDescription(row, seat)"
          :aria-pressed="isGroupSelected(getSeatGroup(row, seat))"
          :title="seatDescription(row, seat)"
          @click="toggleGroup(getSeatGroup(row, seat))"
        >
          {{ seatLabel(row, seat) }}

          <span
            v-if="isGroupOccupied(getSeatGroup(row, seat))"
            aria-hidden="true"
          >
            ×
          </span>

          <span
            v-else-if="isGroupSelected(getSeatGroup(row, seat))"
            aria-hidden="true"
          >
            ✓
          </span>
        </button>
      </div>
    </div>

    <div class="seat-legend">
      <span>Стандарт · {{ formatPrice(ticketPriceCents) }}</span>
      <span>
        Двойное · {{ formatPrice(ticketPriceCents * 2) }} за двоих
      </span>
      <span>VIP · {{ formatPrice(ticketPriceCents) }}</span>
    </div>

    <p>× — занято, ✓ — выбрано.</p>

    <hr />

    <section
      aria-label="Выбранные места"
      aria-live="polite"
    >
      <h2>Ваш выбор</h2>

      <ul v-if="selectedGroups.length">
        <li
          v-for="group in selectedGroups"
          :key="group"
        >
          {{ group }}
        </li>
      </ul>

      <p v-else>Места пока не выбраны.</p>

      <p>Билетов: {{ selectedSeats.length }}</p>
      <p>
        <strong>Итого: {{ formatPrice(totalCents) }}</strong>
      </p>
    </section>

    <button
      type="button"
      :disabled="selectedSeats.length === 0"
      @click="clearSelection"
    >
      Очистить выбор
    </button>

    <button
      type="button"
      :disabled="selectedSeats.length === 0"
      @click="emit('checkout', [...selectedSeats])"
    >
      Перейти к оплате
    </button>
  </section>
</template>

<style scoped>
.seat-row {
  margin-bottom: 16px;
}

.row-label {
  display: block;
  margin-bottom: 6px;
  font-weight: 600;
}

.row-seats {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.seat {
  min-width: 44px;
  min-height: 40px;
  padding: 8px;
  border: 2px solid #64748b;
  border-radius: 6px;
  background: #f1f5f9;
  color: #0f172a;
  cursor: pointer;
}

.seat--double {
  min-width: 96px;
  border-color: #7c3aed;
  background: #ede9fe;
}

.seat--vip {
  border-color: #a16207;
  background: #fef3c7;
}

.seat--selected {
  border-color: #15803d;
  background: #15803d;
  color: white;
}

.seat:disabled {
  border-color: #cbd5e1;
  background: #e2e8f0;
  color: #64748b;
  cursor: not-allowed;
}

.seat:focus-visible {
  outline: 3px solid #2563eb;
  outline-offset: 3px;
}

.seat-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 20px;
}
</style>