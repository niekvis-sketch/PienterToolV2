// ============================================================
// Project Routes – CRUD + pages, tasks, sources, media, structuur import, audit
// ============================================================
import { Router, Request, Response } from 'express'
import { readCollection, writeCollection } from '../storage'
import { genId, now, ok, err } from '../helpers'
import type {
  Project, Page, SEOFields, Task, Source, MediaItem,
  AuditRun, AuditIssue, StructureImport, StructureNode,
  PageType, ProjectPhase
} from '../../../shared/types'
import { generateAuditIssues } from '../audit-engine'

export const projectRouter = Router()

// ---------- helpers ----------
function getProjects(): Project[] { return readCollection<Project>('projects') }
function saveProjects(p: Project[]) { writeCollection('projects', p) }
function getPages(): Page[] { return readCollection<Page>('pages') }
function savePages(p: Page[]) { writeCollection('pages', p) }
function getSeoFields(): SEOFields[] { return readCollection<SEOFields>('seoFields') }
function saveSeoFields(s: SEOFields[]) { writeCollection('seoFields', s) }
function getTasks(): Task[] { return readCollection<Task>('tasks') }
function saveTasks(t: Task[]) { writeCollection('tasks', t) }
function getSources(): Source[] { return readCollection<Source>('sources') }
function saveSources(s: Source[]) { writeCollection('sources', s) }
function getMedia(): MediaItem[] { return readCollection<MediaItem>('media') }
function saveMedia(m: MediaItem[]) { writeCollection('media', m) }
function getAuditRuns(): AuditRun[] { return readCollection<AuditRun>('auditRuns') }
function saveAuditRuns(r: AuditRun[]) { writeCollection('auditRuns', r) }
function getAuditIssues(): AuditIssue[] { return readCollection<AuditIssue>('auditIssues') }
function saveAuditIssues(i: AuditIssue[]) { writeCollection('auditIssues', i) }

// ===================== PROJECTS =====================
projectRouter.get('/', (_req: Request, res: Response) => {
  res.json(ok(getProjects()))
})

projectRouter.get('/:id', (req: Request, res: Response) => {
  const project = getProjects().find(p => p.id === req.params.id)
  if (!project) return res.status(404).json(err('Project niet gevonden'))
  res.json(ok(project))
})

projectRouter.post('/', (req: Request, res: Response) => {
  const projects = getProjects()
  const p: Project = {
    id: genId(),
    name: req.body.name || 'Nieuw project',
    clientName: req.body.clientName || '',
    domainCurrent: req.body.domainCurrent || '',
    domainNew: req.body.domainNew || '',
    languages: req.body.languages || ['nl'],
    goLiveDate: req.body.goLiveDate || null,
    createdAt: now(),
    stagingNoindex: true,
    gtmConnected: false,
    eventsDefined: false,
  }
  projects.push(p)
  saveProjects(projects)
  res.json(ok(p))
})

projectRouter.put('/:id', (req: Request, res: Response) => {
  const projects = getProjects()
  const idx = projects.findIndex(p => p.id === req.params.id)
  if (idx < 0) return res.status(404).json(err('Project niet gevonden'))
  projects[idx] = { ...projects[idx], ...req.body, id: projects[idx].id, createdAt: projects[idx].createdAt }
  saveProjects(projects)
  res.json(ok(projects[idx]))
})

projectRouter.delete('/:id', (req: Request, res: Response) => {
  let projects = getProjects()
  projects = projects.filter(p => p.id !== req.params.id)
  saveProjects(projects)
  res.json(ok({ deleted: true }))
})

// ===================== PAGES =====================
projectRouter.get('/:id/pages', (req: Request, res: Response) => {
  const projectPages = getPages().filter(p => p.projectId === req.params.id)
  res.json(ok(projectPages))
})

projectRouter.post('/:id/pages', (req: Request, res: Response) => {
  const pages = getPages()
  const page: Page = {
    id: genId(),
    projectId: req.params.id,
    title: req.body.title || 'Nieuwe pagina',
    parentId: req.body.parentId || null,
    slug: req.body.slug || '',
    fullUrl: req.body.fullUrl || '',
    type: req.body.type || 'page',
    status: req.body.status || 'draft',
    notes: req.body.notes || '',
    level: req.body.level || 0,
  }
  pages.push(page)
  savePages(pages)
  res.json(ok(page))
})

projectRouter.put('/:id/pages/:pageId', (req: Request, res: Response) => {
  const pages = getPages()
  const idx = pages.findIndex(p => p.id === req.params.pageId && p.projectId === req.params.id)
  if (idx < 0) return res.status(404).json(err('Pagina niet gevonden'))
  pages[idx] = { ...pages[idx], ...req.body, id: pages[idx].id, projectId: pages[idx].projectId }
  savePages(pages)
  res.json(ok(pages[idx]))
})

// ===================== SEO FIELDS =====================
projectRouter.get('/:id/seo', (req: Request, res: Response) => {
  const projectPages = getPages().filter(p => p.projectId === req.params.id)
  const pageIds = projectPages.map(p => p.id)
  const seo = getSeoFields().filter(s => pageIds.includes(s.pageId))
  res.json(ok(seo))
})

projectRouter.put('/:id/seo/:pageId', (req: Request, res: Response) => {
  const allSeo = getSeoFields()
  const idx = allSeo.findIndex(s => s.pageId === req.params.pageId)
  if (idx < 0) {
    // Create new
    const newSeo: SEOFields = {
      pageId: req.params.pageId,
      metaTitle: req.body.metaTitle || '',
      metaDescription: req.body.metaDescription || '',
      focusTopic: req.body.focusTopic || '',
      redirectsFrom: req.body.redirectsFrom || [],
    }
    allSeo.push(newSeo)
    saveSeoFields(allSeo)
    return res.json(ok(newSeo))
  }
  allSeo[idx] = { ...allSeo[idx], ...req.body, pageId: allSeo[idx].pageId }
  saveSeoFields(allSeo)
  res.json(ok(allSeo[idx]))
})

// ===================== STRUCTURE IMPORT =====================
projectRouter.post('/:id/structure/import', (req: Request, res: Response) => {
  const projectId = req.params.id
  const project = getProjects().find(p => p.id === projectId)
  if (!project) return res.status(404).json(err('Project niet gevonden'))

  const importData: StructureImport = req.body
  const allPages = getPages().filter(p => p.projectId !== projectId) // bewaar andere projecten
  const allSeo = getSeoFields()
  const newPages: Page[] = []
  const newSeo: SEOFields[] = []

  function processNode(node: StructureNode, parentId: string | null, basePath: string, level: number) {
    const slug = node.slug || ''
    const fullUrl = `https://${project!.domainNew}/${basePath}${slug}`.replace(/\/+$/, '') || `https://${project!.domainNew}`
    const page: Page = {
      id: genId(),
      projectId,
      title: node.title,
      parentId,
      slug,
      fullUrl,
      type: (node.type as PageType) || 'page',
      status: 'draft',
      notes: '',
      level,
    }
    newPages.push(page)

    const seo: SEOFields = {
      pageId: page.id,
      metaTitle: '',
      metaDescription: '',
      focusTopic: '',
      redirectsFrom: [],
    }
    newSeo.push(seo)

    if (node.children) {
      const childBase = slug ? `${basePath}${slug}/` : basePath
      for (const child of node.children) {
        processNode(child, page.id, childBase, level + 1)
      }
    }
  }

  for (const rootNode of importData.root) {
    processNode(rootNode, null, '', 0)
  }

  // Opslaan
  savePages([...allPages, ...newPages])
  // Filter bestaande SEO voor dit project
  const existingPageIds = newPages.map(p => p.id)
  const otherSeo = allSeo.filter(s => !existingPageIds.includes(s.pageId))
  saveSeoFields([...otherSeo, ...newSeo])

  // Smart default taken genereren
  const allTasks = getTasks().filter(t => t.projectId !== projectId)
  const newTasks: Task[] = []

  // Globale taken
  const globalTasks: Array<{ title: string; team: Task['team']; phase: ProjectPhase; description: string }> = [
    { title: 'Interview vragenlijst maken', team: 'Content', phase: 'inventarisatie', description: 'Stel vragen op om alle benodigde content te verzamelen bij de klant.' },
    { title: 'Supportanalyse en focus onderwerpen bepalen', team: 'SEO', phase: 'strategie', description: 'Analyseer zoekvolumes en bepaal focus-onderwerpen per pagina.' },
    { title: 'Domeincheck (vroeg)', team: 'SEO', phase: 'strategie', description: 'Controleer of het nieuwe domein beschikbaar is en check historie.' },
    { title: 'Redirectplan opstellen', team: 'SEO', phase: 'pre-live', description: 'Maak een compleet redirectplan van oude naar nieuwe URL\'s.' },
    { title: 'Meetbaarheid instellen', team: 'SEO', phase: 'staging', description: 'GTM, GA4, events en conversies instellen en testen.' },
    { title: 'Local environment opzetten', team: 'Dev', phase: 'development', description: 'Clone repo\'s, importeer database, configureer local development.' },
    { title: 'Blokken bouwen in thema', team: 'Dev', phase: 'development', description: 'Bouw alle benodigde WordPress blokken en templates.' },
    { title: 'Staging klaarzetten', team: 'Dev', phase: 'staging', description: 'Deploy naar staging, search/replace URLs, controleer functionaliteit.' },
    { title: 'Responsive check', team: 'Dev', phase: 'staging', description: 'Test alle pagina\'s op mobiel, tablet en desktop.' },
    { title: 'Live datum prikken', team: 'PM', phase: 'strategie', description: 'Bepaal samen met klant en team de lanceerdatum.' },
    { title: 'Klant feedbackmoment plannen', team: 'PM', phase: 'design', description: 'Plan presentatie en feedbackronde in.' },
  ]

  // Redirectplan depends on URL-structuur taken
  const urlStructuurTaskId = genId()
  newTasks.push({
    id: urlStructuurTaskId,
    projectId,
    title: 'URL-structuur definitief maken',
    description: 'Bepaal de definitieve URL-structuur op basis van de geïmporteerde sitemap.',
    team: 'UX',
    status: 'todo',
    dependsOnTaskIds: [],
    relatedPageId: null,
    dueDate: null,
    phase: 'structuur',
  })

  for (const gt of globalTasks) {
    const task: Task = {
      id: genId(),
      projectId,
      title: gt.title,
      description: gt.description,
      team: gt.team,
      status: 'todo',
      dependsOnTaskIds: gt.title === 'Redirectplan opstellen' ? [urlStructuurTaskId] : [],
      relatedPageId: null,
      dueDate: null,
      phase: gt.phase,
    }
    newTasks.push(task)
  }

  // Per top-level pagina: UX-pagina-indeling + content schrijven
  const topLevelPages = newPages.filter(p => p.level <= 1 && p.type === 'page')
  for (const page of topLevelPages) {
    newTasks.push({
      id: genId(),
      projectId,
      title: `Pagina-indeling: ${page.title}`,
      description: `Maak een wireframe/indeling voor de pagina "${page.title}".`,
      team: 'UX',
      status: 'todo',
      dependsOnTaskIds: [urlStructuurTaskId],
      relatedPageId: page.id,
      dueDate: null,
      phase: 'structuur',
    })
    newTasks.push({
      id: genId(),
      projectId,
      title: `Teksten schrijven: ${page.title}`,
      description: `Schrijf de content voor "${page.title}" op basis van interviews en briefing.`,
      team: 'Content',
      status: 'todo',
      dependsOnTaskIds: [],
      relatedPageId: page.id,
      dueDate: null,
      phase: 'content',
    })
  }

  saveTasks([...allTasks, ...newTasks])

  res.json(ok({
    pages: newPages,
    seoFields: newSeo,
    tasks: newTasks,
  }))
})

// ===================== TASKS =====================
projectRouter.get('/:id/tasks', (req: Request, res: Response) => {
  const projectTasks = getTasks().filter(t => t.projectId === req.params.id)
  res.json(ok(projectTasks))
})

projectRouter.post('/:id/tasks', (req: Request, res: Response) => {
  const tasks = getTasks()
  const task: Task = {
    id: genId(),
    projectId: req.params.id,
    title: req.body.title || 'Nieuwe taak',
    description: req.body.description || '',
    team: req.body.team || 'PM',
    status: req.body.status || 'todo',
    dependsOnTaskIds: req.body.dependsOnTaskIds || [],
    relatedPageId: req.body.relatedPageId || null,
    dueDate: req.body.dueDate || null,
    phase: req.body.phase || 'strategie',
  }
  tasks.push(task)
  saveTasks(tasks)
  res.json(ok(task))
})

projectRouter.put('/:id/tasks/:taskId', (req: Request, res: Response) => {
  const tasks = getTasks()
  const idx = tasks.findIndex(t => t.id === req.params.taskId && t.projectId === req.params.id)
  if (idx < 0) return res.status(404).json(err('Taak niet gevonden'))
  tasks[idx] = { ...tasks[idx], ...req.body, id: tasks[idx].id, projectId: tasks[idx].projectId }
  saveTasks(tasks)
  res.json(ok(tasks[idx]))
})

// ===================== SOURCES =====================
projectRouter.get('/:id/sources', (req: Request, res: Response) => {
  const projectSources = getSources().filter(s => s.projectId === req.params.id)
  res.json(ok(projectSources))
})

projectRouter.post('/:id/sources', (req: Request, res: Response) => {
  const sources = getSources()
  const source: Source = {
    id: genId(),
    projectId: req.params.id,
    type: req.body.type || 'note',
    title: req.body.title || 'Nieuwe bron',
    contentText: req.body.contentText || '',
    url: req.body.url || '',
    filePath: req.body.filePath || '',
    relatedPageIds: req.body.relatedPageIds || [],
    tags: req.body.tags || [],
    createdAt: now(),
  }
  sources.push(source)
  saveSources(sources)
  res.json(ok(source))
})

projectRouter.put('/:id/sources/:sourceId', (req: Request, res: Response) => {
  const sources = getSources()
  const idx = sources.findIndex(s => s.id === req.params.sourceId && s.projectId === req.params.id)
  if (idx < 0) return res.status(404).json(err('Bron niet gevonden'))
  sources[idx] = { ...sources[idx], ...req.body, id: sources[idx].id, projectId: sources[idx].projectId }
  saveSources(sources)
  res.json(ok(sources[idx]))
})

// ===================== MEDIA =====================
projectRouter.get('/:id/media', (req: Request, res: Response) => {
  const projectMedia = getMedia().filter(m => m.projectId === req.params.id)
  res.json(ok(projectMedia))
})

projectRouter.post('/:id/media', (req: Request, res: Response) => {
  const media = getMedia()
  const item: MediaItem = {
    id: genId(),
    projectId: req.params.id,
    originalName: req.body.originalName || 'untitled.jpg',
    newName: req.body.newName || '',
    sizeKb: req.body.sizeKb || 0,
    dimensions: req.body.dimensions || { width: 0, height: 0 },
    altTextSuggestion: req.body.altTextSuggestion || '',
    relatedPageId: req.body.relatedPageId || null,
    source: req.body.source || 'upload',
    sourceLabel: req.body.sourceLabel || 'Upload',
    type: req.body.type || 'general',
  }
  media.push(item)
  saveMedia(media)
  res.json(ok(item))
})

projectRouter.post('/:id/media/scrape-mock', (req: Request, res: Response) => {
  const projectId = req.params.id
  const media = getMedia()
  const pages = getPages().filter(p => p.projectId === projectId)
  const mockItems: MediaItem[] = [
    { id: genId(), projectId, originalName: 'IMG_3421.jpg', newName: 'hero-homepage.jpg', sizeKb: 890, dimensions: { width: 1920, height: 1080 }, altTextSuggestion: 'Overzicht van het kantoorpand', relatedPageId: pages[0]?.id || null, source: 'scrape-mock', sourceLabel: 'Huidige website', type: 'hero' },
    { id: genId(), projectId, originalName: 'foto_team_2023.png', newName: 'team-overzicht.png', sizeKb: 1240, dimensions: { width: 1200, height: 800 }, altTextSuggestion: 'Teamfoto van het bedrijf', relatedPageId: null, source: 'scrape-mock', sourceLabel: 'Google Drive', type: 'general' },
    { id: genId(), projectId, originalName: 'post_instagram_dec.jpg', newName: 'social-koelinstallatie.jpg', sizeKb: 340, dimensions: { width: 1080, height: 1080 }, altTextSuggestion: 'Koelinstallatie project Instagram post', relatedPageId: null, source: 'scrape-mock', sourceLabel: 'Instagram', type: 'card' },
    { id: genId(), projectId, originalName: 'logo_v3_final_FINAL.ai', newName: 'logo-csh.svg', sizeKb: 45, dimensions: { width: 400, height: 120 }, altTextSuggestion: 'Logo Cooling Service Holland', relatedPageId: null, source: 'scrape-mock', sourceLabel: 'Google Drive', type: 'logo' },
    { id: genId(), projectId, originalName: 'DSC00234.jpg', newName: 'project-albert-heijn.jpg', sizeKb: 2100, dimensions: { width: 4032, height: 3024 }, altTextSuggestion: 'Koelinstallatie bij Albert Heijn filiaal', relatedPageId: null, source: 'scrape-mock', sourceLabel: 'NAS server', type: 'hero' },
    { id: genId(), projectId, originalName: 'whatsapp-image-2024.jpeg', newName: 'monteur-aan-het-werk.jpg', sizeKb: 780, dimensions: { width: 1600, height: 1200 }, altTextSuggestion: 'Monteur bezig met installatie', relatedPageId: null, source: 'scrape-mock', sourceLabel: 'WhatsApp', type: 'general' },
    { id: genId(), projectId, originalName: 'banner_website_oud.jpg', newName: 'banner-diensten.jpg', sizeKb: 560, dimensions: { width: 1920, height: 600 }, altTextSuggestion: 'Banner voor dienstenpagina', relatedPageId: null, source: 'scrape-mock', sourceLabel: 'Huidige website', type: 'hero' },
    { id: genId(), projectId, originalName: 'certificaat_scan.pdf', newName: 'certificaat-f-gassen.pdf', sizeKb: 320, dimensions: { width: 595, height: 842 }, altTextSuggestion: 'F-gassen certificaat', relatedPageId: null, source: 'scrape-mock', sourceLabel: 'E-mail bijlage', type: 'general' },
  ]
  media.push(...mockItems)
  saveMedia(media)
  res.json(ok(mockItems))
})

// ===================== AUDIT =====================
projectRouter.get('/:id/audit', (req: Request, res: Response) => {
  const runs = getAuditRuns().filter(r => r.projectId === req.params.id)
  res.json(ok(runs))
})

projectRouter.post('/:id/audit/run', (req: Request, res: Response) => {
  const projectId = req.params.id
  const project = getProjects().find(p => p.id === projectId)
  if (!project) return res.status(404).json(err('Project niet gevonden'))

  const environment = req.body.environment || 'staging'
  const pages = getPages().filter(p => p.projectId === projectId)
  const seoFields = getSeoFields().filter(s => pages.map(p => p.id).includes(s.pageId))
  const media = getMedia().filter(m => m.projectId === projectId)

  const run: AuditRun = {
    id: genId(),
    projectId,
    environment,
    startedAt: now(),
    finishedAt: null,
    summary: null,
  }

  // Genereer issues op basis van mock regels
  const issues = generateAuditIssues(run.id, project, pages, seoFields, media, environment)

  // Vul summary in
  const high = issues.filter((i: AuditIssue) => i.severity === 'high').length
  const medium = issues.filter((i: AuditIssue) => i.severity === 'medium').length
  const low = issues.filter((i: AuditIssue) => i.severity === 'low').length
  const total = issues.length
  // Score: 100 - (high*10 + medium*5 + low*2), minimaal 0
  const score = Math.max(0, 100 - (high * 10 + medium * 5 + low * 2))

  run.finishedAt = now()
  run.summary = { totalIssues: total, high, medium, low, score }

  // Opslaan
  const runs = getAuditRuns()
  runs.push(run)
  saveAuditRuns(runs)

  const allIssues = getAuditIssues()
  allIssues.push(...issues)
  saveAuditIssues(allIssues)

  res.json(ok({ run, issues }))
})

projectRouter.get('/:id/audit/:runId/issues', (req: Request, res: Response) => {
  const issues = getAuditIssues().filter(i => i.auditRunId === req.params.runId)
  res.json(ok(issues))
})

projectRouter.get('/:id/audit/:runId/report', (req: Request, res: Response) => {
  const run = getAuditRuns().find(r => r.id === req.params.runId)
  if (!run) return res.status(404).json(err('Audit run niet gevonden'))
  const issues = getAuditIssues().filter(i => i.auditRunId === req.params.runId)
  const project = getProjects().find(p => p.id === req.params.id)
  const pages = getPages().filter(p => p.projectId === req.params.id)
  res.json(ok({ run, issues, project, pages }))
})
