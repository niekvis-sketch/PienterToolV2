import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apiFetch } from '../api'
import api from '../api'
import type {
  Project, Page, SEOFields, Task, Source, MediaItem,
  AuditRun, AuditIssue, StructureImport,
  Doelgroep, DoelgroepVraag, ComponentBlock
} from '@shared/types'

export const useProjectStore = defineStore('project', () => {
  // State
  const projects = ref<Project[]>([])
  const currentProject = ref<Project | null>(null)
  const pages = ref<Page[]>([])
  const seoFields = ref<SEOFields[]>([])
  const tasks = ref<Task[]>([])
  const sources = ref<Source[]>([])
  const media = ref<MediaItem[]>([])
  const auditRuns = ref<AuditRun[]>([])
  const auditIssues = ref<AuditIssue[]>([])
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

  async function importStructure(projectId: string, data: StructureImport) {
    const result = await apiFetch<{ pages: Page[]; seoFields: SEOFields[]; tasks: Task[] }>(
      'POST', `/projects/${projectId}/structure/import`, data
    )
    pages.value = result.pages
    seoFields.value = result.seoFields
    // Merge tasks
    for (const t of result.tasks) {
      if (!tasks.value.find(x => x.id === t.id)) tasks.value.push(t)
    }
    return result
  }

  // ---- Tasks ----
  async function fetchTasks(projectId: string) {
    tasks.value = await apiFetch<Task[]>('GET', `/projects/${projectId}/tasks`)
  }

  async function createTask(projectId: string, data: Partial<Task>) {
    const t = await apiFetch<Task>('POST', `/projects/${projectId}/tasks`, data)
    tasks.value.push(t)
    return t
  }

  async function updateTask(projectId: string, taskId: string, data: Partial<Task>) {
    const t = await apiFetch<Task>('PUT', `/projects/${projectId}/tasks/${taskId}`, data)
    const idx = tasks.value.findIndex(x => x.id === taskId)
    if (idx >= 0) tasks.value[idx] = t
    return t
  }

  // ---- Sources ----
  async function fetchSources(projectId: string) {
    sources.value = await apiFetch<Source[]>('GET', `/projects/${projectId}/sources`)
  }

  async function createSource(projectId: string, data: Partial<Source>) {
    const s = await apiFetch<Source>('POST', `/projects/${projectId}/sources`, data)
    sources.value.push(s)
    return s
  }

  async function updateSource(projectId: string, sourceId: string, data: Partial<Source>) {
    const s = await apiFetch<Source>('PUT', `/projects/${projectId}/sources/${sourceId}`, data)
    const idx = sources.value.findIndex(x => x.id === sourceId)
    if (idx >= 0) sources.value[idx] = s
    return s
  }

  // ---- Media ----
  async function fetchMedia(projectId: string) {
    media.value = await apiFetch<MediaItem[]>('GET', `/projects/${projectId}/media`)
  }

  async function createMedia(projectId: string, data: Partial<MediaItem>) {
    const m = await apiFetch<MediaItem>('POST', `/projects/${projectId}/media`, data)
    media.value.push(m)
    return m
  }

  async function scrapeMockMedia(projectId: string) {
    const items = await apiFetch<MediaItem[]>('POST', `/projects/${projectId}/media/scrape-mock`)
    media.value.push(...items)
    return items
  }

  // ---- Audit ----
  async function fetchAuditRuns(projectId: string) {
    auditRuns.value = await apiFetch<AuditRun[]>('GET', `/projects/${projectId}/audit`)
  }

  async function runAudit(projectId: string, environment: 'staging' | 'live') {
    const result = await apiFetch<{ run: AuditRun; issues: AuditIssue[] }>(
      'POST', `/projects/${projectId}/audit/run`, { environment }
    )
    auditRuns.value.push(result.run)
    auditIssues.value = result.issues
    return result
  }

  async function fetchAuditIssues(projectId: string, runId: string) {
    auditIssues.value = await apiFetch<AuditIssue[]>('GET', `/projects/${projectId}/audit/${runId}/issues`)
  }

  async function updateAuditIssue(issueId: string, data: Partial<AuditIssue>) {
    const issue = await apiFetch<AuditIssue>('PUT', `/audit/issues/${issueId}`, data)
    const idx = auditIssues.value.findIndex(x => x.id === issueId)
    if (idx >= 0) auditIssues.value[idx] = issue
    return issue
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
      `/api/componenten/${projectId}/${componentId}/image`,
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
    projects, currentProject, pages, seoFields, tasks, sources, media,
    auditRuns, auditIssues, doelgroepen, doelgroepVragen, componenten, loading,
    fetchProjects, fetchProject, createProject, updateProject,
    fetchPages, updatePage, updateSeoFields, importStructure,
    fetchTasks, createTask, updateTask,
    fetchSources, createSource, updateSource,
    fetchMedia, createMedia, scrapeMockMedia,
    fetchAuditRuns, runAudit, fetchAuditIssues, updateAuditIssue,
    fetchDoelgroepen, createDoelgroep, updateDoelgroep, deleteDoelgroep,
    fetchDoelgroepVragen, fetchAllDoelgroepVragen, createDoelgroepVraag, updateDoelgroepVraag, deleteDoelgroepVraag,
    bulkImportDoelgroepVragen,
    fetchComponenten, seedComponenten, createComponent, updateComponent, deleteComponent,
    uploadComponentImage, deleteComponentImage,
    seed,
  }
})
