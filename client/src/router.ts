import { createRouter, createWebHistory, type RouteLocationNormalized, type NavigationGuardNext } from 'vue-router'
import { useKlantenStore } from './stores/klantenStore'
import { useProjectStore } from './stores/projectStore'

async function projectIdRedirect(to: RouteLocationNormalized, _from: RouteLocationNormalized, next: NavigationGuardNext) {
  const projectId = to.params.id as string
  const projectStore = useProjectStore()
  const klantenStore = useKlantenStore()

  if (projectStore.projects.length === 0) {
    try { await projectStore.fetchProjects() } catch {}
  }
  if (klantenStore.klanten.length === 0) {
    try { await klantenStore.fetchKlanten() } catch {}
  }

  const project = projectStore.projects.find(p => p.id === projectId)
  if (!project) return next('/klanten')
  const klant = klantenStore.klanten.find(k => k.naam === project.clientName)
  if (!klant) return next('/klanten')
  next(`/klanten/${klant.id}/website`)
}

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/klanten' },

    // Klanten
    {
      path: '/klanten',
      name: 'klanten',
      component: () => import('./views/KlantenView.vue'),
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
    {
      path: '/klanten/:id/advertising',
      name: 'klant-advertising',
      component: () => import('./views/KlantAdvertisingView.vue'),
      props: true,
    },
    {
      path: '/klanten/:id/seo',
      name: 'klant-seo',
      component: () => import('./views/KlantSeoView.vue'),
      props: true,
    },
    {
      path: '/klanten/:id/content',
      name: 'klant-content',
      component: () => import('./views/KlantContentView.vue'),
      props: true,
    },
    {
      path: '/klanten/:id/website',
      name: 'klant-website',
      component: () => import('./views/KlantWebsiteView.vue'),
      props: true,
    },

    // Projects (alleen create + legacy redirect)
    {
      path: '/projects/new',
      name: 'project-new',
      component: () => import('./views/ProjectNewView.vue'),
    },
    {
      path: '/projects/:id',
      beforeEnter: projectIdRedirect,
      component: { template: '<div></div>' },
    },

    // Medewerkers
    {
      path: '/medewerkers',
      name: 'medewerkers',
      component: () => import('./views/MedewerkersView.vue'),
    },

    // Sales
    {
      path: '/sales',
      name: 'sales',
      component: () => import('./views/SalesView.vue'),
    },
    {
      path: '/sales/slides',
      name: 'slides-overview',
      component: () => import('./views/SlidesOverviewView.vue'),
    },
    {
      path: '/sales/slides/:id',
      name: 'slides-editor',
      component: () => import('./views/SlideEditorView.vue'),
      props: true,
    },

    // Backwards-compat
    { path: '/slides', redirect: '/sales/slides' },
    { path: '/slides/:id', redirect: (to) => `/sales/slides/${to.params.id}` },
  ],
})

export default router
