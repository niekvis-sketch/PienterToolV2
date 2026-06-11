// ============================================================
// Concurrenten Routes – inputbron per project
// Pagina's & functionaliteit per concurrent + doorzet-log naar Fase 1/2.
// Opslag: data/concurrenten/{projectId}.json  ({ concurrenten, doorzetten })
// ============================================================
import { Router, Request, Response } from 'express'
import { readProjectDoc, writeProjectDoc } from '../storage'
import { genId, now, ok, err } from '../helpers'
import type {
  Concurrent, ConcurrentPagina, ConcurrentFunctie, Doorzet, ConcurrentenDoc,
} from '../../../shared/types'

// Gemount op /api/projects (na projectRouter) — vandaar het /:projectId-prefix.
export const concurrentenRouter = Router()

const COLLECTION = 'concurrenten'
const EMPTY: ConcurrentenDoc = { concurrenten: [], doorzetten: [] }

function loadDoc(projectId: string): ConcurrentenDoc {
  const doc = readProjectDoc<ConcurrentenDoc>(COLLECTION, projectId, EMPTY)
  // Defensief: garandeer arrays.
  return { concurrenten: doc.concurrenten || [], doorzetten: doc.doorzetten || [] }
}
function saveDoc(projectId: string, doc: ConcurrentenDoc) {
  writeProjectDoc(COLLECTION, projectId, doc)
}

function normLabel(naam: string): string {
  return (naam || '').trim().toLowerCase()
}

// ===================== CONCURRENTEN (CRUD) =====================

// GET /:projectId/concurrenten → { concurrenten, doorzetten }
concurrentenRouter.get('/:projectId/concurrenten', (req: Request, res: Response) => {
  res.json(ok(loadDoc(req.params.projectId)))
})

// POST /:projectId/concurrenten
concurrentenRouter.post('/:projectId/concurrenten', (req: Request, res: Response) => {
  const naam = (req.body.naam || '').trim()
  if (!naam) return res.status(400).json(err('Naam is verplicht'))
  const doc = loadDoc(req.params.projectId)
  const item: Concurrent = {
    id: genId(),
    projectId: req.params.projectId,
    naam,
    url: req.body.url || '',
    notitie: req.body.notitie || '',
    paginas: [],
    functies: [],
    createdAt: now(),
    updatedAt: now(),
  }
  doc.concurrenten.push(item)
  saveDoc(req.params.projectId, doc)
  res.json(ok(item))
})

// ===================== DOORZET-LOG =====================
// Let op: deze routes staan vóór /:concurrentId zodat "doorzetten" niet als
// concurrent-id wordt geïnterpreteerd.

concurrentenRouter.get('/:projectId/concurrenten/doorzetten', (req: Request, res: Response) => {
  res.json(ok(loadDoc(req.params.projectId).doorzetten))
})

concurrentenRouter.post('/:projectId/concurrenten/doorzetten', (req: Request, res: Response) => {
  const { type, label, doel, targetId } = req.body
  if (!type || !label || !doel || !targetId) {
    return res.status(400).json(err('type, label, doel en targetId zijn verplicht'))
  }
  const doc = loadDoc(req.params.projectId)
  const item: Doorzet = {
    id: genId(),
    projectId: req.params.projectId,
    type,
    label: normLabel(label),
    doel,
    targetId,
    doorgezetOp: now(),
  }
  doc.doorzetten.push(item)
  saveDoc(req.params.projectId, doc)
  res.json(ok(item))
})

concurrentenRouter.delete('/:projectId/concurrenten/doorzetten/:id', (req: Request, res: Response) => {
  const doc = loadDoc(req.params.projectId)
  const before = doc.doorzetten.length
  doc.doorzetten = doc.doorzetten.filter(d => d.id !== req.params.id)
  if (doc.doorzetten.length === before) return res.status(404).json(err('Doorzet niet gevonden'))
  saveDoc(req.params.projectId, doc)
  res.json(ok({ ok: true }))
})

// ===================== CONCURRENT (per id) =====================

function findConcurrent(doc: ConcurrentenDoc, id: string): Concurrent | undefined {
  return doc.concurrenten.find(c => c.id === id)
}

concurrentenRouter.patch('/:projectId/concurrenten/:concurrentId', (req: Request, res: Response) => {
  const doc = loadDoc(req.params.projectId)
  const c = findConcurrent(doc, req.params.concurrentId)
  if (!c) return res.status(404).json(err('Concurrent niet gevonden'))
  if (req.body.naam !== undefined) {
    const naam = (req.body.naam || '').trim()
    if (!naam) return res.status(400).json(err('Naam mag niet leeg zijn'))
    c.naam = naam
  }
  if (req.body.url !== undefined) c.url = req.body.url
  if (req.body.notitie !== undefined) c.notitie = req.body.notitie
  c.updatedAt = now()
  saveDoc(req.params.projectId, doc)
  res.json(ok(c))
})

concurrentenRouter.delete('/:projectId/concurrenten/:concurrentId', (req: Request, res: Response) => {
  const doc = loadDoc(req.params.projectId)
  const before = doc.concurrenten.length
  doc.concurrenten = doc.concurrenten.filter(c => c.id !== req.params.concurrentId)
  if (doc.concurrenten.length === before) return res.status(404).json(err('Concurrent niet gevonden'))
  // Doorzetten + nodes/vragen blijven bestaan (leven nu zelfstandig in Fase 1/2).
  saveDoc(req.params.projectId, doc)
  res.json(ok({ ok: true }))
})

// ===================== PAGINA'S (genest) =====================

concurrentenRouter.post('/:projectId/concurrenten/:concurrentId/paginas/bulk', (req: Request, res: Response) => {
  const doc = loadDoc(req.params.projectId)
  const c = findConcurrent(doc, req.params.concurrentId)
  if (!c) return res.status(404).json(err('Concurrent niet gevonden'))
  const namen: string[] = Array.isArray(req.body.namen) ? req.body.namen : []
  const created: ConcurrentPagina[] = []
  for (const raw of namen) {
    const naam = (raw || '').trim()
    if (!naam) continue
    if (c.paginas.some(p => normLabel(p.naam) === normLabel(naam))) continue // dedup
    const item: ConcurrentPagina = { id: genId(), naam }
    c.paginas.push(item)
    created.push(item)
  }
  c.updatedAt = now()
  saveDoc(req.params.projectId, doc)
  res.json(ok(created))
})

concurrentenRouter.post('/:projectId/concurrenten/:concurrentId/paginas', (req: Request, res: Response) => {
  const doc = loadDoc(req.params.projectId)
  const c = findConcurrent(doc, req.params.concurrentId)
  if (!c) return res.status(404).json(err('Concurrent niet gevonden'))
  const naam = (req.body.naam || '').trim()
  if (!naam) return res.status(400).json(err('Naam is verplicht'))
  if (c.paginas.some(p => normLabel(p.naam) === normLabel(naam))) {
    return res.status(409).json(err(`"${naam}" staat al bij deze concurrent`))
  }
  const item: ConcurrentPagina = { id: genId(), naam, url: req.body.url || '', notitie: req.body.notitie || '' }
  c.paginas.push(item)
  c.updatedAt = now()
  saveDoc(req.params.projectId, doc)
  res.json(ok(item))
})

concurrentenRouter.patch('/:projectId/concurrenten/:concurrentId/paginas/:paginaId', (req: Request, res: Response) => {
  const doc = loadDoc(req.params.projectId)
  const c = findConcurrent(doc, req.params.concurrentId)
  if (!c) return res.status(404).json(err('Concurrent niet gevonden'))
  const p = c.paginas.find(x => x.id === req.params.paginaId)
  if (!p) return res.status(404).json(err('Pagina niet gevonden'))
  if (req.body.naam !== undefined) {
    const naam = (req.body.naam || '').trim()
    if (!naam) return res.status(400).json(err('Naam mag niet leeg zijn'))
    if (c.paginas.some(x => x.id !== p.id && normLabel(x.naam) === normLabel(naam))) {
      return res.status(409).json(err(`"${naam}" staat al bij deze concurrent`))
    }
    p.naam = naam
  }
  if (req.body.url !== undefined) p.url = req.body.url
  if (req.body.notitie !== undefined) p.notitie = req.body.notitie
  c.updatedAt = now()
  saveDoc(req.params.projectId, doc)
  res.json(ok(p))
})

concurrentenRouter.delete('/:projectId/concurrenten/:concurrentId/paginas/:paginaId', (req: Request, res: Response) => {
  const doc = loadDoc(req.params.projectId)
  const c = findConcurrent(doc, req.params.concurrentId)
  if (!c) return res.status(404).json(err('Concurrent niet gevonden'))
  c.paginas = c.paginas.filter(x => x.id !== req.params.paginaId)
  c.updatedAt = now()
  saveDoc(req.params.projectId, doc)
  res.json(ok({ ok: true }))
})

// ===================== FUNCTIES (genest) =====================

concurrentenRouter.post('/:projectId/concurrenten/:concurrentId/functies/bulk', (req: Request, res: Response) => {
  const doc = loadDoc(req.params.projectId)
  const c = findConcurrent(doc, req.params.concurrentId)
  if (!c) return res.status(404).json(err('Concurrent niet gevonden'))
  const namen: string[] = Array.isArray(req.body.namen) ? req.body.namen : []
  const created: ConcurrentFunctie[] = []
  for (const raw of namen) {
    const naam = (raw || '').trim()
    if (!naam) continue
    if (c.functies.some(f => normLabel(f.naam) === normLabel(naam))) continue
    const item: ConcurrentFunctie = { id: genId(), naam }
    c.functies.push(item)
    created.push(item)
  }
  c.updatedAt = now()
  saveDoc(req.params.projectId, doc)
  res.json(ok(created))
})

concurrentenRouter.post('/:projectId/concurrenten/:concurrentId/functies', (req: Request, res: Response) => {
  const doc = loadDoc(req.params.projectId)
  const c = findConcurrent(doc, req.params.concurrentId)
  if (!c) return res.status(404).json(err('Concurrent niet gevonden'))
  const naam = (req.body.naam || '').trim()
  if (!naam) return res.status(400).json(err('Naam is verplicht'))
  if (c.functies.some(f => normLabel(f.naam) === normLabel(naam))) {
    return res.status(409).json(err(`"${naam}" staat al bij deze concurrent`))
  }
  const item: ConcurrentFunctie = { id: genId(), naam, notitie: req.body.notitie || '' }
  c.functies.push(item)
  c.updatedAt = now()
  saveDoc(req.params.projectId, doc)
  res.json(ok(item))
})

concurrentenRouter.patch('/:projectId/concurrenten/:concurrentId/functies/:functieId', (req: Request, res: Response) => {
  const doc = loadDoc(req.params.projectId)
  const c = findConcurrent(doc, req.params.concurrentId)
  if (!c) return res.status(404).json(err('Concurrent niet gevonden'))
  const f = c.functies.find(x => x.id === req.params.functieId)
  if (!f) return res.status(404).json(err('Functie niet gevonden'))
  if (req.body.naam !== undefined) {
    const naam = (req.body.naam || '').trim()
    if (!naam) return res.status(400).json(err('Naam mag niet leeg zijn'))
    if (c.functies.some(x => x.id !== f.id && normLabel(x.naam) === normLabel(naam))) {
      return res.status(409).json(err(`"${naam}" staat al bij deze concurrent`))
    }
    f.naam = naam
  }
  if (req.body.notitie !== undefined) f.notitie = req.body.notitie
  c.updatedAt = now()
  saveDoc(req.params.projectId, doc)
  res.json(ok(f))
})

concurrentenRouter.delete('/:projectId/concurrenten/:concurrentId/functies/:functieId', (req: Request, res: Response) => {
  const doc = loadDoc(req.params.projectId)
  const c = findConcurrent(doc, req.params.concurrentId)
  if (!c) return res.status(404).json(err('Concurrent niet gevonden'))
  c.functies = c.functies.filter(x => x.id !== req.params.functieId)
  c.updatedAt = now()
  saveDoc(req.params.projectId, doc)
  res.json(ok({ ok: true }))
})
