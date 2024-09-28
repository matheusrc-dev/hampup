import { createRouter, createWebHistory } from 'vue-router'
import CallerView from '../views/CallerView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: CallerView
    }
  ]
})

export default router
