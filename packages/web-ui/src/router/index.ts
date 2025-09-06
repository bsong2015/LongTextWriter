import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '../views/DashboardView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'Dashboard',
      component: DashboardView
    },
    {
      path: '/projects/:projectName',
      name: 'ProjectDetail',
      // Lazily load the component for better performance
      component: () => import('../views/ProjectDetailView.vue'),
      props: true // Pass route params as component props
    },
    {
      path: '/settings',
      name: 'Settings',
      component: () => import('../views/SettingsView.vue')
    }
  ]
})

export default router
