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
  tickets?: Record<string, { category: TicketCategory; priceCents: number }>
}

interface CheckoutDraft extends Booking {
  expiresAt: number
  categories?: Partial<Record<string, TicketCategory>>
}

export const ticketCategories = {
  adult: { label: 'Adult', discountCents: 0 },
  child: { label: 'Child', discountCents: 200 },
  student: { label: 'Student', discountCents: 100 },
  senior: { label: 'Senior', discountCents: 200 },
} as const

type TicketCategory = keyof typeof ticketCategories

const checkoutDurationMs = 10 * 60 * 1000

export const ticketPriceCents = 800
export const vipTicketPriceCents = 1200

export const demoOccupiedSeats = ['A-3', 'B-5', 'C-4']

const storageKey = 'cinema-demo-bookings-v2'

interface State {
  draft: CheckoutDraft | null
  orders: Order[]
}

export function getSeatPriceCents(seatId: string, category: TicketCategory = 'adult'): number {
  const row = seatId.split('-')[0]

  const basePrice = row === 'E' ? vipTicketPriceCents : ticketPriceCents
  return basePrice - ticketCategories[category].discountCents
}

export function calculateTotalCents(seats: string[], categories?: CheckoutDraft['categories']): number {
  return seats.reduce(
    (total, seatId) => total + getSeatPriceCents(seatId, categories?.[seatId]),
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
  const previous = bookingState.value.draft
  const now = Date.now()
  const active = previous?.sessionId === booking.sessionId && previous.expiresAt > now
    ? previous
    : null

  save({
    ...bookingState.value,
    draft: {
      ...booking,
      seats: [...booking.seats],
      expiresAt: active?.expiresAt ?? now + checkoutDurationMs,
      categories: Object.fromEntries(booking.seats.map(seat => [seat, active?.categories?.[seat] ?? 'adult'])),
    },
  })
}

export function setTicketCategory(seat: string, value: string) {
  const draft = bookingState.value.draft
  if (!draft || !draft.seats.includes(seat) || !(draft.expiresAt > Date.now())) return
  if (!Object.prototype.hasOwnProperty.call(ticketCategories, value)) return

  save({
    ...bookingState.value,
    draft: { ...draft, categories: { ...draft.categories, [seat]: value as TicketCategory } },
  })
}

export function purchase(): Order {
  const draft = bookingState.value.draft

  if (!draft || draft.seats.length === 0) {
    throw new Error('Please choose your seats first.')
  }

  const { expiresAt, categories, ...booking } = draft
  if (!(expiresAt > Date.now())) {
    throw new Error('Checkout time expired. Please choose your seats again.')
  }

  const taken = occupiedSeats(draft.sessionId)

  if (draft.seats.some(seat => taken.includes(seat))) {
    throw new Error(
      'Some seats are already purchased. Please choose your seats again.',
    )
  }

  const tickets = Object.fromEntries(draft.seats.map(seat => {
    const category = categories?.[seat] ?? 'adult'
    return [seat, { category, priceCents: getSeatPriceCents(seat, category) }]
  }))
  const order: Order = {
    ...booking,
    seats: [...draft.seats],
    id: crypto.randomUUID(),
    purchasedAt: new Date().toISOString(),
    tickets,
    totalCents: calculateTotalCents(draft.seats, categories),
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
