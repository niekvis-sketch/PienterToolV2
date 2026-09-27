import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiFetch } from '../api'
import type {
  UserStory, ClientQuestion, Fase1Summary,
  SiteNode, PageBlock,
  StructuurProgress, ChangeLogEntry, StructureWarning, StructureImport,
  StructureImportResult, ProjectMenu, ProjectMenuItem
} from '@shared/types'
import type { MenuItem } from '../components/structuur/menuTypes'

const genMenuId = () => 'mi_' + Math.random().toString(16).slice(2, 10) + Math.random().toString(16).slice(2, 6)

// Inhoudsvelden die een hergebruikt blok van zijn origineel overneemt (spiegel van de server).
const SHARED_BLOCK_FIELDS = [
  'name', 'type', 'goal', 'targetUser', 'contentDescription', 'componentPattern',
  'notesContent', 'notesSeo', 'notesDesign',
] as const

export const useStructuurStore = defineStore('structuur', () => {
  // --- State ---
  const progress = ref<StructuurProgress | null>(null)
  const userStories = ref<UserStory[]>([])
  const clientQuestions = ref<ClientQuestion[]>([])
  const fase1Summary = ref<Fase1Summary | null>(null)
  const siteNodes = ref<SiteNode[]>([])
  const pageBlocks = ref<PageBlock[]>([])
  const allProjectBlocks = ref<PageBlock[]>([])
  const warnings = ref<StructureWarning[]>([])
  const changeLog = ref<ChangeLogEntry[]>([])
  const loading = ref(false)
  const selectedNodeId = ref<string | null>(null)

  // Menu items — per project op de server bewaard (zie fetchMenu / persistMenu).
  const menuItems = ref<MenuItem[]>([])
  const menuProjectId = ref<string | null>(null)

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
    scheduleWarnings(projectId)
    return n
  }
  async function updateNode(projectId: string, nodeId: string, data: Partial<SiteNode>) {
    const n = await apiFetch<SiteNode>('PUT', `/structuur/${projectId}/nodes/${nodeId}`, data)
    const idx = siteNodes.value.findIndex(x => x.id === nodeId)
    if (idx >= 0) siteNodes.value[idx] = n
    // Slug/parent gewijzigd → URL's van subpagina's zijn server-side herberekend.
    if (data.slug !== undefined || data.parentId !== undefined) await fetchNodes(projectId)
    scheduleWarnings(projectId)
    return n
  }
  async function deleteNode(projectId: string, nodeId: string) {
    const result = await apiFetch<{ deleted: boolean; removedIds: string[] }>('DELETE', `/structuur/${projectId}/nodes/${nodeId}`)
    siteNodes.value = siteNodes.value.filter(n => !result.removedIds.includes(n.id))
    const removed = new Set(result.removedIds)
    allProjectBlocks.value = allProjectBlocks.value.filter(b => !removed.has(b.siteNodeId))
    const menuIds = menuItems.value.filter(m => removed.has(m.siteNodeId)).map(m => m.id)
    for (const id of menuIds) removeMenuItem(id)
    if (selectedNodeId.value && removed.has(selectedNodeId.value)) selectedNodeId.value = null
    scheduleWarnings(projectId)
    return result
  }
  async function duplicateNode(projectId: string, nodeId: string) {
    const n = await apiFetch<SiteNode>('POST', `/structuur/${projectId}/nodes/${nodeId}/duplicate`)
    siteNodes.value.push(n)
    scheduleWarnings(projectId)
    return n
  }
  // Pagina `nodeId` gaat op in `intoNodeId`: blokken, subpagina's en de oude URL
  // (als redirect) verhuizen mee; de bronpagina verdwijnt.
  async function mergeNode(projectId: string, nodeId: string, intoNodeId: string) {
    const result = await apiFetch<{ node: SiteNode; removedId: string; movedBlocks: number }>(
      'POST', `/structuur/${projectId}/nodes/${nodeId}/merge`, { intoNodeId },
    )
    await Promise.all([fetchNodes(projectId), fetchAllBlocks(projectId), fetchMenu(projectId)])
    if (selectedNodeId.value === nodeId) selectedNodeId.value = intoNodeId
    await fetchWarnings(projectId)
    return result
  }
  async function moveNode(projectId: string, nodeId: string, parentId: string | null, sortOrder: number, canvasX?: number | null) {
    const body: Record<string, unknown> = { parentId, sortOrder }
    if (canvasX !== undefined) body.canvasX = canvasX
    const result = await apiFetch<{ node: SiteNode; childrenAffected: number }>('PUT', `/structuur/${projectId}/nodes/${nodeId}/move`, body)
    // Reload all nodes to get updated URLs
    await fetchNodes(projectId)
    scheduleWarnings(projectId)
    return result
  }
  async function importNodes(projectId: string, data: StructureImport) {
    const result = await apiFetch<StructureImportResult>('POST', `/structuur/${projectId}/nodes/import`, data)
    siteNodes.value = [...siteNodes.value, ...result.nodes]
    if (result.blocks && result.blocks.length > 0) {
      allProjectBlocks.value = [...allProjectBlocks.value, ...result.blocks]
    }
    // Een lege (of net geleegde) navigatie opbouwen vanuit de nieuwe structuur.
    if (menuItems.value.length === 0) seedMenuFromStructure(projectId)
    return result
  }
  async function importFlatNodes(projectId: string, rows: Array<{ title: string; slug: string; parentTitle?: string; level?: number }>) {
    const nodes = await apiFetch<SiteNode[]>('POST', `/structuur/${projectId}/nodes/import-flat`, { rows })
    siteNodes.value = [...siteNodes.value, ...nodes]
    if (menuItems.value.length === 0) seedMenuFromStructure(projectId)
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
  // Na elke structuurwijziging opnieuw controleren (gedebounced), zodat
  // waarschuwingen vanzelf verschijnen zonder op "Controleer" te klikken.
  let warningsTimer: ReturnType<typeof setTimeout> | null = null
  function scheduleWarnings(projectId: string) {
    if (warningsTimer) clearTimeout(warningsTimer)
    warningsTimer = setTimeout(() => { fetchWarnings(projectId).catch(() => {}) }, 400)
  }

  // --- Fase 3: Page Blocks ---
  async function fetchBlocks(projectId: string, nodeId: string) {
    pageBlocks.value = await apiFetch<PageBlock[]>('GET', `/structuur/${projectId}/nodes/${nodeId}/blocks`)
  }
  async function createBlock(projectId: string, nodeId: string, data: Partial<PageBlock>) {
    const b = await apiFetch<PageBlock>('POST', `/structuur/${projectId}/nodes/${nodeId}/blocks`, data)
    pageBlocks.value.push(b)
    allProjectBlocks.value.push({ ...b })
    return b
  }
  async function updateBlock(projectId: string, nodeId: string, blockId: string, data: Partial<PageBlock>) {
    const b = await apiFetch<PageBlock>('PUT', `/structuur/${projectId}/nodes/${nodeId}/blocks/${blockId}`, data)
    const idx = pageBlocks.value.findIndex(x => x.id === blockId)
    if (idx >= 0) pageBlocks.value[idx] = b
    const allIdx = allProjectBlocks.value.findIndex(x => x.id === blockId)
    if (allIdx >= 0) allProjectBlocks.value[allIdx] = { ...b }
    // Kopieën van een herbruikbaar origineel lopen server-side mee; lokaal spiegelen.
    if (!b.reusableBlockId) {
      for (const copy of [...pageBlocks.value, ...allProjectBlocks.value]) {
        if (copy.reusableBlockId !== b.id) continue
        if (b.isReusable) {
          for (const f of SHARED_BLOCK_FIELDS) (copy as unknown as Record<string, unknown>)[f] = b[f]
        } else {
          copy.reusableBlockId = null
          copy.isReusable = false
        }
      }
    }
    return b
  }
  async function deleteBlock(projectId: string, nodeId: string, blockId: string) {
    await apiFetch<void>('DELETE', `/structuur/${projectId}/nodes/${nodeId}/blocks/${blockId}`)
    pageBlocks.value = pageBlocks.value.filter(b => b.id !== blockId)
    allProjectBlocks.value = allProjectBlocks.value.filter(b => b.id !== blockId)
    for (const copy of [...pageBlocks.value, ...allProjectBlocks.value]) {
      if (copy.reusableBlockId === blockId) { copy.reusableBlockId = null; copy.isReusable = false }
    }
  }
  async function reorderBlocks(projectId: string, nodeId: string, blockIds: string[]) {
    await apiFetch<void>('PUT', `/structuur/${projectId}/nodes/${nodeId}/blocks-reorder`, { blockIds })
    // Reorder locally
    for (let i = 0; i < blockIds.length; i++) {
      const idx = pageBlocks.value.findIndex(b => b.id === blockIds[i])
      if (idx >= 0) pageBlocks.value[idx].sortOrder = i
    }
  }

  // --- Changelog ---
  async function fetchChangeLog(projectId: string) {
    changeLog.value = await apiFetch<ChangeLogEntry[]>('GET', `/structuur/${projectId}/changelog`)
  }

  // --- Fase 2: Menu items ---

  async function fetchMenu(projectId: string) {
    const menu = await apiFetch<ProjectMenu | null>('GET', `/structuur/${projectId}/menu`)
    menuProjectId.value = projectId
    if (menu) {
      menuItems.value = menu.items.map(i => ({ ...i, expanded: false }))
    } else {
      // Nog nooit een menu gemaakt: begin met de navigatie uit de structuur.
      seedMenuFromStructure(projectId)
    }
  }

  // Menu opbouwen uit de pagina-hiërarchie: pagina's met "in hoofdmenu",
  // onder de dichtstbijzijnde bovenliggende pagina die ook in het menu staat.
  function seedMenuFromStructure(projectId: string) {
    menuProjectId.value = projectId
    const byNode = new Map<string, MenuItem>()
    const items: MenuItem[] = []
    const nodeMap = new Map(siteNodes.value.map(n => [n.id, n]))
    for (const n of flatSortedNodes.value) {
      if (n.isParked || !n.isInMainNav) continue
      let parent = n.parentId ? nodeMap.get(n.parentId) : undefined
      while (parent && !byNode.has(parent.id)) parent = parent.parentId ? nodeMap.get(parent.parentId) : undefined
      const parentId = parent ? byNode.get(parent.id)!.id : null
      const item: MenuItem = {
        id: genMenuId(), siteNodeId: n.id, parentId,
        sortOrder: items.filter(i => i.parentId === parentId).length, expanded: false,
      }
      items.push(item)
      byNode.set(n.id, item)
    }
    menuItems.value = items
    // Een leeg menu niet opslaan: dan wordt het later opnieuw uit de structuur opgebouwd.
    if (items.length > 0) persistMenu()
  }

  let menuTimer: ReturnType<typeof setTimeout> | null = null
  function persistMenu() {
    const projectId = menuProjectId.value
    if (!projectId) return
    if (menuTimer) clearTimeout(menuTimer)
    menuTimer = setTimeout(() => {
      const items: ProjectMenuItem[] = menuItems.value.map(({ id, siteNodeId, parentId, sortOrder, customLabel }) => ({
        id, siteNodeId, parentId, sortOrder, ...(customLabel ? { customLabel } : {}),
      }))
      apiFetch<ProjectMenu>('PUT', `/structuur/${projectId}/menu`, { items }).catch(() => {})
    }, 400)
  }

  // Alle directe kinderen van een parent, op sortOrder.
  function menuChildren(parentId: string | null) {
    return menuItems.value
      .filter(m => m.parentId === parentId)
      .sort((a, b) => a.sortOrder - b.sortOrder)
  }

  // Hercompacteer sortOrder (0,1,2,...) binnen één parent-niveau.
  function recompact(parentId: string | null) {
    menuChildren(parentId).forEach((m, i) => { m.sortOrder = i })
  }

  // Verzamel een item + zijn volledige subtree (id's).
  function collectSubtree(id: string): string[] {
    const result = [id]
    for (const child of menuItems.value.filter(m => m.parentId === id)) {
      result.push(...collectSubtree(child.id))
    }
    return result
  }

  function addMenuItem(siteNodeId: string, parentId: string | null = null): MenuItem {
    const item: MenuItem = {
      id: genMenuId(),
      siteNodeId,
      parentId,
      sortOrder: menuChildren(parentId).length,
      expanded: false,
    }
    menuItems.value.push(item)
    persistMenu()
    return item
  }

  function removeMenuItem(id: string) {
    const item = menuItems.value.find(m => m.id === id)
    if (!item) return
    const parentId = item.parentId
    const toRemove = new Set(collectSubtree(id))
    menuItems.value = menuItems.value.filter(m => !toRemove.has(m.id))
    recompact(parentId)
    persistMenu()
  }

  function updateMenuItem(id: string, data: Partial<MenuItem>) {
    const item = menuItems.value.find(m => m.id === id)
    if (item) Object.assign(item, data)
    persistMenu()
  }

  function toggleMenuItemExpanded(id: string) {
    const item = menuItems.value.find(m => m.id === id)
    if (item) item.expanded = !item.expanded
  }

  // Verplaats een item (incl. subtree) naar een nieuwe parent op een gegeven
  // positie tussen zijn nieuwe siblings. Beschermt tegen cyclus, sleept de
  // hele subtree mee en hercompacteert sortOrder in oude én nieuwe parent.
  function moveMenuItem(id: string, newParentId: string | null, newIndex: number) {
    const item = menuItems.value.find(m => m.id === id)
    if (!item) return

    // Cyclusbescherming: een item kan niet onder zijn eigen (klein)kind hangen.
    const subtree = new Set(collectSubtree(id))
    if (newParentId !== null && subtree.has(newParentId)) return

    const oldParentId = item.parentId

    // Siblings in de doel-parent (zonder het item zelf), op huidige volgorde.
    const siblings = menuChildren(newParentId).filter(m => m.id !== id)
    const clampedIndex = Math.max(0, Math.min(newIndex, siblings.length))

    item.parentId = newParentId
    siblings.splice(clampedIndex, 0, item)
    siblings.forEach((m, i) => { m.sortOrder = i })

    // Oude parent opnieuw netjes maken (alleen relevant bij parent-wissel).
    if (oldParentId !== newParentId) recompact(oldParentId)
    persistMenu()
  }

  // Inspringen: item wordt subitem van zijn vorige sibling (achteraan).
  function indentMenuItem(id: string) {
    const item = menuItems.value.find(m => m.id === id)
    if (!item) return
    const siblings = menuChildren(item.parentId)
    const pos = siblings.findIndex(m => m.id === id)
    if (pos <= 0) return
    const newParent = siblings[pos - 1]
    moveMenuItem(id, newParent.id, menuChildren(newParent.id).length)
  }

  // Uitspringen: item komt direct ná zijn huidige parent te staan.
  function outdentMenuItem(id: string) {
    const item = menuItems.value.find(m => m.id === id)
    if (!item || !item.parentId) return
    const parent = menuItems.value.find(m => m.id === item.parentId)
    if (!parent) return
    const parentPos = menuChildren(parent.parentId).findIndex(m => m.id === parent.id)
    moveMenuItem(id, parent.parentId, parentPos + 1)
  }

  function clearMenu() {
    menuItems.value = []
    persistMenu()
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
    siteNodes, pageBlocks, allProjectBlocks, warnings, changeLog,
    loading, selectedNodeId, menuItems, menuProjectId,
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
    fetchNodes, createNode, updateNode, deleteNode, duplicateNode, moveNode, mergeNode,
    fetchMenu, seedMenuFromStructure, indentMenuItem, outdentMenuItem, scheduleWarnings,
    importNodes, importFlatNodes, fetchWarnings,
    // Fase 2 — menu (in-memory)
    menuChildren, addMenuItem, removeMenuItem, updateMenuItem,
    toggleMenuItemExpanded, moveMenuItem, clearMenu,
    // Fase 3
    fetchBlocks, fetchAllBlocks, createBlock, updateBlock, deleteBlock, reorderBlocks,
    // Changelog
    fetchChangeLog,
    // Bulk
    loadAll,
  }
})
