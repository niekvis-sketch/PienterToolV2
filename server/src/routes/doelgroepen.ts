// ============================================================
// Doelgroepen Routes – Customer Journey Vragen per doelgroep
// Fasen: See, Think, Do, Care
// ============================================================
import { Router, Request, Response } from 'express'
import { readCollection, writeCollection } from '../storage'
import { genId, now, ok, err } from '../helpers'
import type { Doelgroep, DoelgroepVraag } from '../../../shared/types'

export const doelgroepenRouter = Router()

// ---------- Storage helpers ----------
function getDoelgroepen(): Doelgroep[] { return readCollection<Doelgroep>('doelgroepen') }
function saveDoelgroepen(d: Doelgroep[]) { writeCollection('doelgroepen', d) }
function getVragen(): DoelgroepVraag[] { return readCollection<DoelgroepVraag>('doelgroepVragen') }
function saveVragen(d: DoelgroepVraag[]) { writeCollection('doelgroepVragen', d) }

// ===================== DOELGROEPEN =====================

// GET /api/doelgroepen/:projectId
doelgroepenRouter.get('/:projectId', (req: Request, res: Response) => {
  const items = getDoelgroepen().filter(d => d.projectId === req.params.projectId)
  res.json(ok(items))
})

// POST /api/doelgroepen/:projectId
doelgroepenRouter.post('/:projectId', (req: Request, res: Response) => {
  const all = getDoelgroepen()
  const item: Doelgroep = {
    id: genId(),
    projectId: req.params.projectId,
    name: req.body.name || 'Nieuwe doelgroep',
    description: req.body.description || '',
    createdAt: now(),
  }
  all.push(item)
  saveDoelgroepen(all)
  res.json(ok(item))
})

// PUT /api/doelgroepen/:projectId/:doelgroepId
doelgroepenRouter.put('/:projectId/:doelgroepId', (req: Request, res: Response) => {
  const all = getDoelgroepen()
  const idx = all.findIndex(d => d.id === req.params.doelgroepId && d.projectId === req.params.projectId)
  if (idx < 0) return res.status(404).json(err('Doelgroep niet gevonden'))
  all[idx] = { ...all[idx], ...req.body, id: all[idx].id, projectId: all[idx].projectId }
  saveDoelgroepen(all)
  res.json(ok(all[idx]))
})

// DELETE /api/doelgroepen/:projectId/:doelgroepId
doelgroepenRouter.delete('/:projectId/:doelgroepId', (req: Request, res: Response) => {
  const { projectId, doelgroepId } = req.params
  let all = getDoelgroepen()
  const idx = all.findIndex(d => d.id === doelgroepId && d.projectId === projectId)
  if (idx < 0) return res.status(404).json(err('Doelgroep niet gevonden'))
  all.splice(idx, 1)
  saveDoelgroepen(all)
  // Verwijder ook alle vragen van deze doelgroep
  let vragen = getVragen().filter(v => v.doelgroepId !== doelgroepId)
  saveVragen(vragen)
  res.json(ok({ deleted: true }))
})

// ===================== VRAGEN =====================

// GET /api/doelgroepen/:projectId/:doelgroepId/vragen
doelgroepenRouter.get('/:projectId/:doelgroepId/vragen', (req: Request, res: Response) => {
  const items = getVragen().filter(
    v => v.projectId === req.params.projectId && v.doelgroepId === req.params.doelgroepId
  )
  items.sort((a, b) => a.sortOrder - b.sortOrder)
  res.json(ok(items))
})

// POST /api/doelgroepen/:projectId/:doelgroepId/vragen
doelgroepenRouter.post('/:projectId/:doelgroepId/vragen', (req: Request, res: Response) => {
  const all = getVragen()
  const existing = all.filter(
    v => v.projectId === req.params.projectId && v.doelgroepId === req.params.doelgroepId && v.fase === req.body.fase
  )
  const item: DoelgroepVraag = {
    id: genId(),
    projectId: req.params.projectId,
    doelgroepId: req.params.doelgroepId,
    fase: req.body.fase || 'see',
    text: req.body.text || '',
    answer: req.body.answer || '',
    webpagina: req.body.webpagina || '',
    opmerkingen: req.body.opmerkingen || '',
    sortOrder: existing.length,
    createdAt: now(),
  }
  all.push(item)
  saveVragen(all)
  res.json(ok(item))
})

// PUT /api/doelgroepen/:projectId/:doelgroepId/vragen/:vraagId
doelgroepenRouter.put('/:projectId/:doelgroepId/vragen/:vraagId', (req: Request, res: Response) => {
  const all = getVragen()
  const idx = all.findIndex(v => v.id === req.params.vraagId && v.doelgroepId === req.params.doelgroepId)
  if (idx < 0) return res.status(404).json(err('Vraag niet gevonden'))
  all[idx] = { ...all[idx], ...req.body, id: all[idx].id, projectId: all[idx].projectId, doelgroepId: all[idx].doelgroepId }
  saveVragen(all)
  res.json(ok(all[idx]))
})

// DELETE /api/doelgroepen/:projectId/:doelgroepId/vragen/:vraagId
doelgroepenRouter.delete('/:projectId/:doelgroepId/vragen/:vraagId', (req: Request, res: Response) => {
  const all = getVragen()
  const idx = all.findIndex(v => v.id === req.params.vraagId && v.doelgroepId === req.params.doelgroepId)
  if (idx < 0) return res.status(404).json(err('Vraag niet gevonden'))
  all.splice(idx, 1)
  saveVragen(all)
  res.json(ok({ deleted: true }))
})

// POST /api/doelgroepen/:projectId/bulk-import
// Accepts array of { doelgroepId, fase, text, answer?, webpagina?, opmerkingen? }
doelgroepenRouter.post('/:projectId/bulk-import', (req: Request, res: Response) => {
  const { projectId } = req.params
  const rows: Array<{ doelgroepId: string; fase: string; text: string; answer?: string; webpagina?: string; opmerkingen?: string }> = req.body.rows || []
  const replace = req.body.replace === true

  if (!Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json(err('Geen vragen om te importeren'))
  }

  let all = getVragen()
  
  if (replace) {
    const importDoelgroepIds = [...new Set(rows.map(r => r.doelgroepId))]
    // Verwijder bestaande vragen voor de doelgroepen die in de import zitten
    all = all.filter(v => !(v.projectId === projectId && importDoelgroepIds.includes(v.doelgroepId)))
  }

  const created: DoelgroepVraag[] = []

  for (const row of rows) {
    if (!row.text || !row.doelgroepId || !row.fase) continue
    const existing = all.filter(v => v.projectId === projectId && v.doelgroepId === row.doelgroepId && v.fase === row.fase)
    const item: DoelgroepVraag = {
      id: genId(),
      projectId,
      doelgroepId: row.doelgroepId,
      fase: row.fase as DoelgroepVraag['fase'],
      text: row.text,
      answer: row.answer || '',
      webpagina: row.webpagina || '',
      opmerkingen: row.opmerkingen || '',
      sortOrder: existing.length + created.filter(c => c.doelgroepId === row.doelgroepId && c.fase === row.fase).length,
      createdAt: now(),
    }
    created.push(item)
    all.push(item)
  }

  saveVragen(all)
  res.json(ok(created))
})
