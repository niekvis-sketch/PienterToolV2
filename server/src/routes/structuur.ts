// ============================================================
// Structuur Routes – 3-fasen websitestructuur module
// Fase 1: User Stories & Klantvragen
// Fase 2: Sitestructuur & Navigatie  
// Fase 3: Pagina-indeling (Blokken)
// ============================================================
import { Router, Request, Response } from 'express'
import { readCollection, writeCollection } from '../storage'
import { genId, now, ok, err } from '../helpers'
import type {
  UserStory, ClientQuestion, Fase1Summary,
  SiteNode, SiteNodeType, SiteNodeGoal,
  PageBlock, PageChecklist, BlockType,
  StructuurProgress, ChangeLogEntry, StructureWarning,
  StructureImport, StructureNode, StructureBlockNode,
  Project
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
function getChecklists(): PageChecklist[] { return readCollection<PageChecklist>('pageChecklists') }
function saveChecklists(d: PageChecklist[]) { writeCollection('pageChecklists', d) }
function getProgress(): StructuurProgress[] { return readCollection<StructuurProgress>('structuurProgress') }
function saveProgress(d: StructuurProgress[]) { writeCollection('structuurProgress', d) }
function getChangeLog(): ChangeLogEntry[] { return readCollection<ChangeLogEntry>('changeLog') }
function saveChangeLog(d: ChangeLogEntry[]) { writeCollection('changeLog', d) }
function getProjects(): Project[] { return readCollection<Project>('projects') }

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
  blocks = blocks.filter(b => !idsToRemove.includes(b.siteNodeId))
  saveBlocks(blocks)

  res.json(ok({ deleted: true, removedIds: idsToRemove }))
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
    const siteNode: SiteNode = {
      id: genId(), projectId, parentId,
      title: node.title, slug, fullUrl, level, sortOrder: sortIdx,
      type: (node.type as SiteNodeType) || 'page',
      goal: null, targetAudience: '', reasonExists: '',
      isInMainNav: level <= 1, isDetailTemplate: false, isParked: false,
      priority: 'middel', label: 'nieuw', contentStatus: 'niet-gestart',
      focusTopic: '', metaTitle: '', metaDescription: '',
      redirectsFrom: [], needsRedirect: false,
      relatedUserStoryIds: [], openQuestionIds: [],
      notes: '', createdAt: now(), updatedAt: now()
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
          componentPattern: '',
          isReusable: false,
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
  const warnings: StructureWarning[] = []

  for (const node of nodes) {
    // Te diep (> 3 niveaus)
    if (node.level > 3) {
      warnings.push({ type: 'too-deep', severity: 'warning', nodeId: node.id, message: `"${node.title}" hangt ${node.level} niveaus diep – overweeg om deze hoger te plaatsen.` })
    }
    // Geen doel
    if (!node.goal && !node.isParked) {
      warnings.push({ type: 'no-goal', severity: 'info', nodeId: node.id, message: `"${node.title}" heeft nog geen paginadoel (informeren/overtuigen/converteren).` })
    }
    // Geen focus onderwerp
    if (!node.focusTopic && !node.isParked) {
      warnings.push({ type: 'no-focus', severity: 'info', nodeId: node.id, message: `"${node.title}" heeft nog geen focus onderwerp voor SEO.` })
    }
    // Orphan (heeft parentId maar parent bestaat niet)
    if (node.parentId && !nodes.find(n => n.id === node.parentId)) {
      warnings.push({ type: 'orphan', severity: 'error', nodeId: node.id, message: `"${node.title}" verwijst naar een niet-bestaande bovenliggende pagina.` })
    }
    // Naam-slug mismatch (slug bevat woorden die helemaal niet in title voorkomen)
    if (node.slug && node.title) {
      const titleWords = node.title.toLowerCase().split(/\s+/)
      const slugWords = node.slug.replace(/-/g, ' ').toLowerCase().split(/\s+/)
      const overlap = slugWords.filter(sw => titleWords.some(tw => tw.includes(sw) || sw.includes(tw)))
      if (slugWords.length > 0 && overlap.length === 0 && !node.isDetailTemplate) {
        warnings.push({ type: 'name-slug-mismatch', severity: 'warning', nodeId: node.id, message: `De slug "${node.slug}" lijkt niet overeen te komen met de paginanaam "${node.title}".` })
      }
    }
    // Duplicate titels
    const duplicates = nodes.filter(n => n.id !== node.id && n.title.toLowerCase() === node.title.toLowerCase())
    if (duplicates.length > 0) {
      warnings.push({ type: 'duplicate', severity: 'warning', nodeId: node.id, relatedNodeId: duplicates[0].id, message: `"${node.title}" heeft dezelfde naam als een andere pagina – mogelijke overlap.` })
    }
    // Intern geformuleerde namen
    const internalPatterns = ['test', 'temp', 'draft', 'todo', 'tbd', 'xxx', 'pagina-']
    if (internalPatterns.some(p => node.title.toLowerCase().includes(p))) {
      warnings.push({ type: 'internal-name', severity: 'warning', nodeId: node.id, message: `"${node.title}" klinkt als een interne werknaam – overweeg een definitieve paginanaam.` })
    }
  }

  // Content overlap: pagina's met zeer vergelijkbare titels
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      if (simpleOverlap(nodes[i].title, nodes[j].title) > 0.6 && nodes[i].title !== nodes[j].title) {
        warnings.push({
          type: 'merge-candidate', severity: 'info', nodeId: nodes[i].id, relatedNodeId: nodes[j].id,
          message: `"${nodes[i].title}" en "${nodes[j].title}" lijken inhoudelijk overeen te komen – overweeg samenvoegen.`
        })
      }
    }
  }

  res.json(ok(warnings))
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
  saveBlocks(blocks)
  res.json(ok(blocks[idx]))
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

// ===================== FASE 3: PAGE CHECKLIST =====================
structuurRouter.get('/:projectId/nodes/:nodeId/checklist', (req: Request, res: Response) => {
  let checklist = getChecklists().find(c => c.siteNodeId === req.params.nodeId)
  if (!checklist) {
    checklist = {
      siteNodeId: req.params.nodeId,
      mainQuestionAnswered: false, logicalFlow: false, hasSocialProof: false,
      hasCta: false, contentComplete: false, hasVisuals: false,
      noDuplicateBlocks: false, noMissingEssentials: false, notes: ''
    }
  }
  res.json(ok(checklist))
})

structuurRouter.put('/:projectId/nodes/:nodeId/checklist', (req: Request, res: Response) => {
  const checklists = getChecklists()
  const idx = checklists.findIndex(c => c.siteNodeId === req.params.nodeId)
  const data: PageChecklist = {
    siteNodeId: req.params.nodeId,
    mainQuestionAnswered: req.body.mainQuestionAnswered ?? false,
    logicalFlow: req.body.logicalFlow ?? false,
    hasSocialProof: req.body.hasSocialProof ?? false,
    hasCta: req.body.hasCta ?? false,
    contentComplete: req.body.contentComplete ?? false,
    hasVisuals: req.body.hasVisuals ?? false,
    noDuplicateBlocks: req.body.noDuplicateBlocks ?? false,
    noMissingEssentials: req.body.noMissingEssentials ?? false,
    notes: req.body.notes || ''
  }
  if (idx >= 0) checklists[idx] = data
  else checklists.push(data)
  saveChecklists(checklists)
  res.json(ok(data))
})

// ===================== CHANGELOG =====================
structuurRouter.get('/:projectId/changelog', (req: Request, res: Response) => {
  const log = getChangeLog().filter(e => e.projectId === req.params.projectId)
  log.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  res.json(ok(log))
})

// ===================== HELPERS =====================
function buildFullUrl(nodes: SiteNode[], parentId: string | null, slug: string, domain: string, projectId: string): string {
  if (!parentId) {
    return slug ? `https://${domain}/${slug}` : `https://${domain}`
  }
  const parent = nodes.find(n => n.id === parentId && n.projectId === projectId)
  if (!parent) return `https://${domain}/${slug}`
  const parentPath = parent.fullUrl.replace(`https://${domain}`, '')
  return `https://${domain}${parentPath}/${slug}`.replace(/\/\/+/g, '/')
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
