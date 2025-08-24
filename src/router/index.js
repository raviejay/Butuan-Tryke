import { createRouter, createWebHistory } from 'vue-router' // Change this
import HomeView from '../views/HomeView.vue'
import CallBack from '@/components/auth/CallBack.vue'

const router = createRouter({
  history: createWebHistory(), // Change to web history
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/auth/callback',
      name: 'auth-callback',
      component: CallBack,
    },
  ],
})
export default router
