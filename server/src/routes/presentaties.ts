// ============================================================
// Presentatiemodus routes
// ============================================================
import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { readCollection, writeCollection } from '../storage'
import { genId, now, ok, err } from '../helpers'
import type { PresentatieSessie, PresentatieSlideConfig, PresentatieSessieType, PresentatieSlideType } from '@shared/types'

export const presentatieRouter = Router()

const COLLECTION = 'presentaties'

// ---------- Multer config voor slide screenshot uploads ----------
const UPLOAD_DIR = path.resolve(__dirname, '../../data/uploads/slides')
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
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB for screenshots
})

// Slide-presets per sessietype
const sessionSlidePresets: Record<PresentatieSessieType, { type: PresentatieSlideType; required: boolean }[]> = {
  intake: [
    { type: 'introductie', required: true },
    { type: 'projectdoel', required: true },
    { type: 'doelgroepen', required: false },
    { type: 'functionaliteiten', required: false },
    { type: 'planning', required: false },
    { type: 'rollen-teams', required: false },
    { type: 'volgende-stap', required: true },
  ],
  websitesessie: [
    { type: 'introductie', required: true },
    { type: 'visie', required: false },
    { type: 'missie', required: false },
    { type: 'doelgroepen', required: false },
    { type: 'doelgroeppaspoort', required: false },
    { type: 'user-stories', required: false },
    { type: 'klantreis', required: false },
    { type: 'merkwaarden', required: false },
    { type: 'kernwaarden', required: false },
    { type: 'concurrenten-inspiratie', required: false },
    { type: 'beeldmateriaal', required: false },
    { type: 'functionaliteiten', required: false },
    { type: 'paginas', required: false },
    { type: 'volgende-stap', required: true },
  ],
  structuur: [
    { type: 'introductie', required: true },
    { type: 'sitemap', required: false },
    { type: 'paginas', required: false },
    { type: 'paginadoel', required: false },
    { type: 'zoekthemas', required: false },
    { type: 'pagina-prioriteit', required: false },
    { type: 'content-ontbreekt', required: false },
    { type: 'volgende-stap', required: true },
  ],
  design: [
    { type: 'introductie', required: true },
    { type: 'stijlrichting', required: false },
    { type: 'kleur-typografie', required: false },
    { type: 'componentvoorbeeld', required: false },
    { type: 'voorbeeldpagina', required: false },
    { type: 'design-doelgroep-match', required: false },
    { type: 'feedbackpunten', required: false },
    { type: 'volgende-stap', required: true },
  ],
  content: [
    { type: 'introductie', required: true },
    { type: 'contentstatus', required: false },
    { type: 'wie-schrijft-wat', required: false },
    { type: 'beeldmateriaal', required: false },
    { type: 'zoekthemas', required: false },
    { type: 'content-ontbreekt', required: false },
    { type: 'actiepunten', required: false },
    { type: 'volgende-stap', required: true },
  ],
  'intern-overdracht': [
    { type: 'introductie', required: true },
    { type: 'samenvatting', required: false },
    { type: 'projectdoel', required: false },
    { type: 'sitemap', required: false },
    { type: 'paginas', required: false },
    { type: 'componenten-per-pagina', required: false },
    { type: 'functionele-toelichting', required: false },
    { type: 'openstaande-punten', required: false },
    { type: 'risicos', required: false },
    { type: 'volgende-stap', required: true },
  ],
}

function buildSlidesForType(sessieType: PresentatieSessieType): PresentatieSlideConfig[] {
  const preset = sessionSlidePresets[sessieType] || sessionSlidePresets.websitesessie
  return preset.map((s, i) => ({
    type: s.type,
    enabled: true,
    required: s.required,
    sortOrder: i,
    notes: '',
  }))
}

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
  const sessieType = body.sessieType || 'websitesessie'

  const sessie: PresentatieSessie = {
    id: genId(),
    projectId: req.params.projectId,
    name: body.name || 'Nieuwe sessie',
    sessieType,
    style: body.style || 'pienter',
    slides: body.slides || buildSlidesForType(sessieType),
    liveNotes: body.liveNotes || [],
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
  const sessie = all.find(s => s.id === req.params.sessieId && s.projectId === req.params.projectId)
  if (!sessie) return res.status(404).json(err('Sessie niet gevonden', 404))

  // Cleanup slide images
  for (const slide of sessie.slides) {
    if (slide.imagePaths) {
      for (const imgPath of slide.imagePaths) {
        const fullPath = path.resolve(__dirname, '../../data', imgPath)
        if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath)
      }
    }
  }

  all = all.filter(s => !(s.id === req.params.sessieId && s.projectId === req.params.projectId))
  writeCollection(COLLECTION, all)
  res.json(ok({ deleted: true }))
})

// POST /:projectId/:sessieId/slides/:slideIndex/image – screenshot uploaden
presentatieRouter.post('/:projectId/:sessieId/slides/:slideIndex/image', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json(err('Geen afbeelding ontvangen'))

  const all = readCollection<PresentatieSessie>(COLLECTION)
  const idx = all.findIndex(s => s.id === req.params.sessieId && s.projectId === req.params.projectId)
  if (idx < 0) {
    fs.unlinkSync(req.file.path)
    return res.status(404).json(err('Sessie niet gevonden', 404))
  }

  const slideIndex = parseInt(req.params.slideIndex, 10)
  if (isNaN(slideIndex) || slideIndex < 0 || slideIndex >= all[idx].slides.length) {
    fs.unlinkSync(req.file.path)
    return res.status(400).json(err('Ongeldige slide index'))
  }

  const relativePath = `uploads/slides/${req.file.filename}`
  if (!all[idx].slides[slideIndex].imagePaths) {
    all[idx].slides[slideIndex].imagePaths = []
  }
  all[idx].slides[slideIndex].imagePaths!.push(relativePath)
  all[idx].updatedAt = now()

  writeCollection(COLLECTION, all)
  res.json(ok(all[idx]))
})

// DELETE /:projectId/:sessieId/slides/:slideIndex/image/:imageIndex – screenshot verwijderen
presentatieRouter.delete('/:projectId/:sessieId/slides/:slideIndex/image/:imageIndex', (req, res) => {
  const all = readCollection<PresentatieSessie>(COLLECTION)
  const idx = all.findIndex(s => s.id === req.params.sessieId && s.projectId === req.params.projectId)
  if (idx < 0) return res.status(404).json(err('Sessie niet gevonden', 404))

  const slideIndex = parseInt(req.params.slideIndex, 10)
  const imageIndex = parseInt(req.params.imageIndex, 10)
  const slide = all[idx].slides[slideIndex]

  if (!slide || !slide.imagePaths || imageIndex < 0 || imageIndex >= slide.imagePaths.length) {
    return res.status(400).json(err('Ongeldige index'))
  }

  const imgPath = slide.imagePaths[imageIndex]
  const fullPath = path.resolve(__dirname, '../../data', imgPath)
  if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath)

  slide.imagePaths.splice(imageIndex, 1)
  all[idx].updatedAt = now()

  writeCollection(COLLECTION, all)
  res.json(ok(all[idx]))
})
