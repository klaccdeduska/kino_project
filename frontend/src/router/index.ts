import { createRouter, createWebHistory } from 'vue-router'
import MoviesView from '../views/MoviesView.vue'
import BookingView from '../views/BookingView.vue'
import PaymentView from '../views/PaymentView.vue'
import TicketsView from '../views/TicketsView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/payment', name: 'payment', component: PaymentView },
    { path: '/tickets/:orderId', name: 'tickets', component: TicketsView },
    {
      path: '/',
      name: 'movies',
      component: MoviesView,
    },
    {
      path: '/booking/:movieId',
      name: 'booking',
      component: BookingView,
    },
  ],
})

export default router
