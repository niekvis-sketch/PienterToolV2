import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiFetch } from '../api'
import type {
  UserStory, ClientQuestion, Fase1Summary,
  SiteNode, PageBlock, PageChecklist,
  StructuurProgress, ChangeLogEntry, StructureWarning, StructureImport,
  StructureImportResult
} from '@shared/types'

export const useStructuurStore = defineStore('structuur', () => {
  // --- State ---
  const progress = ref<StructuurProgress | null>(null)
  const userStories = ref<UserStory[]>([])
  const clientQuestions = ref<ClientQuestion[]>([])
  const fase1Summary = ref<Fase1Summary | null>(null)
  const siteNodes = ref<SiteNode[]>([])
  const pageBlocks = ref<PageBlock[]>([])
  const allProjectBlocks = ref<PageBlock[]>([])
  const pageChecklist = ref<PageChecklist | null>(null)
  const warnings = ref<StructureWarning[]>([])
  const changeLog = ref<ChangeLogEntry[]>([])
  const loading = ref(false)
  const selectedNodeId = ref<string | null>(null)

  // --- Computed ---
  const selectedNode = computed(() => siteNodes.value.find(n => n.id === selectedNodeId.value) || null)

  const treeNodes = computed(() => {
    const nodes = siteNodes.value.filter(n => !n.isParked)
    const map = new Map<string | null, SiteNode[]>()
    for (const n of nodes) {
      const key = n.parentId
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(n)
    }
    // Sort each level by sortOrder
    for (const [, children] of map) {
      children.sort((a, b) => a.sortOrder - b.sortOrder)
    }
    return map
  })

  const flatSortedNodes = computed(() => {
    const result: SiteNode[] = []
    function addChildren(parentId: string | null) {
      const children = treeNodes.value.get(parentId) || []
      for (const child of children) {
        result.push(child)
        addChildren(child.id)
      }
    }
    addChildren(null)
    // Add parked nodes at the end
    for (const n of siteNodes.value.filter(nn => nn.isParked)) {
      if (!result.find(r => r.id === n.id)) result.push(n)
    }
    return result
  })

  const parkedNodes = computed(() => siteNodes.value.filter(n => n.isParked))
  const mainNavNodes = computed(() => siteNodes.value.filter(n => n.isInMainNav && !n.isParked))

  const openQuestions = computed(() => clientQuestions.value.filter(q => q.status === 'open'))
  const answeredQuestions = computed(() => clientQuestions.value.filter(q => q.status === 'answered'))
  const assumptions = computed(() => clientQuestions.value.filter(q => q.status === 'assumption'))
  const insights = computed(() => clientQuestions.value.filter(q => q.status === 'insight'))

  // --- Progress ---
  async function fetchProgress(projectId: string) {
    progress.value = await apiFetch<StructuurProgress>('GET', `/structuur/${projectId}/progress`)
  }
  async function updateProgress(projectId: string, data: Partial<StructuurProgress>) {
    progress.value = await apiFetch<StructuurProgress>('PUT', `/structuur/${projectId}/progress`, data)
  }

  // --- Fase 1: User Stories ---
  async function fetchStories(projectId: string) {
    userStories.value = await apiFetch<UserStory[]>('GET', `/structuur/${projectId}/stories`)
  }
  async function createStory(projectId: string, data: Partial<UserStory>) {
    const s = await apiFetch<UserStory>('POST', `/structuur/${projectId}/stories`, data)
    userStories.value.push(s)
    return s
  }
  async function updateStory(projectId: string, storyId: string, data: Partial<UserStory>) {
    const s = await apiFetch<UserStory>('PUT', `/structuur/${projectId}/stories/${storyId}`, data)
    const idx = userStories.value.findIndex(x => x.id === storyId)
    if (idx >= 0) userStories.value[idx] = s
    return s
  }
  async function deleteStory(projectId: string, storyId: string) {
    await apiFetch<void>('DELETE', `/structuur/${projectId}/stories/${storyId}`)
    userStories.value = userStories.value.filter(s => s.id !== storyId)
  }
  async function generateQuestionsForStory(projectId: string, storyId: string) {
    const newQ = await apiFetch<ClientQuestion[]>('POST', `/structuur/${projectId}/stories/${storyId}/generate-questions`)
    clientQuestions.value.push(...newQ)
    return newQ
  }

  // --- Fase 1: Client Questions ---
  async function fetchQuestions(projectId: string) {
    clientQuestions.value = await apiFetch<ClientQuestion[]>('GET', `/structuur/${projectId}/questions`)
  }
  async function createQuestion(projectId: string, data: Partial<ClientQuestion>) {
    const q = await apiFetch<ClientQuestion>('POST', `/structuur/${projectId}/questions`, data)
    clientQuestions.value.push(q)
    return q
  }
  async function updateQuestion(projectId: string, questionId: string, data: Partial<ClientQuestion>) {
    const q = await apiFetch<ClientQuestion>('PUT', `/structuur/${projectId}/questions/${questionId}`, data)
    const idx = clientQuestions.value.findIndex(x => x.id === questionId)
    if (idx >= 0) clientQuestions.value[idx] = q
    return q
  }
  async function deleteQuestion(projectId: string, questionId: string) {
    await apiFetch<void>('DELETE', `/structuur/${projectId}/questions/${questionId}`)
    clientQuestions.value = clientQuestions.value.filter(q => q.id !== questionId)
  }

  // --- Fase 1: Summary ---
  async function fetchFase1Summary(projectId: string) {
    fase1Summary.value = await apiFetch<Fase1Summary | null>('GET', `/structuur/${projectId}/fase1-summary`)
  }
  async function generateFase1Summary(projectId: string) {
    fase1Summary.value = await apiFetch<Fase1Summary>('POST', `/structuur/${projectId}/fase1-summary/generate`)
    return fase1Summary.value
  }

  // --- Fase 2: Site Nodes ---
  async function fetchNodes(projectId: string) {
    siteNodes.value = await apiFetch<SiteNode[]>('GET', `/structuur/${projectId}/nodes`)
  }
  async function createNode(projectId: string, data: Partial<SiteNode>) {
    const n = await apiFetch<SiteNode>('POST', `/structuur/${projectId}/nodes`, data)
    siteNodes.value.push(n)
    return n
  }
  async function updateNode(projectId: string, nodeId: string, data: Partial<SiteNode>) {
    const n = await apiFetch<SiteNode>('PUT', `/structuur/${projectId}/nodes/${nodeId}`, data)
    const idx = siteNodes.value.findIndex(x => x.id === nodeId)
    if (idx >= 0) siteNodes.value[idx] = n
    return n
  }
  async function deleteNode(projectId: string, nodeId: string) {
    const result = await apiFetch<{ deleted: boolean; removedIds: string[] }>('DELETE', `/structuur/${projectId}/nodes/${nodeId}`)
    siteNodes.value = siteNodes.value.filter(n => !result.removedIds.includes(n.id))
    return result
  }
  async function duplicateNode(projectId: string, nodeId: string) {
    const n = await apiFetch<SiteNode>('POST', `/structuur/${projectId}/nodes/${nodeId}/duplicate`)
    siteNodes.value.push(n)
    return n
  }
  async function moveNode(projectId: string, nodeId: string, parentId: string | null, sortOrder: number) {
    const result = await apiFetch<{ node: SiteNode; childrenAffected: number }>('PUT', `/structuur/${projectId}/nodes/${nodeId}/move`, { parentId, sortOrder })
    // Reload all nodes to get updated URLs
    await fetchNodes(projectId)
    return result
  }
  async function importNodes(projectId: string, data: StructureImport) {
    const result = await apiFetch<StructureImportResult>('POST', `/structuur/${projectId}/nodes/import`, data)
    siteNodes.value = [...siteNodes.value, ...result.nodes]
    if (result.blocks && result.blocks.length > 0) {
      allProjectBlocks.value = [...allProjectBlocks.value, ...result.blocks]
    }
    return result
  }
  async function importFlatNodes(projectId: string, rows: Array<{ title: string; slug: string; parentTitle?: string; level?: number }>) {
    const nodes = await apiFetch<SiteNode[]>('POST', `/structuur/${projectId}/nodes/import-flat`, { rows })
    siteNodes.value = [...siteNodes.value, ...nodes]
    return nodes
  }

  // --- All blocks for project (Fase 3 overview) ---
  async function fetchAllBlocks(projectId: string) {
    allProjectBlocks.value = await apiFetch<PageBlock[]>('GET', `/structuur/${projectId}/blocks`)
  }

  // --- Warnings ---
  async function fetchWarnings(projectId: string) {
    warnings.value = await apiFetch<StructureWarning[]>('GET', `/structuur/${projectId}/warnings`)
  }

  // --- Fase 3: Page Blocks ---
  async function fetchBlocks(projectId: string, nodeId: string) {
    pageBlocks.value = await apiFetch<PageBlock[]>('GET', `/structuur/${projectId}/nodes/${nodeId}/blocks`)
  }
  async function createBlock(projectId: string, nodeId: string, data: Partial<PageBlock>) {
    const b = await apiFetch<PageBlock>('POST', `/structuur/${projectId}/nodes/${nodeId}/blocks`, data)
    pageBlocks.value.push(b)
    return b
  }
  async function updateBlock(projectId: string, nodeId: string, blockId: string, data: Partial<PageBlock>) {
    const b = await apiFetch<PageBlock>('PUT', `/structuur/${projectId}/nodes/${nodeId}/blocks/${blockId}`, data)
    const idx = pageBlocks.value.findIndex(x => x.id === blockId)
    if (idx >= 0) pageBlocks.value[idx] = b
    return b
  }
  async function deleteBlock(projectId: string, nodeId: string, blockId: string) {
    await apiFetch<void>('DELETE', `/structuur/${projectId}/nodes/${nodeId}/blocks/${blockId}`)
    pageBlocks.value = pageBlocks.value.filter(b => b.id !== blockId)
  }
  async function reorderBlocks(projectId: string, nodeId: string, blockIds: string[]) {
    await apiFetch<void>('PUT', `/structuur/${projectId}/nodes/${nodeId}/blocks-reorder`, { blockIds })
    // Reorder locally
    for (let i = 0; i < blockIds.length; i++) {
      const idx = pageBlocks.value.findIndex(b => b.id === blockIds[i])
      if (idx >= 0) pageBlocks.value[idx].sortOrder = i
    }
  }

  // --- Fase 3: Checklist ---
  async function fetchChecklist(projectId: string, nodeId: string) {
    pageChecklist.value = await apiFetch<PageChecklist>('GET', `/structuur/${projectId}/nodes/${nodeId}/checklist`)
  }
  async function updateChecklist(projectId: string, nodeId: string, data: Partial<PageChecklist>) {
    pageChecklist.value = await apiFetch<PageChecklist>('PUT', `/structuur/${projectId}/nodes/${nodeId}/checklist`, data)
  }

  // --- Changelog ---
  async function fetchChangeLog(projectId: string) {
    changeLog.value = await apiFetch<ChangeLogEntry[]>('GET', `/structuur/${projectId}/changelog`)
  }

  // --- Load all for project ---
  async function loadAll(projectId: string) {
    loading.value = true
    try {
      await Promise.all([
        fetchProgress(projectId),
        fetchStories(projectId),
        fetchQuestions(projectId),
        fetchNodes(projectId),
        fetchFase1Summary(projectId),
      ])
    } finally {
      loading.value = false
    }
  }

  return {
    // State
    progress, userStories, clientQuestions, fase1Summary,
    siteNodes, pageBlocks, allProjectBlocks, pageChecklist, warnings, changeLog,
    loading, selectedNodeId,
    // Computed
    selectedNode, treeNodes, flatSortedNodes, parkedNodes, mainNavNodes,
    openQuestions, answeredQuestions, assumptions, insights,
    // Progress
    fetchProgress, updateProgress,
    // Fase 1
    fetchStories, createStory, updateStory, deleteStory, generateQuestionsForStory,
    fetchQuestions, createQuestion, updateQuestion, deleteQuestion,
    fetchFase1Summary, generateFase1Summary,
    // Fase 2
    fetchNodes, createNode, updateNode, deleteNode, duplicateNode, moveNode,
    importNodes, importFlatNodes, fetchWarnings,
    // Fase 3
    fetchBlocks, fetchAllBlocks, createBlock, updateBlock, deleteBlock, reorderBlocks,
    fetchChecklist, updateChecklist,
    // Changelog
    fetchChangeLog,
    // Bulk
    loadAll,
  }
})
