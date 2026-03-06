// ============================================================
// Componenten Routes – ACF Component blokken per project
// Categorieën: broodblok, flexblok, posttype
// ============================================================
import { Router, Request, Response } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { readCollection, writeCollection } from '../storage'
import { genId, now, ok, err } from '../helpers'
import type { ComponentBlock, ComponentCategory } from '../../../shared/types'

export const componentenRouter = Router()

// ---------- Multer config voor afbeelding uploads ----------
const UPLOAD_DIR = path.resolve(__dirname, '../../data/uploads/components')
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `${genId()}-${Date.now()}${ext}`)
  },
})

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    const allowed = ['.png', '.jpg', '.jpeg', '.webp', '.gif']
    const ext = path.extname(file.originalname).toLowerCase()
    cb(null, allowed.includes(ext))
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
})

// ---------- Storage helpers ----------
function getComponents(): ComponentBlock[] { return readCollection<ComponentBlock>('components') }
function saveComponents(d: ComponentBlock[]) { writeCollection('components', d) }

// ---------- Seed defaults voor een project ----------
const DEFAULT_COMPONENTS: Array<{ name: string; category: ComponentCategory }> = [
  // Broodblokken
  { name: 'Broodblok-Header+menu', category: 'broodblok' },
  { name: 'Broodblok-Hero', category: 'broodblok' },
  { name: 'Broodblok-Footer', category: 'broodblok' },
  // Flexblokken
  { name: 'Flexblok-USP-Tekst', category: 'flexblok' },
  { name: 'Flexblok-USP-Cijfers', category: 'flexblok' },
  { name: 'Flexblok-Quote', category: 'flexblok' },
  { name: 'Flexblok-Testimonials', category: 'flexblok' },
  { name: 'Flexblok-Tekst', category: 'flexblok' },
  { name: 'Flexblok-Stappenplan-Teaser', category: 'flexblok' },
  { name: 'Flexblok-Stappenplan-Media', category: 'flexblok' },
  { name: 'Flexblok-Media-Tekst', category: 'flexblok' },
  { name: 'Flexblok-Media-Slider', category: 'flexblok' },
  { name: 'Flexblok-Media-Grid', category: 'flexblok' },
  { name: 'Flexblok-Kolommen-Tekst', category: 'flexblok' },
  { name: 'Flexblok-Formulier', category: 'flexblok' },
  { name: 'Flexblok-CTA Banner', category: 'flexblok' },
  { name: 'Flexblok-Blokken-Tekst', category: 'flexblok' },
  { name: 'Flexblok-Accordion', category: 'flexblok' },
  // Posttypes
  { name: 'posttype-portfolio-overzicht', category: 'posttype' },
  { name: 'posttype-portfolio-detail', category: 'posttype' },
  { name: 'posttype-portfolio-preview', category: 'posttype' },
  { name: 'posttype-news-overzicht', category: 'posttype' },
  { name: 'posttype-news-detail', category: 'posttype' },
  { name: 'posttype-news-preview', category: 'posttype' },
  { name: 'posttype-jobs-overzicht', category: 'posttype' },
  { name: 'posttype-jobs-detail', category: 'posttype' },
  { name: 'posttype-jobs-preview', category: 'posttype' },
  { name: 'posttype-events-overzicht', category: 'posttype' },
  { name: 'posttype-events-detail', category: 'posttype' },
  { name: 'posttype-events-preview', category: 'posttype' },
  { name: 'posttype-cases-overzicht', category: 'posttype' },
  { name: 'posttype-cases-detail', category: 'posttype' },
  { name: 'posttype-cases-preview', category: 'posttype' },
  { name: 'posttype-affiliates-overzicht', category: 'posttype' },
  { name: 'posttype-affiliates-detail', category: 'posttype' },
  { name: 'posttype-affiliates-preview', category: 'posttype' },
  { name: 'posttype-blog-overzicht', category: 'posttype' },
  { name: 'posttype-blog-detail', category: 'posttype' },
  { name: 'posttype-blog-preview', category: 'posttype' },
]

// ===================== ROUTES =====================

// GET /api/componenten/:projectId
componentenRouter.get('/:projectId', (req: Request, res: Response) => {
  const all = getComponents().filter(c => c.projectId === req.params.projectId)
  res.json(ok(all))
})

// POST /api/componenten/:projectId/seed
// Maakt de standaard componenten aan als ze nog niet bestaan
componentenRouter.post('/:projectId/seed', (req: Request, res: Response) => {
  const { projectId } = req.params
  const all = getComponents()
  const existing = all.filter(c => c.projectId === projectId)

  if (existing.length > 0) {
    return res.json(ok(existing))
  }

  const created: ComponentBlock[] = DEFAULT_COMPONENTS.map(def => ({
    id: genId(),
    projectId,
    name: def.name,
    category: def.category,
    description: '',
    imagePath: '',
    createdAt: now(),
    updatedAt: now(),
  }))

  all.push(...created)
  saveComponents(all)
  res.json(ok(created))
})

// POST /api/componenten/:projectId
componentenRouter.post('/:projectId', (req: Request, res: Response) => {
  const all = getComponents()
  const item: ComponentBlock = {
    id: genId(),
    projectId: req.params.projectId,
    name: req.body.name || 'Nieuw component',
    category: req.body.category || 'flexblok',
    description: req.body.description || '',
    imagePath: '',
    createdAt: now(),
    updatedAt: now(),
  }
  all.push(item)
  saveComponents(all)
  res.json(ok(item))
})

// PUT /api/componenten/:projectId/:componentId
componentenRouter.put('/:projectId/:componentId', (req: Request, res: Response) => {
  const all = getComponents()
  const idx = all.findIndex(c => c.id === req.params.componentId && c.projectId === req.params.projectId)
  if (idx < 0) return res.status(404).json(err('Component niet gevonden'))
  all[idx] = {
    ...all[idx],
    ...req.body,
    id: all[idx].id,
    projectId: all[idx].projectId,
    updatedAt: now(),
  }
  saveComponents(all)
  res.json(ok(all[idx]))
})

// DELETE /api/componenten/:projectId/:componentId
componentenRouter.delete('/:projectId/:componentId', (req: Request, res: Response) => {
  const all = getComponents()
  const idx = all.findIndex(c => c.id === req.params.componentId && c.projectId === req.params.projectId)
  if (idx < 0) return res.status(404).json(err('Component niet gevonden'))

  // Verwijder eventueel gekoppelde afbeelding
  if (all[idx].imagePath) {
    const imgPath = path.resolve(__dirname, '../../data', all[idx].imagePath)
    if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath)
  }

  all.splice(idx, 1)
  saveComponents(all)
  res.json(ok({ deleted: true }))
})

// POST /api/componenten/:projectId/:componentId/image
// Upload afbeelding voor een component
componentenRouter.post('/:projectId/:componentId/image', upload.single('image'), (req: Request, res: Response) => {
  if (!req.file) return res.status(400).json(err('Geen afbeelding geüpload'))

  const all = getComponents()
  const idx = all.findIndex(c => c.id === req.params.componentId && c.projectId === req.params.projectId)
  if (idx < 0) return res.status(404).json(err('Component niet gevonden'))

  // Verwijder oude afbeelding als die bestaat
  if (all[idx].imagePath) {
    const oldPath = path.resolve(__dirname, '../../data', all[idx].imagePath)
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath)
  }

  // Sla relatief pad op
  all[idx].imagePath = `uploads/components/${req.file.filename}`
  all[idx].updatedAt = now()
  saveComponents(all)

  res.json(ok(all[idx]))
})

// DELETE /api/componenten/:projectId/:componentId/image
componentenRouter.delete('/:projectId/:componentId/image', (req: Request, res: Response) => {
  const all = getComponents()
  const idx = all.findIndex(c => c.id === req.params.componentId && c.projectId === req.params.projectId)
  if (idx < 0) return res.status(404).json(err('Component niet gevonden'))

  if (all[idx].imagePath) {
    const imgPath = path.resolve(__dirname, '../../data', all[idx].imagePath)
    if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath)
    all[idx].imagePath = ''
    all[idx].updatedAt = now()
    saveComponents(all)
  }

  res.json(ok(all[idx]))
})
