// ============================================================
// Presentatiemodus routes
// ============================================================
import { Router } from 'express'
import { readCollection, writeCollection } from '../storage'
import { genId, now, ok, err } from '../helpers'
import type { PresentatieSessie, PresentatieSlideConfig } from '@shared/types'

export const presentatieRouter = Router()

const COLLECTION = 'presentaties'

const defaultSlides: PresentatieSlideConfig[] = [
  { type: 'introductie', enabled: true, sortOrder: 0 },
  { type: 'visie', enabled: true, sortOrder: 1 },
  { type: 'missie', enabled: true, sortOrder: 2 },
  { type: 'klantreis', enabled: true, sortOrder: 3 },
  { type: 'doelgroepen', enabled: true, sortOrder: 4 },
  { type: 'merkwaarden', enabled: true, sortOrder: 5 },
  { type: 'kernwaarden', enabled: true, sortOrder: 6 },
  { type: 'doelgroeppaspoort', enabled: true, sortOrder: 7 },
]

// GET /:projectId – alle sessies voor een project
presentatieRouter.get('/:projectId', (req, res) => {
  const all = readCollection<PresentatieSessie>(COLLECTION)
  const filtered = all.filter(s => s.projectId === req.params.projectId)
  res.json(ok(filtered))
})

// GET /:projectId/:sessieId – één sessie
presentatieRouter.get('/:projectId/:sessieId', (req, res) => {
  const all = readCollection<PresentatieSessie>(COLLECTION)
  const sessie = all.find(s => s.id === req.params.sessieId && s.projectId === req.params.projectId)
  if (!sessie) return res.status(404).json(err('Sessie niet gevonden', 404))
  res.json(ok(sessie))
})

// POST /:projectId – nieuwe sessie aanmaken
presentatieRouter.post('/:projectId', (req, res) => {
  const all = readCollection<PresentatieSessie>(COLLECTION)
  const body = req.body as Partial<PresentatieSessie>

  const sessie: PresentatieSessie = {
    id: genId(),
    projectId: req.params.projectId,
    name: body.name || 'Nieuwe sessie',
    style: body.style || 'pienter',
    slides: body.slides || [...defaultSlides],
    visie: body.visie || '',
    missie: body.missie || '',
    merkwaarden: body.merkwaarden || [],
    kernwaarden: body.kernwaarden || [],
    doelgroepPaspoorten: body.doelgroepPaspoorten || [],
    createdAt: now(),
    updatedAt: now(),
  }

  all.push(sessie)
  writeCollection(COLLECTION, all)
  res.json(ok(sessie))
})

// PUT /:projectId/:sessieId – sessie bijwerken
presentatieRouter.put('/:projectId/:sessieId', (req, res) => {
  const all = readCollection<PresentatieSessie>(COLLECTION)
  const idx = all.findIndex(s => s.id === req.params.sessieId && s.projectId === req.params.projectId)
  if (idx < 0) return res.status(404).json(err('Sessie niet gevonden', 404))

  const body = req.body as Partial<PresentatieSessie>
  const updated: PresentatieSessie = {
    ...all[idx],
    ...body,
    id: all[idx].id,
    projectId: all[idx].projectId,
    createdAt: all[idx].createdAt,
    updatedAt: now(),
  }

  all[idx] = updated
  writeCollection(COLLECTION, all)
  res.json(ok(updated))
})

// DELETE /:projectId/:sessieId – sessie verwijderen
presentatieRouter.delete('/:projectId/:sessieId', (req, res) => {
  let all = readCollection<PresentatieSessie>(COLLECTION)
  const exists = all.some(s => s.id === req.params.sessieId && s.projectId === req.params.projectId)
  if (!exists) return res.status(404).json(err('Sessie niet gevonden', 404))

  all = all.filter(s => !(s.id === req.params.sessieId && s.projectId === req.params.projectId))
  writeCollection(COLLECTION, all)
  res.json(ok({ deleted: true }))
})
