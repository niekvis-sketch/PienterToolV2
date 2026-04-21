import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('./views/KlantenView.vue'),
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
    {
      path: '/projects/:id/presentatie/:sessieId',
      name: 'presentatie',
      component: () => import('./views/PresentatieView.vue'),
      props: true,
    },
    {
      path: '/klanten',
      name: 'klanten',
      redirect: '/',
    },,
    {
      path: '/klanten/new',
      name: 'klant-new',
      component: () => import('./views/KlantNewView.vue'),
    },
    {
      path: '/klanten/:id',
      name: 'klant-detail',
      component: () => import('./views/KlantDetailView.vue'),
      props: true,
    },
  ],
})

export default router
