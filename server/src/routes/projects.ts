// ============================================================
// Project Routes – CRUD + pages, SEO, structuur import
// ============================================================
import { Router, Request, Response } from 'express'
import { readCollection, writeCollection } from '../storage'
import { genId, now, ok, err } from '../helpers'
import type {
  Project, Page, SEOFields, StructureImport, StructureNode,
  PageType
} from '../../../shared/types'

export const projectRouter = Router()

// ---------- helpers ----------
function getProjects(): Project[] { return readCollection<Project>('projects') }
function saveProjects(p: Project[]) { writeCollection('projects', p) }
function getPages(): Page[] { return readCollection<Page>('pages') }
function savePages(p: Page[]) { writeCollection('pages', p) }
function getSeoFields(): SEOFields[] { return readCollection<SEOFields>('seoFields') }
function saveSeoFields(s: SEOFields[]) { writeCollection('seoFields', s) }

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

  res.json(ok({
    pages: newPages,
    seoFields: newSeo,
  }))
})
