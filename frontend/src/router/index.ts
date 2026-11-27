import { createRouter, createWebHistory } from 'vue-router'
import MoviesView from '../views/MoviesView.vue'
import BookingView from '../views/BookingView.vue'
import PaymentView from '../views/PaymentView.vue'
import TicketsView from '../views/TicketsView.vue'
import AuthView from '../views/AuthView.vue'
import MyTicketsView from '../views/MyTicketsView.vue'
import AccountView from '../views/AccountView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) return savedPosition
    return to.hash ? { el: to.hash } : { top: 0 }
  },
  routes: [
    { path: '/login', name: 'login', component: AuthView },
    { path: '/register', name: 'register', component: AuthView },
    { path: '/payment', name: 'payment', component: PaymentView },
    { path: '/tickets/:orderId', name: 'tickets', component: TicketsView },
    {
      path: '/',
      name: 'movies',
      component: MoviesView,
    },
    {
      path: '/movies/:movieId',
      name: 'movie',
      component: () => import('../views/MovieView.vue'),
      props: true,
    },
    {
      path: '/booking/:movieId',
      name: 'booking',
      component: BookingView,
    },
    {
      path: '/my-tickets',
      name: 'my-tickets',
      component: MyTicketsView,
    },
    {
      path: '/account',
      name: 'account',
      component: AccountView,
    },
  ],
})

export default router
