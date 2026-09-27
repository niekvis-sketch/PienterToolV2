// ============================================================
// Structuur Routes – 3-fasen websitestructuur module
// Fase 1: User Stories & Klantvragen
// Fase 2: Sitestructuur & Navigatie  
// Fase 3: Pagina-indeling (Blokken)
// ============================================================
import { Router, Request, Response } from 'express'
import { readCollection, writeCollection } from '../storage'
import { genId, now, ok, err } from '../helpers'
import { computeStructureWarnings } from '../../../shared/structuurWarnings'
import type {
  UserStory, ClientQuestion, Fase1Summary,
  SiteNode, SiteNodeType, SiteNodeGoal,
  PageBlock, BlockType,
  StructuurProgress, ChangeLogEntry, StructureWarning,
  StructureImport, StructureNode, StructureBlockNode,
  Project, ProjectMenu, ProjectMenuItem
} from '../../../shared/types'

export const structuurRouter = Router()

// ---------- Storage helpers ----------
function getStories(): UserStory[] { return readCollection<UserStory>('userStories') }
function saveStories(d: UserStory[]) { writeCollection('userStories', d) }
function getQuestions(): ClientQuestion[] { return readCollection<ClientQuestion>('clientQuestions') }
function saveQuestions(d: ClientQuestion[]) { writeCollection('clientQuestions', d) }
function getSummaries(): Fase1Summary[] { return readCollection<Fase1Summary>('fase1Summaries') }
function saveSummaries(d: Fase1Summary[]) { writeCollection('fase1Summaries', d) }
function getSiteNodes(): SiteNode[] { return readCollection<SiteNode>('siteNodes') }
function saveSiteNodes(d: SiteNode[]) { writeCollection('siteNodes', d) }
function getBlocks(): PageBlock[] { return readCollection<PageBlock>('pageBlocks') }
function saveBlocks(d: PageBlock[]) { writeCollection('pageBlocks', d) }
function getProgress(): StructuurProgress[] { return readCollection<StructuurProgress>('structuurProgress') }
function saveProgress(d: StructuurProgress[]) { writeCollection('structuurProgress', d) }
function getChangeLog(): ChangeLogEntry[] { return readCollection<ChangeLogEntry>('changeLog') }
function saveChangeLog(d: ChangeLogEntry[]) { writeCollection('changeLog', d) }
function getProjects(): Project[] { return readCollection<Project>('projects') }
function getMenus(): ProjectMenu[] { return readCollection<ProjectMenu>('menus') }
function saveMenus(d: ProjectMenu[]) { writeCollection('menus', d) }

// Menu-items opruimen nadat pagina's verdwenen zijn. `remap` vervangt een
// verwijderde pagina door een andere (samenvoegen) in plaats van het item te schrappen.
function pruneMenu(projectId: string, removedIds: string[], remap: Record<string, string> = {}) {
  const menus = getMenus()
  const menu = menus.find(m => m.projectId === projectId)
  if (!menu) return
  const removed = new Set(removedIds)
  const present = new Set(menu.items.filter(i => !removed.has(i.siteNodeId)).map(i => i.siteNodeId))
  const dropped = new Set<string>()
  const items: ProjectMenuItem[] = []
  for (const item of menu.items) {
    if (!removed.has(item.siteNodeId)) { items.push(item); continue }
    const target = remap[item.siteNodeId]
    if (target && !present.has(target)) {
      items.push({ ...item, siteNodeId: target })
      present.add(target)
    } else {
      dropped.add(item.id)
    }
  }
  // Kinderen van geschrapte items schuiven een niveau op.
  for (const item of items) {
    let parent = item.parentId
    while (parent && dropped.has(parent)) parent = menu.items.find(i => i.id === parent)?.parentId ?? null
    item.parentId = parent
  }
  menu.items = items
  menu.updatedAt = now()
  saveMenus(menus)
}

// Hergebruikte kopieën loskoppelen als hun origineel verdwijnt.
function detachCopies(blocks: PageBlock[], originalIds: Set<string>) {
  for (const b of blocks) {
    if (b.reusableBlockId && originalIds.has(b.reusableBlockId)) {
      b.reusableBlockId = null
      b.isReusable = false
    }
  }
}

// Inhoudsvelden die een hergebruikt blok van zijn origineel overneemt.
const SHARED_BLOCK_FIELDS = [
  'name', 'type', 'goal', 'targetUser', 'contentDescription', 'componentPattern',
  'notesContent', 'notesSeo', 'notesDesign',
] as const

// ---------- Changelog helper ----------
function addLogEntry(projectId: string, entry: Omit<ChangeLogEntry, 'id' | 'projectId' | 'timestamp'>) {
  const log = getChangeLog()
  log.push({ id: genId(), projectId, timestamp: now(), ...entry })
  saveChangeLog(log)
}

// ===================== PROGRESS =====================
structuurRouter.get('/:projectId/progress', (req: Request, res: Response) => {
  const { projectId } = req.params
  let progress = getProgress().find(p => p.projectId === projectId)
  if (!progress) {
    progress = {
      id: genId(), projectId, currentFase: 1,
      fase1Complete: false, fase2Complete: false, fase3Complete: false,
      updatedAt: now()
    }
    const all = getProgress()
    all.push(progress)
    saveProgress(all)
  }
  res.json(ok(progress))
})

structuurRouter.put('/:projectId/progress', (req: Request, res: Response) => {
  const { projectId } = req.params
  const all = getProgress()
  const idx = all.findIndex(p => p.projectId === projectId)
  if (idx < 0) return res.status(404).json(err('Progress niet gevonden'))
  all[idx] = { ...all[idx], ...req.body, id: all[idx].id, projectId, updatedAt: now() }
  saveProgress(all)
  res.json(ok(all[idx]))
})

// ===================== FASE 1: USER STORIES =====================
structuurRouter.get('/:projectId/stories', (req: Request, res: Response) => {
  res.json(ok(getStories().filter(s => s.projectId === req.params.projectId)))
})

structuurRouter.post('/:projectId/stories', (req: Request, res: Response) => {
  const stories = getStories()
  const story: UserStory = {
    id: genId(),
    projectId: req.params.projectId,
    title: req.body.title || '',
    asA: req.body.asA || '',
    iWant: req.body.iWant || '',
    soThat: req.body.soThat || '',
    sourceId: req.body.sourceId || null,
    tags: req.body.tags || [],
    createdAt: now()
  }
  stories.push(story)
  saveStories(stories)
  res.json(ok(story))
})

structuurRouter.put('/:projectId/stories/:storyId', (req: Request, res: Response) => {
  const stories = getStories()
  const idx = stories.findIndex(s => s.id === req.params.storyId && s.projectId === req.params.projectId)
  if (idx < 0) return res.status(404).json(err('User story niet gevonden'))
  stories[idx] = { ...stories[idx], ...req.body, id: stories[idx].id, projectId: stories[idx].projectId }
  saveStories(stories)
  res.json(ok(stories[idx]))
})

structuurRouter.delete('/:projectId/stories/:storyId', (req: Request, res: Response) => {
  let stories = getStories()
  stories = stories.filter(s => !(s.id === req.params.storyId && s.projectId === req.params.projectId))
  saveStories(stories)
  res.json(ok({ deleted: true }))
})

// ===================== FASE 1: CLIENT QUESTIONS =====================
structuurRouter.get('/:projectId/questions', (req: Request, res: Response) => {
  res.json(ok(getQuestions().filter(q => q.projectId === req.params.projectId)))
})

structuurRouter.post('/:projectId/questions', (req: Request, res: Response) => {
  const questions = getQuestions()
  const q: ClientQuestion = {
    id: genId(),
    projectId: req.params.projectId,
    userStoryId: req.body.userStoryId || null,
    question: req.body.question || '',
    answer: req.body.answer || '',
    status: req.body.status || 'open',
    group: req.body.group || 'content',
    impactOnStructure: req.body.impactOnStructure || '',
    createdAt: now()
  }
  questions.push(q)
  saveQuestions(questions)
  res.json(ok(q))
})

structuurRouter.put('/:projectId/questions/:questionId', (req: Request, res: Response) => {
  const questions = getQuestions()
  const idx = questions.findIndex(q => q.id === req.params.questionId && q.projectId === req.params.projectId)
  if (idx < 0) return res.status(404).json(err('Vraag niet gevonden'))
  questions[idx] = { ...questions[idx], ...req.body, id: questions[idx].id, projectId: questions[idx].projectId }
  saveQuestions(questions)
  res.json(ok(questions[idx]))
})

structuurRouter.delete('/:projectId/questions/:questionId', (req: Request, res: Response) => {
  let questions = getQuestions()
  questions = questions.filter(q => !(q.id === req.params.questionId && q.projectId === req.params.projectId))
  saveQuestions(questions)
  res.json(ok({ deleted: true }))
})

// ---- Generate questions from user story (AI mock) ----
structuurRouter.post('/:projectId/stories/:storyId/generate-questions', (req: Request, res: Response) => {
  const story = getStories().find(s => s.id === req.params.storyId && s.projectId === req.params.projectId)
  if (!story) return res.status(404).json(err('User story niet gevonden'))

  // Mock AI: genereer slimme vragen op basis van de user story
  const templates: Array<{ question: string; group: ClientQuestion['group'] }> = [
    { question: `Welke informatie verwacht "${story.asA}" precies te vinden over "${story.iWant}"?`, group: 'content' },
    { question: `Moet "${story.iWant}" direct bereikbaar zijn via het hoofdmenu, of mag dit dieper in de structuur?`, group: 'navigatie' },
    { question: `Is deze behoefte relevant voor alle doelgroepen of alleen voor "${story.asA}"?`, group: 'doelgroep' },
    { question: `Moet de pagina over "${story.iWant}" vooral informeren, overtuigen of converteren?`, group: 'conversie' },
    { question: `Is "${story.iWant}" een losse pagina of onderdeel van een bestaande pagina?`, group: 'navigatie' },
    { question: `Welk beeldmateriaal is nodig om "${story.iWant}" goed over te brengen?`, group: 'beeldmateriaal' },
    { question: `Zijn er specifieke zoektermen waarmee "${story.asA}" zoekt naar "${story.iWant}"?`, group: 'seo' },
    { question: `Welke functionaliteit is nodig voor "${story.iWant}" (bijv. formulier, filter, zoekfunctie)?`, group: 'functionaliteit' },
  ]

  const questions = getQuestions()
  const newQuestions: ClientQuestion[] = templates.map(t => ({
    id: genId(),
    projectId: req.params.projectId,
    userStoryId: story.id,
    question: t.question,
    answer: '',
    status: 'open' as const,
    group: t.group,
    impactOnStructure: '',
    createdAt: now()
  }))
  questions.push(...newQuestions)
  saveQuestions(questions)
  res.json(ok(newQuestions))
})

// ===================== FASE 1: SUMMARY =====================
structuurRouter.get('/:projectId/fase1-summary', (req: Request, res: Response) => {
  const summary = getSummaries().find(s => s.projectId === req.params.projectId)
  res.json(ok(summary || null))
})

structuurRouter.post('/:projectId/fase1-summary/generate', (req: Request, res: Response) => {
  const { projectId } = req.params
  const questions = getQuestions().filter(q => q.projectId === projectId)
  const stories = getStories().filter(s => s.projectId === projectId)

  // Mock AI: genereer samenvatting op basis van beantwoorde vragen en stories
  const answered = questions.filter(q => q.status === 'answered')
  const insights = questions.filter(q => q.status === 'insight')
  const assumptions = questions.filter(q => q.status === 'assumption')
  const openQuestions = questions.filter(q => q.status === 'open')

  const mainTopics = [...new Set(answered.map(q => q.group))].map(g => {
    const groupQuestions = answered.filter(q => q.group === g)
    return `${g}: ${groupQuestions.length} beantwoorde vragen`
  })

  const summary: Fase1Summary = {
    id: genId(),
    projectId,
    mainTopics: mainTopics.length > 0 ? mainTopics : ['Nog geen beantwoorde vragen beschikbaar'],
    uncertainTopics: assumptions.map(a => a.question.substring(0, 80)),
    seoImportantPages: insights.filter(i => i.group === 'seo').map(i => i.impactOnStructure || i.answer.substring(0, 60)),
    bundleOpportunities: insights.filter(i => i.impactOnStructure).map(i => i.impactOnStructure),
    pendingFromClient: openQuestions.map(q => q.question.substring(0, 80)),
    generatedAt: now()
  }

  // Upsert
  const summaries = getSummaries()
  const idx = summaries.findIndex(s => s.projectId === projectId)
  if (idx >= 0) summaries[idx] = summary
  else summaries.push(summary)
  saveSummaries(summaries)

  res.json(ok(summary))
})

// ===================== FASE 2: SITE NODES =====================
structuurRouter.get('/:projectId/nodes', (req: Request, res: Response) => {
  res.json(ok(getSiteNodes().filter(n => n.projectId === req.params.projectId)))
})

structuurRouter.post('/:projectId/nodes', (req: Request, res: Response) => {
  const nodes = getSiteNodes()
  const project = getProjects().find(p => p.id === req.params.projectId)
  const domain = project?.domainNew || 'example.com'

  // Bereken fullUrl op basis van parent
  const parentId = req.body.parentId || null
  const slug = req.body.slug || ''
  const fullUrl = buildFullUrl(nodes, parentId, slug, domain, req.params.projectId)

  // Bereken sortOrder
  const siblings = nodes.filter(n => n.projectId === req.params.projectId && n.parentId === parentId)
  const sortOrder = req.body.sortOrder ?? (siblings.length > 0 ? Math.max(...siblings.map(s => s.sortOrder)) + 1 : 0)

  // Bereken level
  const level = parentId ? (nodes.find(n => n.id === parentId)?.level ?? 0) + 1 : 0

  const node: SiteNode = {
    id: genId(),
    projectId: req.params.projectId,
    parentId,
    title: req.body.title || 'Nieuwe pagina',
    slug,
    fullUrl,
    level,
    sortOrder,
    type: req.body.type || 'page',
    goal: req.body.goal || null,
    targetAudience: req.body.targetAudience || '',
    reasonExists: req.body.reasonExists || '',
    isInMainNav: req.body.isInMainNav ?? true,
    isDetailTemplate: req.body.isDetailTemplate ?? false,
    isParked: req.body.isParked ?? false,
    priority: req.body.priority || 'middel',
    label: req.body.label || 'nieuw',
    contentStatus: req.body.contentStatus || 'niet-gestart',
    focusTopic: req.body.focusTopic || '',
    metaTitle: req.body.metaTitle || '',
    metaDescription: req.body.metaDescription || '',
    redirectsFrom: req.body.redirectsFrom || [],
    needsRedirect: req.body.needsRedirect ?? false,
    relatedUserStoryIds: req.body.relatedUserStoryIds || [],
    openQuestionIds: req.body.openQuestionIds || [],
    notes: req.body.notes || '',
    requirements: req.body.requirements || '',
    bron: req.body.bron || 'handmatig',
    aanname: req.body.aanname ?? false,
    canvasX: req.body.canvasX ?? null,
    createdAt: now(),
    updatedAt: now()
  }

  nodes.push(node)
  saveSiteNodes(nodes)

  addLogEntry(req.params.projectId, {
    action: 'added', entityType: 'siteNode', entityId: node.id,
    entityTitle: node.title, details: `Pagina toegevoegd: ${node.fullUrl}`
  })

  res.json(ok(node))
})

structuurRouter.put('/:projectId/nodes/:nodeId', (req: Request, res: Response) => {
  const nodes = getSiteNodes()
  const project = getProjects().find(p => p.id === req.params.projectId)
  const domain = project?.domainNew || 'example.com'
  const idx = nodes.findIndex(n => n.id === req.params.nodeId && n.projectId === req.params.projectId)
  if (idx < 0) return res.status(404).json(err('Node niet gevonden'))

  const oldNode = { ...nodes[idx] }
  const oldUrl = oldNode.fullUrl

  // Update node
  nodes[idx] = {
    ...nodes[idx], ...req.body,
    id: nodes[idx].id, projectId: nodes[idx].projectId, createdAt: nodes[idx].createdAt,
    updatedAt: now()
  }

  // Herbereken URL als slug of parent veranderd is
  const slugChanged = req.body.slug !== undefined && req.body.slug !== oldNode.slug
  const parentChanged = req.body.parentId !== undefined && req.body.parentId !== oldNode.parentId

  if (slugChanged || parentChanged) {
    const parentId = nodes[idx].parentId
    const slug = nodes[idx].slug
    nodes[idx].fullUrl = buildFullUrl(nodes, parentId, slug, domain, req.params.projectId)
    if (parentChanged) {
      nodes[idx].level = parentId ? (nodes.find(n => n.id === parentId)?.level ?? 0) + 1 : 0
    }
    // Herbereken children URLs recursief
    recalcChildUrls(nodes, nodes[idx].id, domain, req.params.projectId)
  }

  saveSiteNodes(nodes)

  // Log wijzigingen
  if (slugChanged || parentChanged) {
    const newUrl = nodes[idx].fullUrl
    addLogEntry(req.params.projectId, {
      action: 'url-changed', entityType: 'siteNode', entityId: nodes[idx].id,
      entityTitle: nodes[idx].title, details: `URL gewijzigd van ${oldUrl} naar ${newUrl}`,
      oldValue: oldUrl, newValue: newUrl
    })
  } else if (req.body.title && req.body.title !== oldNode.title) {
    addLogEntry(req.params.projectId, {
      action: 'renamed', entityType: 'siteNode', entityId: nodes[idx].id,
      entityTitle: nodes[idx].title, details: `Hernoemd van "${oldNode.title}" naar "${nodes[idx].title}"`,
      oldValue: oldNode.title, newValue: nodes[idx].title
    })
  }

  res.json(ok(nodes[idx]))
})

structuurRouter.delete('/:projectId/nodes/:nodeId', (req: Request, res: Response) => {
  let nodes = getSiteNodes()
  const node = nodes.find(n => n.id === req.params.nodeId && n.projectId === req.params.projectId)
  if (!node) return res.status(404).json(err('Node niet gevonden'))

  // Verwijder node en alle children recursief
  const idsToRemove = collectChildIds(nodes, node.id, req.params.projectId)
  idsToRemove.push(node.id)

  addLogEntry(req.params.projectId, {
    action: 'deleted', entityType: 'siteNode', entityId: node.id,
    entityTitle: node.title, details: `Pagina verwijderd: ${node.title} (${idsToRemove.length} pagina's inclusief children)`
  })

  nodes = nodes.filter(n => !idsToRemove.includes(n.id))
  saveSiteNodes(nodes)

  // Verwijder bijbehorende blocks
  let blocks = getBlocks()
  const removedBlockIds = new Set(blocks.filter(b => idsToRemove.includes(b.siteNodeId)).map(b => b.id))
  blocks = blocks.filter(b => !idsToRemove.includes(b.siteNodeId))
  detachCopies(blocks, removedBlockIds)
  saveBlocks(blocks)
  pruneMenu(req.params.projectId, idsToRemove)

  res.json(ok({ deleted: true, removedIds: idsToRemove }))
})

// ---- Merge node: pagina A opgaan in pagina B ----
// De bronpagina verdwijnt; haar blokken (met een naam die B nog niet heeft) en
// subpagina's gaan naar B, en haar URL wordt een redirect naar B.
structuurRouter.post('/:projectId/nodes/:nodeId/merge', (req: Request, res: Response) => {
  const { projectId, nodeId } = req.params
  const intoNodeId: string | undefined = req.body.intoNodeId
  const nodes = getSiteNodes()
  const project = getProjects().find(p => p.id === projectId)
  const domain = project?.domainNew || 'example.com'
  const source = nodes.find(n => n.id === nodeId && n.projectId === projectId)
  const target = nodes.find(n => n.id === intoNodeId && n.projectId === projectId)
  if (!source || !target) return res.status(404).json(err('Pagina niet gevonden'))
  if (source.id === target.id) return res.status(400).json(err('Een pagina kan niet met zichzelf samengevoegd worden'))
  if (collectChildIds(nodes, source.id, projectId).includes(target.id)) {
    return res.status(400).json(err('Een pagina kan niet opgaan in een eigen subpagina'))
  }

  // Blokken verhuizen
  const blocks = getBlocks()
  const targetBlocks = blocks.filter(b => b.siteNodeId === target.id)
  const existingNames = new Set(targetBlocks.map(b => b.name.trim().toLowerCase()))
  let sortOrder = targetBlocks.length ? Math.max(...targetBlocks.map(b => b.sortOrder)) + 1 : 0
  const droppedBlockIds = new Set<string>()
  let movedBlocks = 0
  for (const b of [...blocks.filter(b => b.siteNodeId === source.id)].sort((a, c) => a.sortOrder - c.sortOrder)) {
    if (existingNames.has(b.name.trim().toLowerCase())) { droppedBlockIds.add(b.id); continue }
    b.siteNodeId = target.id
    b.sortOrder = sortOrder++
    existingNames.add(b.name.trim().toLowerCase())
    movedBlocks++
  }
  const keptBlocks = blocks.filter(b => !droppedBlockIds.has(b.id))
  detachCopies(keptBlocks, droppedBlockIds)
  saveBlocks(keptBlocks)

  // Subpagina's verhuizen
  const targetChildren = nodes.filter(n => n.parentId === target.id)
  let childOrder = targetChildren.length ? Math.max(...targetChildren.map(n => n.sortOrder)) + 1 : 0
  for (const child of nodes.filter(n => n.parentId === source.id)) {
    child.parentId = target.id
    child.sortOrder = childOrder++
  }

  // Oude URL van de bron wordt een redirect naar het doel
  const sourcePath = urlPath(source.fullUrl)
  const redirects = new Set([...(target.redirectsFrom || []), ...(source.redirectsFrom || []), sourcePath])
  redirects.delete(urlPath(target.fullUrl))
  target.redirectsFrom = [...redirects]
  target.needsRedirect = target.redirectsFrom.length > 0
  target.updatedAt = now()

  const remaining = nodes.filter(n => n.id !== source.id)
  recalcChildUrls(remaining, target.id, domain, projectId)
  saveSiteNodes(remaining)
  pruneMenu(projectId, [source.id], { [source.id]: target.id })

  addLogEntry(projectId, {
    action: 'merged', entityType: 'siteNode', entityId: target.id,
    entityTitle: target.title,
    details: `"${source.title}" samengevoegd met "${target.title}" (${movedBlocks} blokken verplaatst, ${sourcePath} verwijst nu door)`,
    oldValue: source.title, newValue: target.title
  })

  res.json(ok({ node: target, removedId: source.id, movedBlocks }))
})

// ---- Duplicate node ----
structuurRouter.post('/:projectId/nodes/:nodeId/duplicate', (req: Request, res: Response) => {
  const nodes = getSiteNodes()
  const original = nodes.find(n => n.id === req.params.nodeId && n.projectId === req.params.projectId)
  if (!original) return res.status(404).json(err('Node niet gevonden'))

  const duplicate: SiteNode = {
    ...original,
    id: genId(),
    title: `${original.title} (kopie)`,
    slug: `${original.slug}-kopie`,
    fullUrl: original.fullUrl.replace(original.slug, `${original.slug}-kopie`),
    createdAt: now(),
    updatedAt: now()
  }
  nodes.push(duplicate)
  saveSiteNodes(nodes)

  addLogEntry(req.params.projectId, {
    action: 'added', entityType: 'siteNode', entityId: duplicate.id,
    entityTitle: duplicate.title, details: `Gedupliceerd van "${original.title}"`
  })

  res.json(ok(duplicate))
})

// ---- Move node (change parent + recalc) ----
structuurRouter.put('/:projectId/nodes/:nodeId/move', (req: Request, res: Response) => {
  const nodes = getSiteNodes()
  const project = getProjects().find(p => p.id === req.params.projectId)
  const domain = project?.domainNew || 'example.com'
  const idx = nodes.findIndex(n => n.id === req.params.nodeId && n.projectId === req.params.projectId)
  if (idx < 0) return res.status(404).json(err('Node niet gevonden'))

  const oldUrl = nodes[idx].fullUrl
  const newParentId = req.body.parentId ?? null
  const newSortOrder = req.body.sortOrder ?? nodes[idx].sortOrder

  nodes[idx].parentId = newParentId
  nodes[idx].sortOrder = newSortOrder
  nodes[idx].level = newParentId ? (nodes.find(n => n.id === newParentId)?.level ?? 0) + 1 : 0
  nodes[idx].fullUrl = buildFullUrl(nodes, newParentId, nodes[idx].slug, domain, req.params.projectId)
  if (req.body.canvasX !== undefined) nodes[idx].canvasX = req.body.canvasX
  nodes[idx].updatedAt = now()

  // Herbereken children URLs
  recalcChildUrls(nodes, nodes[idx].id, domain, req.params.projectId)
  saveSiteNodes(nodes)

  const childCount = collectChildIds(nodes, nodes[idx].id, req.params.projectId).length
  addLogEntry(req.params.projectId, {
    action: 'moved', entityType: 'siteNode', entityId: nodes[idx].id,
    entityTitle: nodes[idx].title,
    details: `Verplaatst: ${oldUrl} → ${nodes[idx].fullUrl} (${childCount} subpagina's mee verplaatst)`,
    oldValue: oldUrl, newValue: nodes[idx].fullUrl
  })

  res.json(ok({ node: nodes[idx], childrenAffected: childCount }))
})

// ---- Import structure (Miro/spreadsheet format) ----
structuurRouter.post('/:projectId/nodes/import', (req: Request, res: Response) => {
  const { projectId } = req.params
  const project = getProjects().find(p => p.id === projectId)
  if (!project) return res.status(404).json(err('Project niet gevonden'))
  const domain = project.domainNew || 'example.com'

  const importData: StructureImport = req.body
  const existingNodes = getSiteNodes().filter(n => n.projectId !== projectId)
  const newNodes: SiteNode[] = []
  const newBlocks: PageBlock[] = []

  function processNode(node: StructureNode, parentId: string | null, basePath: string, level: number, sortIdx: number) {
    const slug = node.slug || ''
    const fullUrl = `https://${domain}/${basePath}${slug}`.replace(/\/+$/, '') || `https://${domain}`
    const redirectsFrom = Array.isArray(node.redirectsFrom) ? node.redirectsFrom : []
    const siteNode: SiteNode = {
      id: genId(), projectId, parentId,
      title: node.title, slug, fullUrl, level, sortOrder: sortIdx,
      type: (node.type as SiteNodeType) || 'page',
      goal: node.goal ?? null,
      targetAudience: node.targetAudience || '', reasonExists: node.reasonExists || '',
      isInMainNav: node.isInMainNav ?? level <= 1, isDetailTemplate: false, isParked: false,
      priority: 'middel', label: node.label || 'nieuw', contentStatus: 'niet-gestart',
      focusTopic: node.focusTopic || '', metaTitle: '', metaDescription: '',
      redirectsFrom, needsRedirect: redirectsFrom.length > 0,
      relatedUserStoryIds: [], openQuestionIds: [],
      notes: node.notes || '', requirements: node.requirements || '',
      createdAt: now(), updatedAt: now()
    }
    newNodes.push(siteNode)

    // Create blocks for this node if provided
    if (node.blocks && Array.isArray(node.blocks)) {
      node.blocks.forEach((b: StructureBlockNode, bIdx: number) => {
        const block: PageBlock = {
          id: genId(),
          projectId,
          siteNodeId: siteNode.id,
          sortOrder: bIdx,
          name: b.name || 'Blok',
          type: (b.type as BlockType) || 'custom',
          goal: b.goal || '',
          targetUser: '',
          contentDescription: b.contentDescription || '',
          componentPattern: b.componentPattern || '',
          isReusable: b.isReusable ?? false,
          reusableBlockId: null,
          notesContent: '',
          notesSeo: '',
          notesDesign: '',
          answersQuestionIds: [],
          forUserStoryIds: [],
          createdAt: now()
        }
        newBlocks.push(block)
      })
    }

    if (node.children) {
      const childBase = slug ? `${basePath}${slug}/` : basePath
      node.children.forEach((child, i) => processNode(child, siteNode.id, childBase, level + 1, i))
    }
  }

  importData.root.forEach((rootNode, i) => processNode(rootNode, null, '', 0, i))
  saveSiteNodes([...existingNodes, ...newNodes])

  // Save blocks (keep existing blocks from other projects)
  if (newBlocks.length > 0) {
    const existingBlocks = getBlocks().filter(b => b.projectId !== projectId)
    saveBlocks([...existingBlocks, ...getBlocks().filter(b => b.projectId === projectId), ...newBlocks])

    addLogEntry(projectId, {
      action: 'block-added', entityType: 'pageBlock', entityId: 'bulk-import',
      entityTitle: 'Import', details: `${newBlocks.length} blokken geïmporteerd vanuit structuurbestand`
    })
  }

  addLogEntry(projectId, {
    action: 'added', entityType: 'siteNode', entityId: 'bulk-import',
    entityTitle: 'Import', details: `${newNodes.length} pagina's geïmporteerd vanuit structuurbestand`
  })

  res.json(ok({ nodes: newNodes, blocks: newBlocks }))
})

// ---- Import from CSV/spreadsheet (flat list) ----
structuurRouter.post('/:projectId/nodes/import-flat', (req: Request, res: Response) => {
  const { projectId } = req.params
  const project = getProjects().find(p => p.id === projectId)
  if (!project) return res.status(404).json(err('Project niet gevonden'))
  const domain = project.domainNew || 'example.com'

  // Expect array of { title, slug, parentTitle?, level? }
  const rows: Array<{ title: string; slug: string; parentTitle?: string; level?: number }> = req.body.rows || []
  const existingNodes = getSiteNodes().filter(n => n.projectId !== projectId)
  const newNodes: SiteNode[] = []
  const titleToId: Record<string, string> = {}

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const id = genId()
    titleToId[row.title] = id
    const parentId = row.parentTitle ? (titleToId[row.parentTitle] || null) : null
    const level = row.level ?? (parentId ? 1 : 0)
    const parentNode = parentId ? newNodes.find(n => n.id === parentId) : null
    const basePath = parentNode ? parentNode.fullUrl.replace(`https://${domain}`, '').replace(/^\//, '') + '/' : ''
    const fullUrl = `https://${domain}/${basePath}${row.slug}`.replace(/\/+$/, '') || `https://${domain}`

    newNodes.push({
      id, projectId, parentId,
      title: row.title, slug: row.slug, fullUrl, level, sortOrder: i,
      type: 'page', goal: null, targetAudience: '', reasonExists: '',
      isInMainNav: level <= 1, isDetailTemplate: false, isParked: false,
      priority: 'middel', label: 'nieuw', contentStatus: 'niet-gestart',
      focusTopic: '', metaTitle: '', metaDescription: '',
      redirectsFrom: [], needsRedirect: false,
      relatedUserStoryIds: [], openQuestionIds: [],
      notes: '', createdAt: now(), updatedAt: now()
    })
  }

  saveSiteNodes([...existingNodes, ...newNodes])
  res.json(ok(newNodes))
})

// ---- Warnings / validatie ----
structuurRouter.get('/:projectId/warnings', (req: Request, res: Response) => {
  const nodes = getSiteNodes().filter(n => n.projectId === req.params.projectId)
  const warnings: StructureWarning[] = computeStructureWarnings(nodes)
  res.json(ok(warnings))
})

// ===================== FASE 2: MENU =====================
structuurRouter.get('/:projectId/menu', (req: Request, res: Response) => {
  res.json(ok(getMenus().find(m => m.projectId === req.params.projectId) ?? null))
})

structuurRouter.put('/:projectId/menu', (req: Request, res: Response) => {
  const { projectId } = req.params
  const items: ProjectMenuItem[] = Array.isArray(req.body.items)
    ? req.body.items.map((i: ProjectMenuItem) => ({
        id: String(i.id), siteNodeId: String(i.siteNodeId),
        parentId: i.parentId ?? null, sortOrder: Number(i.sortOrder) || 0,
        ...(i.customLabel ? { customLabel: String(i.customLabel) } : {}),
      }))
    : []
  const menus = getMenus().filter(m => m.projectId !== projectId)
  const menu: ProjectMenu = { projectId, items, updatedAt: now() }
  saveMenus([...menus, menu])
  res.json(ok(menu))
})


// ===================== FASE 3: PAGE BLOCKS =====================

// Get ALL blocks for a project (used by Fase 3 overview)
structuurRouter.get('/:projectId/blocks', (req: Request, res: Response) => {
  const blocks = getBlocks().filter(b => b.projectId === req.params.projectId)
  blocks.sort((a, b) => a.sortOrder - b.sortOrder)
  res.json(ok(blocks))
})

structuurRouter.get('/:projectId/nodes/:nodeId/blocks', (req: Request, res: Response) => {
  const blocks = getBlocks().filter(b => b.siteNodeId === req.params.nodeId && b.projectId === req.params.projectId)
  blocks.sort((a, b) => a.sortOrder - b.sortOrder)
  res.json(ok(blocks))
})

structuurRouter.post('/:projectId/nodes/:nodeId/blocks', (req: Request, res: Response) => {
  const blocks = getBlocks()
  const nodeBlocks = blocks.filter(b => b.siteNodeId === req.params.nodeId)
  const sortOrder = req.body.sortOrder ?? nodeBlocks.length

  const block: PageBlock = {
    id: genId(),
    projectId: req.params.projectId,
    siteNodeId: req.params.nodeId,
    sortOrder,
    name: req.body.name || 'Nieuw blok',
    type: req.body.type || 'custom',
    goal: req.body.goal || '',
    targetUser: req.body.targetUser || '',
    contentDescription: req.body.contentDescription || '',
    componentPattern: req.body.componentPattern || '',
    isReusable: req.body.isReusable ?? false,
    reusableBlockId: req.body.reusableBlockId || null,
    notesContent: req.body.notesContent || '',
    notesSeo: req.body.notesSeo || '',
    notesDesign: req.body.notesDesign || '',
    answersQuestionIds: req.body.answersQuestionIds || [],
    forUserStoryIds: req.body.forUserStoryIds || [],
    createdAt: now()
  }

  blocks.push(block)
  saveBlocks(blocks)

  addLogEntry(req.params.projectId, {
    action: 'block-added', entityType: 'pageBlock', entityId: block.id,
    entityTitle: block.name, details: `Blok "${block.name}" toegevoegd aan pagina`
  })

  res.json(ok(block))
})

structuurRouter.put('/:projectId/nodes/:nodeId/blocks/:blockId', (req: Request, res: Response) => {
  const blocks = getBlocks()
  const idx = blocks.findIndex(b => b.id === req.params.blockId && b.siteNodeId === req.params.nodeId)
  if (idx < 0) return res.status(404).json(err('Blok niet gevonden'))
  blocks[idx] = { ...blocks[idx], ...req.body, id: blocks[idx].id, projectId: blocks[idx].projectId, siteNodeId: blocks[idx].siteNodeId }

  // Origineel van een herbruikbaar blok: kopieën op andere pagina's lopen mee.
  // Wordt het blok niet meer herbruikbaar, dan worden de kopieën zelfstandig.
  const updated = blocks[idx]
  if (!updated.reusableBlockId) {
    if (updated.isReusable) {
      for (const copy of blocks) {
        if (copy.reusableBlockId !== updated.id) continue
        for (const f of SHARED_BLOCK_FIELDS) (copy as unknown as Record<string, unknown>)[f] = updated[f]
      }
    } else {
      detachCopies(blocks, new Set([updated.id]))
    }
  }
  saveBlocks(blocks)
  res.json(ok(updated))
})

structuurRouter.delete('/:projectId/nodes/:nodeId/blocks/:blockId', (req: Request, res: Response) => {
  let blocks = getBlocks()
  const block = blocks.find(b => b.id === req.params.blockId)
  if (block) {
    addLogEntry(req.params.projectId, {
      action: 'block-removed', entityType: 'pageBlock', entityId: block.id,
      entityTitle: block.name, details: `Blok "${block.name}" verwijderd`
    })
  }
  blocks = blocks.filter(b => !(b.id === req.params.blockId && b.siteNodeId === req.params.nodeId))
  detachCopies(blocks, new Set([req.params.blockId]))
  saveBlocks(blocks)
  res.json(ok({ deleted: true }))
})

// ---- Reorder blocks ----
structuurRouter.put('/:projectId/nodes/:nodeId/blocks-reorder', (req: Request, res: Response) => {
  const blockIds: string[] = req.body.blockIds || []
  const blocks = getBlocks()
  for (let i = 0; i < blockIds.length; i++) {
    const idx = blocks.findIndex(b => b.id === blockIds[i])
    if (idx >= 0) blocks[idx].sortOrder = i
  }
  saveBlocks(blocks)
  res.json(ok({ reordered: true }))
})

// ---- Reusable blocks overview ----
structuurRouter.get('/:projectId/reusable-blocks', (req: Request, res: Response) => {
  const blocks = getBlocks().filter(b => b.projectId === req.params.projectId && b.isReusable)
  res.json(ok(blocks))
})

// ===================== CHANGELOG =====================
structuurRouter.get('/:projectId/changelog', (req: Request, res: Response) => {
  const log = getChangeLog().filter(e => e.projectId === req.params.projectId)
  log.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  res.json(ok(log))
})

// ===================== HELPERS =====================
/** Pad van een volledige URL, bv. "https://vanlier.nl/diensten" → "/diensten". */
function urlPath(fullUrl: string): string {
  return fullUrl.replace(/^https?:\/+[^/]+/, '') || '/'
}

function buildFullUrl(nodes: SiteNode[], parentId: string | null, slug: string, domain: string, projectId: string): string {
  if (!parentId) {
    return slug ? `https://${domain}/${slug}` : `https://${domain}`
  }
  const parent = nodes.find(n => n.id === parentId && n.projectId === projectId)
  if (!parent) return `https://${domain}/${slug}`
  // Ook oude, al kapotte URL's ("https:/domein/...") herkennen.
  const parentPath = parent.fullUrl.replace(/^https?:\/+[^/]+/, '')
  // Alleen dubbele slashes in het pad samenvoegen — niet die van "https://".
  const path = `${parentPath}/${slug}`.replace(/\/\/+/g, '/').replace(/\/$/, '')
  return `https://${domain}${path}`
}

function recalcChildUrls(nodes: SiteNode[], parentId: string, domain: string, projectId: string) {
  const children = nodes.filter(n => n.parentId === parentId && n.projectId === projectId)
  for (const child of children) {
    const idx = nodes.findIndex(n => n.id === child.id)
    if (idx >= 0) {
      nodes[idx].fullUrl = buildFullUrl(nodes, parentId, nodes[idx].slug, domain, projectId)
      nodes[idx].level = (nodes.find(n => n.id === parentId)?.level ?? 0) + 1
      recalcChildUrls(nodes, nodes[idx].id, domain, projectId)
    }
  }
}

function collectChildIds(nodes: SiteNode[], parentId: string, projectId: string): string[] {
  const children = nodes.filter(n => n.parentId === parentId && n.projectId === projectId)
  const ids: string[] = []
  for (const child of children) {
    ids.push(child.id)
    ids.push(...collectChildIds(nodes, child.id, projectId))
  }
  return ids
}

function simpleOverlap(a: string, b: string): number {
  const wordsA = new Set(a.toLowerCase().split(/\s+/))
  const wordsB = new Set(b.toLowerCase().split(/\s+/))
  const intersection = [...wordsA].filter(w => wordsB.has(w))
  const union = new Set([...wordsA, ...wordsB])
  return union.size > 0 ? intersection.length / union.size : 0
}
