// ============================================================
// Slides – freeform presentatie editor + pptx export
// ============================================================
import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import PptxGenJS from 'pptxgenjs'
import { readCollection, writeCollection } from '../storage'
import { genId, now, ok, err } from '../helpers'
import type {
  SlidePresentation,
  Slide,
  SlidePreset,
  SlideContent,
  SlideElement,
  SlideLayoutType,
} from '@shared/types'

export const slidesRouter = Router()

const PRESENTATIONS = 'slidePresentations'
const PRESETS = 'slidePresets'

// Canvas afmetingen in inches (16:9). Frontend canvas (960×540 px @ 96 dpi) is hier 1-op-1 mee.
const CANVAS_W = 10
const CANVAS_H = 5.625

// ---------- Multer config voor afbeelding uploads ----------
const UPLOAD_DIR = path.resolve(__dirname, '../../data/uploads/slides-free')
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true })

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    cb(null, `${genId()}-${Date.now()}${ext}`)
  },
})

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    const allowed = ['.png', '.jpg', '.jpeg', '.webp', '.gif']
    cb(null, allowed.includes(path.extname(file.originalname).toLowerCase()))
  },
  limits: { fileSize: 10 * 1024 * 1024 },
})

// ---------- Default content per layout ----------
function defaultContent(layout: SlideLayoutType): SlideContent {
  const base: SlideContent = { elements: [], background: 'FFFFFF' }
  const titleEl = (slot: string, value: string, y: number): SlideElement => ({
    id: genId(),
    type: 'text', slot, value,
    x: 0.5, y, w: 9, h: 1,
    fontSize: 36, bold: true, color: '1F2937', align: 'left',
  })
  const bodyEl = (slot: string, value: string, x: number, y: number, w: number, h: number): SlideElement => ({
    id: genId(),
    type: 'text', slot, value,
    x, y, w, h,
    fontSize: 18, color: '374151', align: 'left',
  })

  switch (layout) {
    case 'title_only':
      base.elements.push(titleEl('title', 'Titel', 2.3))
      break
    case 'title_content':
      base.elements.push(titleEl('title', 'Titel', 0.4))
      base.elements.push(bodyEl('body', 'Inhoud...', 0.5, 1.6, 9, 3.5))
      break
    case 'two_column':
      base.elements.push(titleEl('title', 'Titel', 0.4))
      base.elements.push(bodyEl('left', 'Linker kolom', 0.5, 1.6, 4.4, 3.5))
      base.elements.push(bodyEl('right', 'Rechter kolom', 5.1, 1.6, 4.4, 3.5))
      break
    case 'image_text':
      base.elements.push(titleEl('title', 'Titel', 0.4))
      base.elements.push(bodyEl('body', 'Tekst naast afbeelding', 5.1, 1.6, 4.4, 3.5))
      break
    case 'full_image':
    case 'blank':
    default:
      break
  }
  return base
}

// ---------- Helpers ----------
function getPresentations(): SlidePresentation[] {
  return readCollection<SlidePresentation>(PRESENTATIONS)
}

function savePresentations(list: SlidePresentation[]): void {
  writeCollection(PRESENTATIONS, list)
}

function deepCloneContent(c: SlideContent): SlideContent {
  return {
    background: c.background,
    elements: c.elements.map(el => ({ ...el, id: genId() })),
  }
}

// ============================================================
// Presentaties
// ============================================================

slidesRouter.get('/presentations', (_req, res) => {
  const list = getPresentations()
  // light view zonder slides voor lijstweergave
  const summaries = list.map(p => ({
    id: p.id, name: p.name,
    slideCount: p.slides.length,
    createdAt: p.createdAt, updatedAt: p.updatedAt,
  }))
  res.json(ok(summaries))
})

slidesRouter.post('/presentations', (req, res) => {
  const list = getPresentations()
  const body = req.body as Partial<SlidePresentation>
  const presentation: SlidePresentation = {
    id: genId(),
    name: body.name?.trim() || 'Nieuwe presentatie',
    slides: [],
    createdAt: now(),
    updatedAt: now(),
  }
  list.push(presentation)
  savePresentations(list)
  res.json(ok(presentation))
})

slidesRouter.get('/presentations/:id', (req, res) => {
  const p = getPresentations().find(x => x.id === req.params.id)
  if (!p) return res.status(404).json(err('Presentatie niet gevonden', 404))
  res.json(ok(p))
})

slidesRouter.put('/presentations/:id', (req, res) => {
  const list = getPresentations()
  const idx = list.findIndex(x => x.id === req.params.id)
  if (idx < 0) return res.status(404).json(err('Presentatie niet gevonden', 404))
  const body = req.body as Partial<SlidePresentation>
  const updated: SlidePresentation = {
    ...list[idx],
    ...body,
    id: list[idx].id,
    createdAt: list[idx].createdAt,
    updatedAt: now(),
  }
  list[idx] = updated
  savePresentations(list)
  res.json(ok(updated))
})

slidesRouter.delete('/presentations/:id', (req, res) => {
  const list = getPresentations()
  const target = list.find(x => x.id === req.params.id)
  if (!target) return res.status(404).json(err('Presentatie niet gevonden', 404))

  // Cleanup afbeeldingen die exclusief van deze presentatie zijn
  const otherImageSrcs = new Set<string>()
  for (const p of list) {
    if (p.id === target.id) continue
    for (const s of p.slides) {
      for (const el of s.content.elements) {
        if (el.type === 'image') otherImageSrcs.add(el.src)
      }
    }
  }
  for (const s of target.slides) {
    for (const el of s.content.elements) {
      if (el.type === 'image' && !otherImageSrcs.has(el.src)) {
        const full = path.resolve(__dirname, '../../data', el.src)
        if (fs.existsSync(full)) {
          try { fs.unlinkSync(full) } catch { /* ignore */ }
        }
      }
    }
  }

  savePresentations(list.filter(x => x.id !== target.id))
  res.json(ok({ deleted: true }))
})

// ---------- Slide-niveau helpers binnen presentatie ----------

// POST /presentations/:id/slides – nieuwe slide o.b.v. layout
slidesRouter.post('/presentations/:id/slides', (req, res) => {
  const list = getPresentations()
  const idx = list.findIndex(x => x.id === req.params.id)
  if (idx < 0) return res.status(404).json(err('Presentatie niet gevonden', 404))

  const layout = (req.body?.layout as SlideLayoutType) || 'blank'
  const presetContent = req.body?.content as SlideContent | undefined

  const slide: Slide = {
    id: genId(),
    presentationId: list[idx].id,
    order: list[idx].slides.length,
    layout,
    content: presetContent ? deepCloneContent(presetContent) : defaultContent(layout),
  }
  list[idx].slides.push(slide)
  list[idx].updatedAt = now()
  savePresentations(list)
  res.json(ok(list[idx]))
})

// ============================================================
// Presets
// ============================================================

slidesRouter.get('/presets', (_req, res) => {
  res.json(ok(readCollection<SlidePreset>(PRESETS)))
})

slidesRouter.post('/presets', (req, res) => {
  const list = readCollection<SlidePreset>(PRESETS)
  const body = req.body as Partial<SlidePreset>
  if (!body.layout || !body.content) {
    return res.status(400).json(err('Layout en content zijn verplicht'))
  }
  const preset: SlidePreset = {
    id: genId(),
    name: body.name?.trim() || 'Naamloze preset',
    layout: body.layout,
    content: deepCloneContent(body.content),
    createdAt: now(),
  }
  list.push(preset)
  writeCollection(PRESETS, list)
  res.json(ok(preset))
})

slidesRouter.delete('/presets/:id', (req, res) => {
  const list = readCollection<SlidePreset>(PRESETS)
  const target = list.find(x => x.id === req.params.id)
  if (!target) return res.status(404).json(err('Preset niet gevonden', 404))
  writeCollection(PRESETS, list.filter(x => x.id !== req.params.id))
  res.json(ok({ deleted: true }))
})

// ============================================================
// Image upload
// ============================================================

slidesRouter.post('/uploads/image', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json(err('Geen afbeelding ontvangen'))
  const relativePath = `uploads/slides-free/${req.file.filename}`
  res.json(ok({ src: relativePath }))
})

// ============================================================
// PPTX Export
// ============================================================

slidesRouter.post('/presentations/:id/export-pptx', async (req, res) => {
  const presentation = getPresentations().find(x => x.id === req.params.id)
  if (!presentation) return res.status(404).json(err('Presentatie niet gevonden', 404))

  try {
    const pptx = new PptxGenJS()
    pptx.defineLayout({ name: 'PIENTER', width: CANVAS_W, height: CANVAS_H })
    pptx.layout = 'PIENTER'
    pptx.title = presentation.name

    const sortedSlides = [...presentation.slides].sort((a, b) => a.order - b.order)

    for (const slideData of sortedSlides) {
      const slide = pptx.addSlide()
      if (slideData.content.background) {
        slide.background = { color: slideData.content.background }
      }

      for (const el of slideData.content.elements) {
        if (el.type === 'text') {
          slide.addText(el.value, {
            x: el.x, y: el.y, w: el.w, h: el.h,
            fontSize: el.fontSize,
            bold: !!el.bold,
            italic: !!el.italic,
            color: el.color,
            align: el.align,
            valign: 'top',
          })
        } else if (el.type === 'image') {
          const fullPath = path.resolve(__dirname, '../../data', el.src)
          if (fs.existsSync(fullPath)) {
            slide.addImage({
              path: fullPath,
              x: el.x, y: el.y, w: el.w, h: el.h,
            })
          }
        }
      }
    }

    const buffer = (await pptx.write({ outputType: 'nodebuffer' })) as Buffer
    const safeName = presentation.name.replace(/[^a-z0-9-_ ]/gi, '_').trim() || 'presentatie'

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation')
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}.pptx"`)
    res.send(buffer)
  } catch (e) {
    console.error('PPTX export fout:', e)
    res.status(500).json(err('PPTX export mislukt'))
  }
})
