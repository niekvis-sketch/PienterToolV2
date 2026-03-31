import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apiFetch } from '../api'
import api from '../api'
import type {
  Project, Page, SEOFields,
  Doelgroep, DoelgroepVraag, ComponentBlock
} from '@shared/types'

export const useProjectStore = defineStore('project', () => {
  // State
  const projects = ref<Project[]>([])
  const currentProject = ref<Project | null>(null)
  const pages = ref<Page[]>([])
  const seoFields = ref<SEOFields[]>([])
  const doelgroepen = ref<Doelgroep[]>([])
  const doelgroepVragen = ref<DoelgroepVraag[]>([])
  const componenten = ref<ComponentBlock[]>([])
  const loading = ref(false)

  // ---- Projects ----
  async function fetchProjects() {
    loading.value = true
    try {
      projects.value = await apiFetch<Project[]>('GET', '/projects')
    } finally { loading.value = false }
  }

  async function fetchProject(id: string) {
    loading.value = true
    try {
      currentProject.value = await apiFetch<Project>('GET', `/projects/${id}`)
    } finally { loading.value = false }
  }

  async function createProject(data: Partial<Project>) {
    const p = await apiFetch<Project>('POST', '/projects', data)
    projects.value.push(p)
    return p
  }

  async function updateProject(id: string, data: Partial<Project>) {
    const p = await apiFetch<Project>('PUT', `/projects/${id}`, data)
    currentProject.value = p
    const idx = projects.value.findIndex(x => x.id === id)
    if (idx >= 0) projects.value[idx] = p
    return p
  }

  // ---- Pages ----
  async function fetchPages(projectId: string) {
    pages.value = await apiFetch<Page[]>('GET', `/projects/${projectId}/pages`)
    seoFields.value = await apiFetch<SEOFields[]>('GET', `/projects/${projectId}/seo`)
  }

  async function updatePage(projectId: string, pageId: string, data: Partial<Page>) {
    const p = await apiFetch<Page>('PUT', `/projects/${projectId}/pages/${pageId}`, data)
    const idx = pages.value.findIndex(x => x.id === pageId)
    if (idx >= 0) pages.value[idx] = p
    return p
  }

  async function updateSeoFields(projectId: string, pageId: string, data: Partial<SEOFields>) {
    const s = await apiFetch<SEOFields>('PUT', `/projects/${projectId}/seo/${pageId}`, data)
    const idx = seoFields.value.findIndex(x => x.pageId === pageId)
    if (idx >= 0) seoFields.value[idx] = s
    return s
  }

  // ---- Doelgroepen ----
  async function fetchDoelgroepen(projectId: string) {
    doelgroepen.value = await apiFetch<Doelgroep[]>('GET', `/doelgroepen/${projectId}`)
  }

  async function createDoelgroep(projectId: string, data: Partial<Doelgroep>) {
    const d = await apiFetch<Doelgroep>('POST', `/doelgroepen/${projectId}`, data)
    doelgroepen.value.push(d)
    return d
  }

  async function updateDoelgroep(projectId: string, doelgroepId: string, data: Partial<Doelgroep>) {
    const d = await apiFetch<Doelgroep>('PUT', `/doelgroepen/${projectId}/${doelgroepId}`, data)
    const idx = doelgroepen.value.findIndex(x => x.id === doelgroepId)
    if (idx >= 0) doelgroepen.value[idx] = d
    return d
  }

  async function deleteDoelgroep(projectId: string, doelgroepId: string) {
    await apiFetch<{ deleted: boolean }>('DELETE', `/doelgroepen/${projectId}/${doelgroepId}`)
    doelgroepen.value = doelgroepen.value.filter(x => x.id !== doelgroepId)
    doelgroepVragen.value = doelgroepVragen.value.filter(x => x.doelgroepId !== doelgroepId)
  }

  // ---- Doelgroep Vragen ----
  async function fetchDoelgroepVragen(projectId: string, doelgroepId: string) {
    const vragen = await apiFetch<DoelgroepVraag[]>('GET', `/doelgroepen/${projectId}/${doelgroepId}/vragen`)
    // Merge into store (replace existing for this doelgroep)
    doelgroepVragen.value = doelgroepVragen.value.filter(v => v.doelgroepId !== doelgroepId).concat(vragen)
  }

  async function fetchAllDoelgroepVragen(projectId: string) {
    // Fetch vragen for all doelgroepen
    const dgs = doelgroepen.value.length > 0 ? doelgroepen.value : await apiFetch<Doelgroep[]>('GET', `/doelgroepen/${projectId}`)
    const all: DoelgroepVraag[] = []
    for (const dg of dgs) {
      const vragen = await apiFetch<DoelgroepVraag[]>('GET', `/doelgroepen/${projectId}/${dg.id}/vragen`)
      all.push(...vragen)
    }
    doelgroepVragen.value = all
  }

  async function createDoelgroepVraag(projectId: string, doelgroepId: string, data: Partial<DoelgroepVraag>) {
    const v = await apiFetch<DoelgroepVraag>('POST', `/doelgroepen/${projectId}/${doelgroepId}/vragen`, data)
    doelgroepVragen.value.push(v)
    return v
  }

  async function updateDoelgroepVraag(projectId: string, doelgroepId: string, vraagId: string, data: Partial<DoelgroepVraag>) {
    const v = await apiFetch<DoelgroepVraag>('PUT', `/doelgroepen/${projectId}/${doelgroepId}/vragen/${vraagId}`, data)
    const idx = doelgroepVragen.value.findIndex(x => x.id === vraagId)
    if (idx >= 0) doelgroepVragen.value[idx] = v
    return v
  }

  async function deleteDoelgroepVraag(projectId: string, doelgroepId: string, vraagId: string) {
    await apiFetch<{ deleted: boolean }>('DELETE', `/doelgroepen/${projectId}/${doelgroepId}/vragen/${vraagId}`)
    doelgroepVragen.value = doelgroepVragen.value.filter(x => x.id !== vraagId)
  }

  async function bulkImportDoelgroepVragen(projectId: string, rows: Array<{ doelgroepId: string; fase: string; text: string; answer?: string; webpagina?: string; opmerkingen?: string }>, replace: boolean = false) {
    const created = await apiFetch<DoelgroepVraag[]>('POST', `/doelgroepen/${projectId}/bulk-import`, { rows, replace })
    if (replace) {
      const importDoelgroepIds = [...new Set(rows.map(r => r.doelgroepId))]
      doelgroepVragen.value = doelgroepVragen.value.filter(v => !importDoelgroepIds.includes(v.doelgroepId))
    }
    doelgroepVragen.value.push(...created)
    return created
  }

  // ---- Componenten ----
  async function fetchComponenten(projectId: string) {
    componenten.value = await apiFetch<ComponentBlock[]>('GET', `/componenten/${projectId}`)
  }

  async function seedComponenten(projectId: string) {
    const items = await apiFetch<ComponentBlock[]>('POST', `/componenten/${projectId}/seed`)
    componenten.value = items
    return items
  }

  async function createComponent(projectId: string, data: Partial<ComponentBlock>) {
    const c = await apiFetch<ComponentBlock>('POST', `/componenten/${projectId}`, data)
    componenten.value.push(c)
    return c
  }

  async function updateComponent(projectId: string, componentId: string, data: Partial<ComponentBlock>) {
    const c = await apiFetch<ComponentBlock>('PUT', `/componenten/${projectId}/${componentId}`, data)
    const idx = componenten.value.findIndex(x => x.id === componentId)
    if (idx >= 0) componenten.value[idx] = c
    return c
  }

  async function deleteComponent(projectId: string, componentId: string) {
    await apiFetch<{ deleted: boolean }>('DELETE', `/componenten/${projectId}/${componentId}`)
    componenten.value = componenten.value.filter(x => x.id !== componentId)
  }

  async function uploadComponentImage(projectId: string, componentId: string, file: File) {
    const formData = new FormData()
    formData.append('image', file)
    const res = await api.post<{ ok: boolean; data: ComponentBlock }>(
      `/componenten/${projectId}/${componentId}/image`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    if (!res.data.ok) throw new Error('Upload mislukt')
    const c = res.data.data
    const idx = componenten.value.findIndex(x => x.id === componentId)
    if (idx >= 0) componenten.value[idx] = c
    return c
  }

  async function deleteComponentImage(projectId: string, componentId: string) {
    const c = await apiFetch<ComponentBlock>('DELETE', `/componenten/${projectId}/${componentId}/image`)
    const idx = componenten.value.findIndex(x => x.id === componentId)
    if (idx >= 0) componenten.value[idx] = c
    return c
  }

  // ---- Seed ----
  async function seed() {
    await apiFetch<void>('GET', '/seed')
    await fetchProjects()
  }

  return {
    projects, currentProject, pages, seoFields,
    doelgroepen, doelgroepVragen, componenten, loading,
    fetchProjects, fetchProject, createProject, updateProject,
    fetchPages, updatePage, updateSeoFields,
    fetchDoelgroepen, createDoelgroep, updateDoelgroep, deleteDoelgroep,
    fetchDoelgroepVragen, fetchAllDoelgroepVragen, createDoelgroepVraag, updateDoelgroepVraag, deleteDoelgroepVraag,
    bulkImportDoelgroepVragen,
    fetchComponenten, seedComponenten, createComponent, updateComponent, deleteComponent,
    uploadComponentImage, deleteComponentImage,
    seed,
  }
})
