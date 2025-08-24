import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import AuthCallback from '../views/AuthCallback.vue'

const router = createRouter({
  history: createWebHashHistory(), // Use hash history instead of web history
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/auth/callback',
      name: 'auth-callback',
      component: AuthCallback,
    },
  ],
})

export default router
