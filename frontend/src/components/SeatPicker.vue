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

function getGroupCount(row: HallRow) {
  return row.category === 'double'
    ? seatsPerRow / 2
    : seatsPerRow
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
    for (let seat = 1; seat <= getGroupCount(row); seat++) {
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

function isGroupSelected(seatIds: string[]) {
  return seatIds.every(id => selectedSeats.value.includes(id))
}

const selectedGroups = computed(() => {
  const result: string[] = []

  for (const row of rows) {
    for (let seat = 1; seat <= getGroupCount(row); seat++) {
      const group = getSeatGroup(row, seat)

      if (isGroupSelected(group)) {
        result.push(
          `${group.join(' + ')} (${categoryLabels[row.category]})`,
        )
      }
    }
  }

  return result
})

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

  const status = isGroupOccupied(group)
    ? 'занято'
    : isGroupSelected(group)
      ? 'выбрано'
      : 'свободно'

  const placeLabel = row.category === 'double' ? 'места' : 'место'

  return `Ряд ${row.id}, ${placeLabel} ${seatLabel(row, seat)}, ${
    categoryLabels[row.category]
  }, ${price}, ${status}`
}

function clearSelection() {
  selectedSeats.value = []
}
</script>

<template>
  <section class="seat-picker" aria-label="Выбор мест">
    <h2>Зал 1</h2>
    <p>Демонстрационные цены и доступность мест.</p>

    <p class="screen-label">ЭКРАН</p>
    <hr />

    <div class="seats-scroll">
      <div class="seats-grid">
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
              v-for="seat in getGroupCount(row)"
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
              <span class="seat-back" aria-hidden="true">
                <span class="seat-number">
                  {{ seatLabel(row, seat) }}
                </span>

                <span class="seat-status">
                  <template
                    v-if="isGroupOccupied(getSeatGroup(row, seat))"
                  >
                    ×
                  </template>
                  <template
                    v-else-if="isGroupSelected(getSeatGroup(row, seat))"
                  >
                    ✓
                  </template>
                  <template v-else-if="row.category === 'vip'">
                    ★
                  </template>
                </span>
              </span>

              <span class="seat-cushion" aria-hidden="true"></span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="seat-legend" aria-label="Категории и состояния мест">
      <span class="legend-item">
        <span class="legend-dot legend-dot--standard" aria-hidden="true"></span>
        Стандарт · {{ formatPrice(ticketPriceCents) }}
      </span>

      <span class="legend-item">
        <span class="legend-dot legend-dot--double" aria-hidden="true"></span>
        Двойное · {{ formatPrice(ticketPriceCents * 2) }} за двоих
      </span>

      <span class="legend-item">
        <span class="legend-dot legend-dot--vip" aria-hidden="true"></span>
        VIP · {{ formatPrice(ticketPriceCents) }}
      </span>

      <span class="legend-item">
        <span class="legend-dot legend-dot--selected" aria-hidden="true">✓</span>
        Выбрано
      </span>

      <span class="legend-item">
        <span class="legend-dot legend-dot--occupied" aria-hidden="true">×</span>
        Занято
      </span>
    </div>

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

    <div class="selection-actions">
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
    </div>
  </section>
</template>

<style scoped>
.screen-label {
  text-align: center;
  letter-spacing: 0.2em;
}

.seats-scroll {
  overflow-x: auto;
  padding: 12px 6px;
}

.seats-grid {
  width: max-content;
  margin-inline: auto;
}

.seat-row {
  margin-bottom: 20px;
}

.row-label {
  display: block;
  margin-bottom: 10px;
  font-size: 14px;
  font-weight: 600;
}

.row-seats {
  display: flex;
  gap: 10px;
}

.seat {
  --chair-fill: #e2e8f0;
  --chair-edge: #64748b;
  --chair-text: #0f172a;

  position: relative;
  display: block;
  flex: 0 0 48px;
  width: 48px;
  height: 56px;
  padding: 0;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--chair-text);
  cursor: pointer;
  appearance: none;
  transition: transform 150ms ease;
}

/* Подлокотники */
.seat::before,
.seat::after {
  content: '';
  position: absolute;
  z-index: 2;
  top: 22px;
  width: 7px;
  height: 27px;
  border: 2px solid var(--chair-edge);
  border-radius: 5px;
  background: var(--chair-fill);
  box-sizing: border-box;
}

.seat::before {
  left: 0;
}

.seat::after {
  right: 0;
}

/* Спинка */
.seat-back {
  position: absolute;
  inset: 2px 5px auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 38px;
  border: 2px solid var(--chair-edge);
  border-radius: 10px 10px 5px 5px;
  background: var(--chair-fill);
  box-sizing: border-box;
}

/* Сиденье */
.seat-cushion {
  position: absolute;
  z-index: 1;
  right: 5px;
  bottom: 3px;
  left: 5px;
  height: 15px;
  border: 2px solid var(--chair-edge);
  border-radius: 4px 4px 7px 7px;
  background: var(--chair-fill);
  box-shadow: 0 3px 0 var(--chair-edge);
  box-sizing: border-box;
}

.seat-number {
  font-size: 12px;
  font-weight: 700;
  line-height: 1.1;
}

.seat-status {
  min-height: 12px;
  font-size: 11px;
  line-height: 12px;
}

.seat--double {
  --chair-fill: #ede9fe;
  --chair-edge: #7c3aed;
  --chair-text: #4c1d95;

  flex-basis: 106px;
  width: 106px;
}

/* Шов между двумя половинами двойного кресла */
.seat--double .seat-cushion::after {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 50%;
  border-left: 2px solid var(--chair-edge);
}

.seat--vip {
  --chair-fill: #fef3c7;
  --chair-edge: #a16207;
  --chair-text: #713f12;
}

.seat--selected {
  --chair-fill: #15803d;
  --chair-edge: #14532d;
  --chair-text: #ffffff;
}

.seat:disabled {
  --chair-fill: #e5e7eb;
  --chair-edge: #9ca3af;
  --chair-text: #4b5563;

  cursor: not-allowed;
}

.seat:not(:disabled):hover {
  transform: translateY(-3px);
}

.seat:focus-visible {
  outline: 3px solid #2563eb;
  outline-offset: 4px;
}

.seat-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 20px;
  margin-block: 20px;
  font-size: 14px;
}

.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.legend-dot {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border: 1px solid;
  border-radius: 4px;
  font-size: 12px;
  box-sizing: border-box;
}

.legend-dot--standard {
  border-color: #64748b;
  background: #e2e8f0;
}

.legend-dot--double {
  border-color: #7c3aed;
  background: #ede9fe;
}

.legend-dot--vip {
  border-color: #a16207;
  background: #fef3c7;
}

.legend-dot--selected {
  border-color: #14532d;
  background: #15803d;
  color: white;
}

.legend-dot--occupied {
  border-color: #9ca3af;
  background: #e5e7eb;
  color: #4b5563;
}

.selection-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

@media (prefers-reduced-motion: reduce) {
  .seat {
    transition: none;
  }

  .seat:not(:disabled):hover {
    transform: none;
  }
}
</style>