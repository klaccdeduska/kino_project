import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import App from '../App.vue'
import PaymentView from '../views/PaymentView.vue'
import BookingView from '../views/BookingView.vue'
import TicketsView from '../views/TicketsView.vue'
import SeatPicker from '../components/SeatPicker.vue'
import {
  bookingState,
  startCheckout,
  purchase,
  occupiedSeats,
} from '../booking/state'

afterEach(() => vi.unstubAllGlobals())

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string) =>
      Promise.resolve(
        url === '/api/auth/me'
          ? { ok: false }
          : { ok: true, json: async () => ({}) },
      ),
    ),
  )
  localStorage.clear()
  bookingState.value = { draft: null, orders: [] }
})

describe('Demo booking', () => {
  it('navigates from payment to tickets and restores confirmation after remount', async () => {
    startCheckout({
      movieId: 1,
      movieTitle: 'Test movie',
      sessionId: 10,
      hallId: 2,
      hallName: 'Hall 2',
      date: '2026-10-21',
      time: '18:00',
      seats: ['A-1', 'A-2'],
    })
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: { template: '<p>Movies</p>' } },
        { path: '/payment', component: PaymentView },
        {
          path: '/booking/:movieId',
          name: 'booking',
          component: { template: '<p>Seats</p>' },
        },
        { path: '/tickets/:orderId', name: 'tickets', component: TicketsView },
      ],
    })
    await router.push('/payment')
    const wrapper = mount(App, { global: { plugins: [router] } })
    expect(wrapper.text()).toContain('16.00 €')
    expect(wrapper.text()).toContain('21.10.2026 — 18:00 · Hall 2')
    await wrapper
      .get('[aria-label="Ticket category for seat A-1"]')
      .setValue('child')
    await wrapper
      .get('[aria-label="Ticket category for seat A-2"]')
      .setValue('student')
    expect(wrapper.get('.total').text()).toContain('13.00 €')
    await wrapper.get('button').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('Tickets purchased!')
    expect(wrapper.findAll('article')).toHaveLength(2)
    expect(wrapper.findAll('article')[0]?.text()).toContain('Child · 6.00 €')
    expect(wrapper.findAll('article')[1]?.text()).toContain('Student · 7.00 €')
    expect(bookingState.value.orders[0]?.totalCents).toBe(1300)
    const qrImages = wrapper
      .findAll('article img')
      .map((img) => img.attributes('src'))
    expect(qrImages).toHaveLength(2)
    expect(new Set(qrImages).size).toBe(2)
    for (const ticket of wrapper.findAll('article')) {
      expect(ticket.text()).toContain('Hall 2')
      expect(ticket.text()).toContain('21.10.2026 — 18:00')
    }
    const confirmationPath = router.currentRoute.value.fullPath
    wrapper.unmount()
    await router.push(confirmationPath)
    const reopened = mount(App, { global: { plugins: [router] } })
    expect(reopened.findAll('article')).toHaveLength(2)
    expect(
      reopened.findAll('article img').map((img) => img.attributes('src')),
    ).toEqual(qrImages)
    expect(reopened.get('article').text()).toContain('Hall 2')
    expect(reopened.get('article').text()).toContain('Child · 6.00 €')
    reopened.unmount()
    await router.push('/payment')
    const emptyPayment = mount(App, { global: { plugins: [router] } })
    expect(emptyPayment.text()).toContain('No seats selected')
    emptyPayment.unmount()
  })

  it('refuses payment when the session has started', async () => {
    startCheckout({
      movieId: 1,
      movieTitle: 'Test movie',
      sessionId: 10,
      hallId: 2,
      hallName: 'Hall 2',
      date: '2026-10-21',
      time: '18:00',
      seats: ['A-1'],
    })
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 404 }),
    )
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/payment', component: PaymentView },
        {
          path: '/booking/:movieId',
          name: 'booking',
          component: { template: '<p>Seats</p>' },
        },
      ],
    })
    await router.push('/payment')
    const wrapper = mount(PaymentView, { global: { plugins: [router] } })
    await wrapper.get('button').trigger('click')
    await flushPromises()
    expect(wrapper.get('[role="alert"]').text()).toContain(
      'Session is no longer available',
    )
    expect(bookingState.value.orders).toHaveLength(0)
    expect(bookingState.value.draft).not.toBeNull()
    wrapper.unmount()
  })

  it('keeps the checkout deadline when editing seats and blocks expired purchases', async () => {
    const booking = {
      movieId: 1,
      movieTitle: 'Test movie',
      sessionId: 10,
      hallId: 2,
      hallName: 'Hall 2',
      date: '2026-10-21',
      time: '18:00',
      seats: ['A-1'],
    }
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/payment', component: PaymentView },
        {
          path: '/booking/:movieId',
          name: 'booking',
          component: { template: '<p>Seats</p>' },
        },
      ],
    })
    await router.push('/payment')
    vi.useFakeTimers()
    const start = Date.now()
    startCheckout(booking)
    vi.setSystemTime(start + 9 * 60_000)
    startCheckout({ ...booking, seats: ['A-2'] })
    const wrapper = mount(PaymentView, { global: { plugins: [router] } })
    try {
      expect(wrapper.get('[role="timer"]').text()).toContain('1:00')
      await vi.advanceTimersByTimeAsync(60_000)
      expect(wrapper.get('[role="alert"]').text()).toContain(
        'Checkout time expired',
      )
      expect(wrapper.get('button').attributes('disabled')).toBeDefined()
      expect(() => purchase()).toThrow('Checkout time expired')
      expect(bookingState.value.orders).toHaveLength(0)
    } finally {
      wrapper.unmount()
      vi.useRealTimers()
    }
  })

  it('starts the timer on seat selection and carries the remaining time to payment', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (url === '/api/auth/me') return { ok: false }
        return {
          ok: true,
          json: async () =>
            url === '/api/movies/1'
              ? { title: 'Test movie', duration: 100 }
              : {
                  id: 10,
                  movieId: 1,
                  hallId: 2,
                  hallName: 'Hall 2',
                  date: '2026-11-20',
                  time: '18:00',
                  format: '2D',
                  language: 'English',
                  subtitles: null,
                },
        }
      }),
    )
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: { template: '<p>Movies</p>' } },
        { path: '/booking/:movieId', name: 'booking', component: BookingView },
        { path: '/payment', name: 'payment', component: PaymentView },
      ],
    })
    await router.push('/booking/1?sessionId=10')
    vi.useFakeTimers()
    const wrapper = mount(App, { global: { plugins: [router] } })
    try {
      await flushPromises()
      expect(wrapper.get('[role="timer"]').text()).toContain('10:00')
      await vi.advanceTimersByTimeAsync(60_000)
      await wrapper.get('[aria-label^="Row A, seat 1,"]').trigger('click')
      const checkout = wrapper
        .findAll('button')
        .find((button) => button.text() === 'Continue to payment')!
      await checkout.trigger('click')
      await flushPromises()
      expect(router.currentRoute.value.name).toBe('payment')
      expect(wrapper.get('[role="timer"]').text()).toContain('9:00')
    } finally {
      wrapper.unmount()
      vi.useRealTimers()
    }
  })

  it('requires seats and emits the selection', async () => {
    const wrapper = mount(SeatPicker, {
      props: { hallName: 'Hall 2', occupiedSeats: ['A-3'] },
    })
    expect(wrapper.get('h2').text()).toBe('Hall 2')
    const checkout = wrapper
      .findAll('button')
      .find((button) => button.text() === 'Continue to payment')!
    expect(checkout.attributes('disabled')).toBeDefined()
    await wrapper.get('[aria-label^="Row A, seat 1,"]').trigger('click')
    await checkout.trigger('click')
    expect(wrapper.emitted('checkout')).toEqual([[['A-1']]])
    expect(
      wrapper.get('[aria-label^="Row A, seat 3,"]').attributes('disabled'),
    ).toBeDefined()
  })

  it('persists a purchase, clears checkout and reserves seats for its session', () => {
    startCheckout({
      movieId: 1,
      movieTitle: 'Test movie',
      sessionId: 10,
      hallId: 2,
      hallName: 'Hall 2',
      date: '2026-10-21',
      time: '18:00',
      seats: ['A-1', 'A-2'],
    })
    const order = purchase()
    expect(order.totalCents).toBe(1600)
    expect(order.seats).toEqual(['A-1', 'A-2'])
    expect(bookingState.value.draft).toBeNull()
    expect(occupiedSeats(10)).toContain('A-1')
    expect(occupiedSeats(11)).not.toContain('A-1')
    const savedOrder = JSON.parse(
      localStorage.getItem('cinema-demo-bookings-v2')!,
    ).orders[0]
    expect(savedOrder.id).toBe(order.id)
    expect(savedOrder.hallId).toBe(2)
    expect(savedOrder.hallName).toBe('Hall 2')
    expect(() => purchase()).toThrow()
    startCheckout(order)
    expect(() => purchase()).toThrow('already purchased')
    expect(bookingState.value.orders).toHaveLength(1)
  })
})
