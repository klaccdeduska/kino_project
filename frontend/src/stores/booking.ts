import { ref } from 'vue'

export interface Booking {
  movieId: number
  movieTitle: string
  sessionId: number
  hallId: number
  hallName: string
  date: string
  time: string
  seats: string[]
}

export interface Order extends Booking {
  id: string
  purchasedAt: string
  totalCents: number
}

export const ticketPriceCents = 800
export const vipTicketPriceCents = 1200

export const demoOccupiedSeats = ['A-3', 'B-5', 'C-4']

const storageKey = 'cinema-demo-bookings-v2'

interface State {
  draft: Booking | null
  orders: Order[]
}

export function getSeatPriceCents(seatId: string): number {
  const row = seatId.split('-')[0]

  return row === 'E'
    ? vipTicketPriceCents
    : ticketPriceCents
}

export function calculateTotalCents(seats: string[]): number {
  return seats.reduce(
    (total, seatId) => total + getSeatPriceCents(seatId),
    0,
  )
}

function readState(): State {
  try {
    const value = JSON.parse(
      localStorage.getItem(storageKey) || 'null',
    )

    if (value && Array.isArray(value.orders)) {
      return value
    }
  } catch {
    // Start fresh if browser storage is unavailable.
  }

  return { draft: null, orders: [] }
}

export const bookingState = ref<State>(readState())

function save(state: State) {
  // Persist before updating the UI so a failed write cannot appear as a purchase.
  localStorage.setItem(storageKey, JSON.stringify(state))
  bookingState.value = state
}

export function occupiedSeats(sessionId: number) {
  const purchasedSeats = bookingState.value.orders
    .filter(order => order.sessionId === sessionId)
    .flatMap(order => order.seats)

  return [...demoOccupiedSeats, ...purchasedSeats]
}

export function startCheckout(booking: Booking) {
  save({
    ...bookingState.value,
    draft: {
      ...booking,
      seats: [...booking.seats],
    },
  })
}

export function purchase(): Order {
  const draft = bookingState.value.draft

  if (!draft || draft.seats.length === 0) {
    throw new Error('Please choose your seats first.')
  }

  const taken = occupiedSeats(draft.sessionId)

  if (draft.seats.some(seat => taken.includes(seat))) {
    throw new Error(
      'Some seats are already purchased. Please choose your seats again.',
    )
  }

  const order: Order = {
    ...draft,
    seats: [...draft.seats],
    id: crypto.randomUUID(),
    purchasedAt: new Date().toISOString(),
    totalCents: calculateTotalCents(draft.seats),
  }

  save({
    draft: null,
    orders: [...bookingState.value.orders, order],
  })

  return order
}

export function formatPrice(cents: number) {
  return `${(cents / 100).toFixed(2)} €`
}
