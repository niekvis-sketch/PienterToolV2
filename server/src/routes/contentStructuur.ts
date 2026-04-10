// ============================================================
// Content Structuur Routes – Spreadsheet-achtig document per project
// ============================================================
import { Router, Request, Response } from 'express'
import { readCollection, writeCollection } from '../storage'
import { genId, now, ok, err } from '../helpers'
import type { ContentStructuurRow, ContentStructuurPreset, SiteNode } from '../../../shared/types'

export const contentStructuurRouter = Router()

// ---------- Storage helpers ----------
function getRows(): ContentStructuurRow[] { return readCollection<ContentStructuurRow>('contentStructuur') }
function saveRows(d: ContentStructuurRow[]) { writeCollection('contentStructuur', d) }
function getPresets(): ContentStructuurPreset[] { return readCollection<ContentStructuurPreset>('contentStructuurPresets') }
function savePresets(d: ContentStructuurPreset[]) { writeCollection('contentStructuurPresets', d) }
function getSiteNodes(): SiteNode[] { return readCollection<SiteNode>('siteNodes') }

function sortNodesFlat(nodes: SiteNode[]): SiteNode[] {
  const tree = new Map<string | null, SiteNode[]>()
  for (const node of nodes) {
    const key = node.parentId ?? null
    if (!tree.has(key)) tree.set(key, [])
    tree.get(key)!.push(node)
  }

  for (const [, children] of tree) {
    children.sort((a, b) => a.sortOrder - b.sortOrder)
  }

  const result: SiteNode[] = []
  function walk(parentId: string | null) {
    const children = tree.get(parentId) || []
    for (const child of children) {
      result.push(child)
      walk(child.id)
    }
  }

  walk(null)
  return result
}

// ===================== ROWS =====================

// GET /api/content-structuur/:projectId
contentStructuurRouter.get('/:projectId', (req: Request, res: Response) => {
  const rows = getRows().filter(r => r.projectId === req.params.projectId)
  rows.sort((a, b) => a.sortOrder - b.sortOrder)
  res.json(ok(rows))
})

// POST /api/content-structuur/:projectId
contentStructuurRouter.post('/:projectId', (req: Request, res: Response) => {
  const { projectId } = req.params
  const all = getRows()
  const projectRows = all.filter(r => r.projectId === projectId)
  const maxSort = projectRows.length > 0 ? Math.max(...projectRows.map(r => r.sortOrder)) : -1

  const row: ContentStructuurRow = {
    id: genId(),
    projectId,
    siteNodeId: req.body.siteNodeId ?? null,
    naamPagina: req.body.naamPagina ?? '',
    zoektermen: req.body.zoektermen ?? '',
    tekstKlaar: req.body.tekstKlaar ?? false,
    wiePlaatst: req.body.wiePlaatst ?? '',
    status: req.body.status ?? 'niet-gestart',
    watMistNog: req.body.watMistNog ?? '',
    nieuweUrl: req.body.nieuweUrl ?? '',
    slug: req.body.slug ?? '',
    metaTitel: req.body.metaTitel ?? '',
    metaDescription: req.body.metaDescription ?? '',
    sortOrder: maxSort + 1,
    createdAt: now(),
    updatedAt: now(),
  }

  all.push(row)
  saveRows(all)
  res.json(ok(row))
})

// PUT /api/content-structuur/:projectId/:rowId
contentStructuurRouter.put('/:projectId/:rowId', (req: Request, res: Response) => {
  const all = getRows()
  const idx = all.findIndex(r => r.id === req.params.rowId && r.projectId === req.params.projectId)
  if (idx < 0) { res.status(404).json(err('Rij niet gevonden')); return }

  const updatable = ['siteNodeId', 'naamPagina', 'zoektermen', 'tekstKlaar', 'wiePlaatst', 'status', 'watMistNog', 'nieuweUrl', 'slug', 'metaTitel', 'metaDescription', 'sortOrder'] as const
  for (const key of updatable) {
    if (req.body[key] !== undefined) {
      ;(all[idx] as any)[key] = req.body[key]
    }
  }
  all[idx].updatedAt = now()
  saveRows(all)
  res.json(ok(all[idx]))
})

// DELETE /api/content-structuur/:projectId/:rowId
contentStructuurRouter.delete('/:projectId/:rowId', (req: Request, res: Response) => {
  let all = getRows()
  const idx = all.findIndex(r => r.id === req.params.rowId && r.projectId === req.params.projectId)
  if (idx < 0) { res.status(404).json(err('Rij niet gevonden')); return }
  all.splice(idx, 1)
  saveRows(all)
  res.json(ok({ deleted: true }))
})

// POST /api/content-structuur/:projectId/bulk — import meerdere rijen (CSV import)
contentStructuurRouter.post('/:projectId/bulk', (req: Request, res: Response) => {
  const { projectId } = req.params
  const { rows: incoming, replace } = req.body as { rows: Partial<ContentStructuurRow>[]; replace?: boolean }

  if (!Array.isArray(incoming)) { res.status(400).json(err('rows array vereist')); return }

  let all = getRows()

  if (replace) {
    all = all.filter(r => r.projectId !== projectId)
  }

  const projectRows = all.filter(r => r.projectId === projectId)
  let maxSort = projectRows.length > 0 ? Math.max(...projectRows.map(r => r.sortOrder)) : -1

  const created: ContentStructuurRow[] = []
  for (const row of incoming) {
    maxSort++
    const newRow: ContentStructuurRow = {
      id: genId(),
      projectId,
      siteNodeId: row.siteNodeId ?? null,
      naamPagina: row.naamPagina ?? '',
      zoektermen: row.zoektermen ?? '',
      tekstKlaar: row.tekstKlaar ?? false,
      wiePlaatst: row.wiePlaatst ?? '',
      status: row.status ?? 'niet-gestart',
      watMistNog: row.watMistNog ?? '',
      nieuweUrl: row.nieuweUrl ?? '',
      slug: row.slug ?? '',
      metaTitel: row.metaTitel ?? '',
      metaDescription: row.metaDescription ?? '',
      sortOrder: maxSort,
      createdAt: now(),
      updatedAt: now(),
    }
    all.push(newRow)
    created.push(newRow)
  }

  saveRows(all)
  res.json(ok(created))
})

// POST /api/content-structuur/:projectId/sync-from-structuur
contentStructuurRouter.post('/:projectId/sync-from-structuur', (req: Request, res: Response) => {
  const { projectId } = req.params
  const allRows = getRows()
  const projectRows = allRows.filter(row => row.projectId === projectId)
  const siteNodes = sortNodesFlat(
    getSiteNodes().filter(node => node.projectId === projectId && !node.isParked)
  )

  if (siteNodes.length === 0) {
    res.json(ok({ created: 0, updated: 0, rows: projectRows.sort((a, b) => a.sortOrder - b.sortOrder) }))
    return
  }

  const rowsByNodeId = new Map(projectRows.filter(row => row.siteNodeId).map(row => [row.siteNodeId as string, row]))
  let created = 0
  let updated = 0

  siteNodes.forEach((node, index) => {
    const naamPagina = node.title
    const existing = rowsByNodeId.get(node.id)
      || projectRows.find(row => !row.siteNodeId && (
        row.naamPagina === node.title
        || (!!row.slug && row.slug === node.slug)
        || (!!row.nieuweUrl && row.nieuweUrl === node.fullUrl)
      ))

    if (existing) {
      existing.siteNodeId = node.id
      existing.naamPagina = naamPagina
      existing.nieuweUrl = node.fullUrl || existing.nieuweUrl
      existing.slug = node.slug || existing.slug
      existing.metaTitel = node.metaTitle || existing.metaTitel
      existing.metaDescription = node.metaDescription || existing.metaDescription
      existing.sortOrder = index
      existing.updatedAt = now()
      updated++
      return
    }

    allRows.push({
      id: genId(),
      projectId,
      siteNodeId: node.id,
      naamPagina,
      zoektermen: '',
      tekstKlaar: false,
      wiePlaatst: '',
      status: 'niet-gestart',
      watMistNog: '',
      nieuweUrl: node.fullUrl || '',
      slug: node.slug || '',
      metaTitel: node.metaTitle || '',
      metaDescription: node.metaDescription || '',
      sortOrder: index,
      createdAt: now(),
      updatedAt: now(),
    })
    created++
  })

  saveRows(allRows)
  res.json(ok({
    created,
    updated,
    rows: allRows
      .filter(row => row.projectId === projectId)
      .sort((a, b) => a.sortOrder - b.sortOrder),
  }))
})

// ===================== PRESETS =====================

// GET /api/content-structuur/:projectId/presets
contentStructuurRouter.get('/:projectId/presets', (req: Request, res: Response) => {
  const presets = getPresets().filter(p => p.projectId === req.params.projectId)
  res.json(ok(presets))
})

// POST /api/content-structuur/:projectId/presets
contentStructuurRouter.post('/:projectId/presets', (req: Request, res: Response) => {
  const all = getPresets()
  const preset: ContentStructuurPreset = {
    id: genId(),
    projectId: req.params.projectId,
    name: req.body.name ?? 'Nieuw preset',
    visibleColumns: req.body.visibleColumns ?? [],
    createdAt: now(),
  }
  all.push(preset)
  savePresets(all)
  res.json(ok(preset))
})

// PUT /api/content-structuur/:projectId/presets/:presetId
contentStructuurRouter.put('/:projectId/presets/:presetId', (req: Request, res: Response) => {
  const all = getPresets()
  const idx = all.findIndex(p => p.id === req.params.presetId && p.projectId === req.params.projectId)
  if (idx < 0) { res.status(404).json(err('Preset niet gevonden')); return }

  if (req.body.name !== undefined) all[idx].name = req.body.name
  if (req.body.visibleColumns !== undefined) all[idx].visibleColumns = req.body.visibleColumns

  savePresets(all)
  res.json(ok(all[idx]))
})

// DELETE /api/content-structuur/:projectId/presets/:presetId
contentStructuurRouter.delete('/:projectId/presets/:presetId', (req: Request, res: Response) => {
  let all = getPresets()
  const idx = all.findIndex(p => p.id === req.params.presetId && p.projectId === req.params.projectId)
  if (idx < 0) { res.status(404).json(err('Preset niet gevonden')); return }
  all.splice(idx, 1)
  savePresets(all)
  res.json(ok({ deleted: true }))
})
