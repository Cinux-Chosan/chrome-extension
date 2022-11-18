import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/cookie',
      name: 'cookie',
      component: () => import('@/views/Cookie/IndexView.vue')
    },
    { path: '/:pathMatch(.*)*', name: 'NotFound', redirect: '/cookie' },
  ]
})

export default router
