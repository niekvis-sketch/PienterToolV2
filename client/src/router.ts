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
      path: '/slides',
      name: 'slides-overview',
      component: () => import('./views/SlidesOverviewView.vue'),
    },
    {
      path: '/slides/:id',
      name: 'slides-editor',
      component: () => import('./views/SlideEditorView.vue'),
      props: true,
    },
    {
      path: '/klanten',
      name: 'klanten',
      redirect: '/',
    },
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
