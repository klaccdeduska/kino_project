import { beforeEach, describe, it, expect } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import App from '../App.vue'
import PaymentView from '../views/PaymentView.vue'
import TicketsView from '../views/TicketsView.vue'
import SeatPicker from '../components/SeatPicker.vue'
import { bookingState, startCheckout, purchase, occupiedSeats } from '../stores/booking'

beforeEach(() => {
  localStorage.clear()
  bookingState.value = { draft: null, orders: [] }
})

describe('Demo booking', () => {
  it('navigates from payment to tickets and restores confirmation after remount', async () => {
    startCheckout({ movieId: 1, movieTitle: 'Test movie', sessionId: 10,
      date: '2026-10-21', time: '18:00', seats: ['A-1', 'A-2'] })
    const router = createRouter({ history: createMemoryHistory(), routes: [
      { path: '/', component: { template: '<p>Movies</p>' } },
      { path: '/payment', component: PaymentView },
      { path: '/booking/:movieId', name: 'booking', component: { template: '<p>Seats</p>' } },
      { path: '/tickets/:orderId', name: 'tickets', component: TicketsView },
    ] })
    await router.push('/payment')
    const wrapper = mount(App, { global: { plugins: [router] } })
    expect(wrapper.text()).toContain('16.00 €')
    await wrapper.get('button').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('Tickets purchased!')
    expect(wrapper.findAll('article')).toHaveLength(2)
    const confirmationPath = router.currentRoute.value.fullPath
    wrapper.unmount()
    await router.push(confirmationPath)
    const reopened = mount(App, { global: { plugins: [router] } })
    expect(reopened.findAll('article')).toHaveLength(2)
    reopened.unmount()
    await router.push('/payment')
    const emptyPayment = mount(App, { global: { plugins: [router] } })
    expect(emptyPayment.text()).toContain('No seats selected')
    emptyPayment.unmount()
  })

  it('requires seats and emits the selection', async () => {
    const wrapper = mount(SeatPicker, { props: { occupiedSeats: ['A-3'] } })
    const checkout = wrapper.findAll('button').find(button => button.text() === 'Continue to payment')!
    expect(checkout.attributes('disabled')).toBeDefined()
    await wrapper.get('[aria-label="Row A, seat 1"]').trigger('click')
    await checkout.trigger('click')
    expect(wrapper.emitted('checkout')).toEqual([[['A-1']]])
    expect(wrapper.get('[aria-label="Row A, seat 3"]').attributes('disabled')).toBeDefined()
  })

  it('persists a purchase, clears checkout and reserves seats for its session', () => {
    startCheckout({ movieId: 1, movieTitle: 'Test movie', sessionId: 10,
      date: '2026-10-21', time: '18:00', seats: ['A-1', 'A-2'] })
    const order = purchase()
    expect(order.totalCents).toBe(1600)
    expect(order.seats).toEqual(['A-1', 'A-2'])
    expect(bookingState.value.draft).toBeNull()
    expect(occupiedSeats(10)).toContain('A-1')
    expect(occupiedSeats(11)).not.toContain('A-1')
    expect(JSON.parse(localStorage.getItem('cinema-demo-bookings-v1')!).orders[0].id).toBe(order.id)
    expect(() => purchase()).toThrow()
    startCheckout(order)
    expect(() => purchase()).toThrow('already purchased')
    expect(bookingState.value.orders).toHaveLength(1)
  })
})
