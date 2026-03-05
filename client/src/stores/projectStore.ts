import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apiFetch } from '../api'
import type {
  Project, Page, SEOFields, Task, Source, MediaItem,
  AuditRun, AuditIssue, StructureImport
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

  // ---- Seed ----
  async function seed() {
    await apiFetch<void>('GET', '/seed')
    await fetchProjects()
  }

  return {
    projects, currentProject, pages, seoFields, tasks, sources, media,
    auditRuns, auditIssues, loading,
    fetchProjects, fetchProject, createProject, updateProject,
    fetchPages, updatePage, updateSeoFields, importStructure,
    fetchTasks, createTask, updateTask,
    fetchSources, createSource, updateSource,
    fetchMedia, createMedia, scrapeMockMedia,
    fetchAuditRuns, runAudit, fetchAuditIssues, updateAuditIssue,
    seed,
  }
})
