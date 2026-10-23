<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  calculateTotalCents,
  formatPrice,
  ticketPriceCents,
  vipTicketPriceCents,
} from '../stores/booking'

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
  { id: 'E', category: 'vip' },
  { id: 'D', category: 'double' },
  { id: 'C', category: 'standard' },
  { id: 'B', category: 'standard' },
  { id: 'A', category: 'standard' },
]

const seatsPerRow = 8

const categoryLabels: Record<SeatCategory, string> = {
  standard: 'Standard',
  double: 'Double',
  vip: 'VIP',
}

const seatCategories = [
  {
    id: 'standard',
    title: 'Standard',
    priceCents: ticketPriceCents,
    priceNote: 'per person',
    description: 'A standard seat for one guest.',
  },
  {
    id: 'double',
    title: 'Double',
    priceCents: ticketPriceCents * 2,
    priceNote: 'for two',
    description: 'A two-person sofa. Both seats are selected together.',
  },
  {
    id: 'vip',
    title: 'VIP',
    priceCents: vipTicketPriceCents,
    priceNote: 'per person',
    description: 'A reclining seat with a massage function.',
  },
]

function getGroupCount(row: HallRow) {
  if (row.category === 'double') {
    return seatsPerRow / 2
  }

  return seatsPerRow
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
  const initialSeats = props.initialSeats ?? []
  const result: string[] = []

  for (const row of rows) {
    for (let seat = 1; seat <= getGroupCount(row); seat++) {
      const group = getSeatGroup(row, seat)

      const wasSelected = group.some(
        id => initialSeats.includes(id),
      )

      if (wasSelected && !isGroupOccupied(group)) {
        result.push(...group)
      }
    }
  }

  return result
}

const selectedSeats = ref<string[]>(normalizeInitialSeats())

const totalCents = computed(() => {
  return calculateTotalCents(selectedSeats.value)
})

function isGroupSelected(seatIds: string[]) {
  return seatIds.every(id => selectedSeats.value.includes(id))
}

const selectedGroups = computed(() => {
  const result: string[] = []

  for (const row of rows) {
    for (let seat = 1; seat <= getGroupCount(row); seat++) {
      const group = getSeatGroup(row, seat)

      if (isGroupSelected(group)) {
        const category = categoryLabels[row.category]
        const price = formatPrice(calculateTotalCents(group))

        result.push(`${group.join(' + ')} (${category}) — ${price}`)
      }
    }
  }

  return result
})

function toggleGroup(seatIds: string[]) {
  if (isGroupOccupied(seatIds)) {
    return
  }

  if (isGroupSelected(seatIds)) {
    selectedSeats.value = selectedSeats.value.filter(
      id => !seatIds.includes(id),
    )
  } else {
    for (const id of seatIds) {
      if (!selectedSeats.value.includes(id)) {
        selectedSeats.value.push(id)
      }
    }
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
  const price = formatPrice(calculateTotalCents(group))
  const category = categoryLabels[row.category]

  let status = 'available'

  if (isGroupOccupied(group)) {
    status = 'occupied'
  } else if (isGroupSelected(group)) {
    status = 'selected'
  }

  const placeLabel = row.category === 'double' ? 'seats' : 'seat'

  return `Row ${row.id}, ${placeLabel} ${seatLabel(row, seat)}, ${category}, ${price}, ${status}`
}

function clearSelection() {
  selectedSeats.value = []
}
</script>

<template>
  <section class="seat-picker" aria-label="Seat selection">
    <h2>Hall 1</h2>
    <p>Demonstration prices and seat availability.</p>

    <div class="hall-scroll">
      <div class="hall">
        <div class="seats-grid">
          <div
            v-for="row in rows"
            :key="row.id"
            class="seat-row"
            role="group"
            :aria-label="`Row ${row.id}, ${categoryLabels[row.category]}`"
          >
            <span class="row-label" aria-hidden="true">
              {{ row.id }}
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

            <span class="row-label" aria-hidden="true">
              {{ row.id }}
            </span>
          </div>
        </div>

        <div class="screen" aria-label="Screen">
          <div class="screen-curve" aria-hidden="true"></div>
          <span class="screen-label">SCREEN</span>
        </div>
      </div>
    </div>

    <section class="seat-categories" aria-label="Seat categories">
      <article
        v-for="category in seatCategories"
        :key="category.id"
        class="category-card"
      >
        <div class="category-heading">
          <span
            class="legend-dot"
            :class="`legend-dot--${category.id}`"
            aria-hidden="true"
          ></span>

          <h3>{{ category.title }}</h3>
        </div>

        <p class="category-price">
          {{ formatPrice(category.priceCents) }}
          <span>{{ category.priceNote }}</span>
        </p>

        <p class="category-description">
          {{ category.description }}
        </p>
      </article>
    </section>

    <div class="seat-legend" aria-label="Seat status">
      <span class="legend-item">
        <span
          class="legend-dot legend-dot--selected"
          aria-hidden="true"
        >✓</span>
        Selected
      </span>

      <span class="legend-item">
        <span
          class="legend-dot legend-dot--occupied"
          aria-hidden="true"
        >×</span>
        Occupied
      </span>
    </div>

    <hr />

    <section aria-label="Selected seats" aria-live="polite">
      <h2>Your selection</h2>

      <ul v-if="selectedGroups.length">
        <li v-for="group in selectedGroups" :key="group">
          {{ group }}
        </li>
      </ul>

      <p v-else>No seats selected.</p>

      <p>Tickets: {{ selectedSeats.length }}</p>

      <p>
        <strong>Total: {{ formatPrice(totalCents) }}</strong>
      </p>
    </section>

    <div class="selection-actions">
      <button
        type="button"
        :disabled="selectedSeats.length === 0"
        @click="clearSelection"
      >
        Clear selection
      </button>

      <button
        type="button"
        :disabled="selectedSeats.length === 0"
        @click="emit('checkout', [...selectedSeats])"
      >
        Continue to payment
      </button>
    </div>
  </section>
</template>

<style scoped>
.hall-scroll {
  overflow-x: auto;
  padding: 20px 8px;
}

.hall {
  width: max-content;
  margin-inline: auto;
}

/* Screen */
.screen {
  margin: 40px 32px 0;
  text-align: center;
}

.screen-curve {
  height: 30px;
  border-bottom: 4px solid #7dd3fc;
  border-radius: 0 0 50% 50%;
}

.screen-label {
  display: block;
  margin-top: 12px;
  color: #64748b;
  font-size: 12px;
  letter-spacing: 4px;
}

/* Rows */
.seats-grid {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.seat-row {
  display: grid;
  grid-template-columns: 24px auto 24px;
  align-items: center;
  column-gap: 16px;
}

.row-label {
  color: #64748b;
  font-size: 13px;
  font-weight: 700;
  text-align: center;
  user-select: none;
}

.row-seats {
  display: flex;
  gap: 10px;
}

/* Chairs */
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
  --chair-fill: #7cffaa;
  --chair-edge: #14532d;
  --chair-text: #000000;
}

.seat:disabled {
  --chair-fill: #fee2e2;
  --chair-edge: #dc2626;
  --chair-text: #991b1b;

  cursor: not-allowed;
}

.seat:not(:disabled):hover {
  transform: translateY(-3px);
}

.seat:focus-visible {
  outline: 3px solid #2563eb;
  outline-offset: 4px;
}

/* Category descriptions */
.seat-categories {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 200px), 1fr));
  gap: 12px;
  margin-top: 24px;
}

.category-card {
  padding: 16px;
  border: 1px solid #cbd5e1;
  border-radius: 12px;
}

.category-heading {
  display: flex;
  align-items: center;
  gap: 8px;
}

.category-heading h3 {
  margin: 0;
  font-size: 16px;
}

.category-price {
  margin: 12px 0 8px;
  font-size: 18px;
  font-weight: 700;
}

.category-price span {
  font-size: 12px;
  font-weight: 400;
}

.category-description {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
}

/* Seat status */
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
  flex-shrink: 0;
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