import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('./views/HomeView.vue'),
    },
    {
      path: '/projects/new',
      name: 'project-new',
      component: () => import('./views/ProjectNewView.vue'),
    },
    {
      path: '/projects/:id',
      name: 'project-detail',
      component: () => import('./views/ProjectDetailView.vue'),
      props: true,
    },
  ],
})

export default router
