// ============================================================
// Klanten Routes – CRUD + sub-resources
// Sub-resources: communicatie, contactpersonen, huisstijlbestanden,
// doelgroepen, doelen, focuspunten
// ============================================================
import { Router, Request, Response } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { readCollection, writeCollection } from '../storage'
import { genId, now, ok, err } from '../helpers'
import type {
  Klant, KlantCommunicatie, KlantContactpersoon, KlantHuisstijlBestand,
  KlantBestand, KlantBestandCategorie,
  KlantDoelgroep, KlantDoel, KlantDoelFocuspunt,
} from '../../../shared/types'

export const klantenRouter = Router()

// ---------- Multer config voor huisstijl uploads ----------
const HUISSTIJL_DIR = path.resolve(__dirname, '../../data/uploads/huisstijl')
if (!fs.existsSync(HUISSTIJL_DIR)) fs.mkdirSync(HUISSTIJL_DIR, { recursive: true })

const huisstijlUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, HUISSTIJL_DIR),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname)
      cb(null, `${genId()}-${Date.now()}${ext}`)
    },
  }),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB voor brandbooks etc.
})

// ---------- Multer config voor algemene klantbestanden ----------
const BESTANDEN_DIR = path.resolve(__dirname, '../../data/uploads/klantbestanden')
if (!fs.existsSync(BESTANDEN_DIR)) fs.mkdirSync(BESTANDEN_DIR, { recursive: true })

// Uploads worden via express.static geserveerd; scripts/executables weigeren
// zodat een upload nooit als pagina of programma uitgevoerd kan worden.
const GEBLOKKEERDE_EXT = new Set([
  '.exe', '.msi', '.bat', '.cmd', '.com', '.scr', '.ps1', '.sh', '.vbs',
  '.js', '.mjs', '.html', '.htm', '.xhtml', '.php',
])
const BESTAND_CATEGORIEEN: KlantBestandCategorie[] = [
  'contract', 'offerte', 'briefing', 'rapportage', 'beeldmateriaal', 'overig',
]

const bestandenUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, BESTANDEN_DIR),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase()
      cb(null, `${genId()}-${Date.now()}${ext}`)
    },
  }),
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    if (GEBLOKKEERDE_EXT.has(ext)) return cb(new Error(`Bestandstype ${ext} is niet toegestaan`))
    cb(null, true)
  },
  limits: { fileSize: 50 * 1024 * 1024, files: 20 },
})

// Browsers sturen UTF-8 bestandsnamen, busboy leest ze als latin1.
function decodeBestandsnaam(name: string): string {
  const utf8 = Buffer.from(name, 'latin1').toString('utf8')
  return utf8.includes('�') ? name : utf8
}

function parseCategorie(v: unknown): KlantBestandCategorie {
  return BESTAND_CATEGORIEEN.includes(v as KlantBestandCategorie) ? v as KlantBestandCategorie : 'overig'
}

// ---------- helpers ----------
function getKlanten(): Klant[] { return readCollection<Klant>('klanten') }
function saveKlanten(k: Klant[]) { writeCollection('klanten', k) }

function getCommunicatie(): KlantCommunicatie[] { return readCollection<KlantCommunicatie>('klantCommunicatie') }
function saveCommunicatie(c: KlantCommunicatie[]) { writeCollection('klantCommunicatie', c) }

function getContactpersonen(): KlantContactpersoon[] { return readCollection<KlantContactpersoon>('klantContactpersonen') }
function saveContactpersonen(c: KlantContactpersoon[]) { writeCollection('klantContactpersonen', c) }

function getHuisstijl(): KlantHuisstijlBestand[] { return readCollection<KlantHuisstijlBestand>('klantHuisstijl') }
function saveHuisstijl(c: KlantHuisstijlBestand[]) { writeCollection('klantHuisstijl', c) }

function getBestanden(): KlantBestand[] { return readCollection<KlantBestand>('klantBestanden') }
function saveBestanden(c: KlantBestand[]) { writeCollection('klantBestanden', c) }

function verwijderUpload(filePath: string) {
  const fp = path.resolve(__dirname, '../../data', filePath)
  if (fs.existsSync(fp)) { try { fs.unlinkSync(fp) } catch { /* swallow */ } }
}

function getDoelgroepen(): KlantDoelgroep[] { return readCollection<KlantDoelgroep>('klantDoelgroepen') }
function saveDoelgroepen(c: KlantDoelgroep[]) { writeCollection('klantDoelgroepen', c) }

function getDoelen(): KlantDoel[] { return readCollection<KlantDoel>('klantDoelen') }
function saveDoelen(c: KlantDoel[]) { writeCollection('klantDoelen', c) }

function getFocuspunten(): KlantDoelFocuspunt[] { return readCollection<KlantDoelFocuspunt>('klantFocuspunten') }
function saveFocuspunten(c: KlantDoelFocuspunt[]) { writeCollection('klantFocuspunten', c) }

function defaultKlantFields(body: Partial<Klant>): Klant {
  return {
    id: genId(),
    naam: body.naam || 'Nieuwe klant',
    status: body.status || 'prospect',
    notities: body.notities || '',
    contactpersoon: body.contactpersoon || '',
    email: body.email || '',
    telefoon: body.telefoon || '',
    website: body.website || '',
    kvkNummer: body.kvkNummer || '',
    adres: body.adres || '',
    stad: body.stad || '',
    sector: body.sector || '',
    merkverhaal: body.merkverhaal || '',
    toneOfVoice: body.toneOfVoice || '',
    kernwaarden: body.kernwaarden || '',
    contractType: body.contractType || '',
    contractWaarde: body.contractWaarde ?? null,
    contractStartdatum: body.contractStartdatum || null,
    contractEinddatum: body.contractEinddatum || null,
    facturatiemethode: body.facturatiemethode || '',
    betaaltermijn: body.betaaltermijn ?? null,
    doelstellingen: body.doelstellingen || '',
    uitdagingen: body.uitdagingen || '',
    kansen: body.kansen || '',
    concurrenten: body.concurrenten || '',
    positionering: body.positionering || '',
    accountManagerId: body.accountManagerId ?? null,
    createdAt: now(),
    updatedAt: now(),
  }
}

// ===================== KLANTEN =====================

klantenRouter.get('/', (_req: Request, res: Response) => {
  res.json(ok(getKlanten()))
})

klantenRouter.get('/:id', (req: Request, res: Response) => {
  const klant = getKlanten().find(k => k.id === req.params.id)
  if (!klant) return res.status(404).json(err('Klant niet gevonden'))
  res.json(ok(klant))
})

klantenRouter.post('/', (req: Request, res: Response) => {
  const klanten = getKlanten()
  const klant = defaultKlantFields(req.body)
  klanten.push(klant)
  saveKlanten(klanten)
  res.json(ok(klant))
})

klantenRouter.put('/:id', (req: Request, res: Response) => {
  const klanten = getKlanten()
  const idx = klanten.findIndex(k => k.id === req.params.id)
  if (idx < 0) return res.status(404).json(err('Klant niet gevonden'))
  klanten[idx] = {
    ...klanten[idx],
    ...req.body,
    id: klanten[idx].id,
    createdAt: klanten[idx].createdAt,
    updatedAt: now(),
  }
  saveKlanten(klanten)
  res.json(ok(klanten[idx]))
})

klantenRouter.delete('/:id', (req: Request, res: Response) => {
  const id = req.params.id
  saveKlanten(getKlanten().filter(k => k.id !== id))
  saveCommunicatie(getCommunicatie().filter(c => c.klantId !== id))
  saveContactpersonen(getContactpersonen().filter(c => c.klantId !== id))

  // Cascade huisstijl: verwijder ook fysieke bestanden
  const huisstijl = getHuisstijl()
  for (const f of huisstijl.filter(h => h.klantId === id)) {
    const fp = path.resolve(__dirname, '../../data', f.filePath)
    if (fs.existsSync(fp)) { try { fs.unlinkSync(fp) } catch { /* swallow */ } }
  }
  saveHuisstijl(huisstijl.filter(h => h.klantId !== id))

  const bestanden = getBestanden()
  for (const b of bestanden.filter(x => x.klantId === id)) verwijderUpload(b.filePath)
  saveBestanden(bestanden.filter(b => b.klantId !== id))

  saveDoelgroepen(getDoelgroepen().filter(d => d.klantId !== id))
  saveFocuspunten(getFocuspunten().filter(f => f.klantId !== id))
  saveDoelen(getDoelen().filter(d => d.klantId !== id))
  res.json(ok({ deleted: true }))
})

// ===================== COMMUNICATIE =====================

klantenRouter.get('/:id/communicatie', (req: Request, res: Response) => {
  const items = getCommunicatie()
    .filter(c => c.klantId === req.params.id)
    .sort((a, b) => b.datum.localeCompare(a.datum))
  res.json(ok(items))
})

klantenRouter.post('/:id/communicatie', (req: Request, res: Response) => {
  const comm = getCommunicatie()
  const item: KlantCommunicatie = {
    id: genId(),
    klantId: req.params.id,
    type: req.body.type || 'notitie',
    datum: req.body.datum || now().slice(0, 10),
    samenvatting: req.body.samenvatting || '',
    details: req.body.details || '',
    medewerkerId: req.body.medewerkerId ?? null,
    createdAt: now(),
  }
  comm.push(item)
  saveCommunicatie(comm)
  res.json(ok(item))
})

klantenRouter.put('/:id/communicatie/:commId', (req: Request, res: Response) => {
  const comm = getCommunicatie()
  const idx = comm.findIndex(c => c.id === req.params.commId && c.klantId === req.params.id)
  if (idx < 0) return res.status(404).json(err('Communicatie niet gevonden'))
  comm[idx] = { ...comm[idx], ...req.body, id: comm[idx].id, klantId: comm[idx].klantId, createdAt: comm[idx].createdAt }
  saveCommunicatie(comm)
  res.json(ok(comm[idx]))
})

klantenRouter.delete('/:id/communicatie/:commId', (req: Request, res: Response) => {
  saveCommunicatie(getCommunicatie().filter(c => !(c.id === req.params.commId && c.klantId === req.params.id)))
  res.json(ok({ deleted: true }))
})

// ===================== CONTACTPERSONEN =====================

klantenRouter.get('/:id/contactpersonen', (req: Request, res: Response) => {
  const items = getContactpersonen()
    .filter(c => c.klantId === req.params.id)
    .sort((a, b) => a.naam.localeCompare(b.naam))
  res.json(ok(items))
})

klantenRouter.post('/:id/contactpersonen', (req: Request, res: Response) => {
  const all = getContactpersonen()
  const item: KlantContactpersoon = {
    id: genId(),
    klantId: req.params.id,
    naam: req.body.naam || '',
    rol: req.body.rol || '',
    email: req.body.email || '',
    telefoon: req.body.telefoon || '',
    opmerkingen: req.body.opmerkingen || '',
    createdAt: now(),
    updatedAt: now(),
  }
  all.push(item)
  saveContactpersonen(all)
  res.json(ok(item))
})

klantenRouter.put('/:id/contactpersonen/:cpId', (req: Request, res: Response) => {
  const all = getContactpersonen()
  const idx = all.findIndex(c => c.id === req.params.cpId && c.klantId === req.params.id)
  if (idx < 0) return res.status(404).json(err('Contactpersoon niet gevonden'))
  all[idx] = { ...all[idx], ...req.body, id: all[idx].id, klantId: all[idx].klantId, createdAt: all[idx].createdAt, updatedAt: now() }
  saveContactpersonen(all)
  res.json(ok(all[idx]))
})

klantenRouter.delete('/:id/contactpersonen/:cpId', (req: Request, res: Response) => {
  saveContactpersonen(getContactpersonen().filter(c => !(c.id === req.params.cpId && c.klantId === req.params.id)))
  res.json(ok({ deleted: true }))
})

// ===================== HUISSTIJL BESTANDEN =====================

klantenRouter.get('/:id/huisstijl', (req: Request, res: Response) => {
  const items = getHuisstijl()
    .filter(h => h.klantId === req.params.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  res.json(ok(items))
})

klantenRouter.post('/:id/huisstijl', huisstijlUpload.single('file'), (req: Request, res: Response) => {
  if (!req.file) return res.status(400).json(err('Geen bestand geüpload'))
  const all = getHuisstijl()
  const item: KlantHuisstijlBestand = {
    id: genId(),
    klantId: req.params.id,
    bestandsnaam: req.file.originalname,
    filePath: `uploads/huisstijl/${req.file.filename}`,
    mimeType: req.file.mimetype,
    grootte: req.file.size,
    beschrijving: req.body.beschrijving || '',
    createdAt: now(),
  }
  all.push(item)
  saveHuisstijl(all)
  res.json(ok(item))
})

klantenRouter.put('/:id/huisstijl/:fileId', (req: Request, res: Response) => {
  const all = getHuisstijl()
  const idx = all.findIndex(h => h.id === req.params.fileId && h.klantId === req.params.id)
  if (idx < 0) return res.status(404).json(err('Bestand niet gevonden'))
  // Alleen beschrijving via PUT te wijzigen, rest blijft immutabel
  all[idx] = { ...all[idx], beschrijving: req.body.beschrijving ?? all[idx].beschrijving }
  saveHuisstijl(all)
  res.json(ok(all[idx]))
})

klantenRouter.delete('/:id/huisstijl/:fileId', (req: Request, res: Response) => {
  const all = getHuisstijl()
  const item = all.find(h => h.id === req.params.fileId && h.klantId === req.params.id)
  if (!item) return res.status(404).json(err('Bestand niet gevonden'))
  const fp = path.resolve(__dirname, '../../data', item.filePath)
  if (fs.existsSync(fp)) { try { fs.unlinkSync(fp) } catch { /* swallow */ } }
  saveHuisstijl(all.filter(h => h.id !== item.id))
  res.json(ok({ deleted: true }))
})

// ===================== KLANTBESTANDEN (alle bestandstypes) =====================

klantenRouter.get('/:id/bestanden', (req: Request, res: Response) => {
  const items = getBestanden()
    .filter(b => b.klantId === req.params.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  res.json(ok(items))
})

klantenRouter.post('/:id/bestanden', (req: Request, res: Response) => {
  bestandenUpload.array('files', 20)(req, res, (uploadErr: unknown) => {
    if (uploadErr) {
      const msg = uploadErr instanceof multer.MulterError && uploadErr.code === 'LIMIT_FILE_SIZE'
        ? 'Bestand is groter dan 50 MB'
        : uploadErr instanceof Error ? uploadErr.message : 'Upload mislukt'
      return res.status(400).json(err(msg))
    }
    const files = (req.files as Express.Multer.File[] | undefined) ?? []
    if (files.length === 0) return res.status(400).json(err('Geen bestand geüpload'))

    const all = getBestanden()
    const categorie = parseCategorie(req.body.categorie)
    const items: KlantBestand[] = files.map(f => ({
      id: genId(),
      klantId: req.params.id,
      bestandsnaam: decodeBestandsnaam(f.originalname),
      filePath: `uploads/klantbestanden/${f.filename}`,
      mimeType: f.mimetype,
      grootte: f.size,
      categorie,
      beschrijving: req.body.beschrijving || '',
      createdAt: now(),
    }))
    all.push(...items)
    saveBestanden(all)
    res.json(ok(items))
  })
})

klantenRouter.put('/:id/bestanden/:fileId', (req: Request, res: Response) => {
  const all = getBestanden()
  const idx = all.findIndex(b => b.id === req.params.fileId && b.klantId === req.params.id)
  if (idx < 0) return res.status(404).json(err('Bestand niet gevonden'))
  // Alleen metadata wijzigbaar; het bestand zelf blijft immutabel
  all[idx] = {
    ...all[idx],
    beschrijving: req.body.beschrijving ?? all[idx].beschrijving,
    categorie: req.body.categorie !== undefined ? parseCategorie(req.body.categorie) : all[idx].categorie,
  }
  saveBestanden(all)
  res.json(ok(all[idx]))
})

klantenRouter.delete('/:id/bestanden/:fileId', (req: Request, res: Response) => {
  const all = getBestanden()
  const item = all.find(b => b.id === req.params.fileId && b.klantId === req.params.id)
  if (!item) return res.status(404).json(err('Bestand niet gevonden'))
  verwijderUpload(item.filePath)
  saveBestanden(all.filter(b => b.id !== item.id))
  res.json(ok({ deleted: true }))
})

// ===================== DOELGROEPEN (klant-niveau) =====================

klantenRouter.get('/:id/doelgroepen', (req: Request, res: Response) => {
  const items = getDoelgroepen()
    .filter(d => d.klantId === req.params.id)
    .sort((a, b) => a.naam.localeCompare(b.naam))
  res.json(ok(items))
})

klantenRouter.post('/:id/doelgroepen', (req: Request, res: Response) => {
  const all = getDoelgroepen()
  const item: KlantDoelgroep = {
    id: genId(),
    klantId: req.params.id,
    naam: req.body.naam || '',
    omschrijving: req.body.omschrijving || '',
    persona: req.body.persona || '',
    pijnpunten: req.body.pijnpunten || '',
    createdAt: now(),
    updatedAt: now(),
  }
  all.push(item)
  saveDoelgroepen(all)
  res.json(ok(item))
})

klantenRouter.put('/:id/doelgroepen/:dgId', (req: Request, res: Response) => {
  const all = getDoelgroepen()
  const idx = all.findIndex(d => d.id === req.params.dgId && d.klantId === req.params.id)
  if (idx < 0) return res.status(404).json(err('Doelgroep niet gevonden'))
  all[idx] = { ...all[idx], ...req.body, id: all[idx].id, klantId: all[idx].klantId, createdAt: all[idx].createdAt, updatedAt: now() }
  saveDoelgroepen(all)
  res.json(ok(all[idx]))
})

klantenRouter.delete('/:id/doelgroepen/:dgId', (req: Request, res: Response) => {
  saveDoelgroepen(getDoelgroepen().filter(d => !(d.id === req.params.dgId && d.klantId === req.params.id)))
  res.json(ok({ deleted: true }))
})

// ===================== DOELEN =====================

klantenRouter.get('/:id/doelen', (req: Request, res: Response) => {
  const items = getDoelen()
    .filter(d => d.klantId === req.params.id)
    .sort((a, b) => a.sortOrder - b.sortOrder)
  res.json(ok(items))
})

klantenRouter.post('/:id/doelen', (req: Request, res: Response) => {
  const all = getDoelen()
  const sortOrder = all.filter(d => d.klantId === req.params.id).length
  const item: KlantDoel = {
    id: genId(),
    klantId: req.params.id,
    titel: req.body.titel || '',
    beschrijving: req.body.beschrijving || '',
    type: req.body.type === 'lang' ? 'lang' : 'kort',
    sortOrder: req.body.sortOrder ?? sortOrder,
    createdAt: now(),
    updatedAt: now(),
  }
  all.push(item)
  saveDoelen(all)
  res.json(ok(item))
})

klantenRouter.put('/:id/doelen/:doelId', (req: Request, res: Response) => {
  const all = getDoelen()
  const idx = all.findIndex(d => d.id === req.params.doelId && d.klantId === req.params.id)
  if (idx < 0) return res.status(404).json(err('Doel niet gevonden'))
  all[idx] = { ...all[idx], ...req.body, id: all[idx].id, klantId: all[idx].klantId, createdAt: all[idx].createdAt, updatedAt: now() }
  saveDoelen(all)
  res.json(ok(all[idx]))
})

klantenRouter.delete('/:id/doelen/:doelId', (req: Request, res: Response) => {
  saveDoelen(getDoelen().filter(d => !(d.id === req.params.doelId && d.klantId === req.params.id)))
  // Cascade focuspunten
  saveFocuspunten(getFocuspunten().filter(f => f.doelId !== req.params.doelId))
  res.json(ok({ deleted: true }))
})

// ===================== FOCUSPUNTEN =====================

// Alle focuspunten voor een klant (handig voor maand-overzicht)
klantenRouter.get('/:id/focuspunten', (req: Request, res: Response) => {
  const items = getFocuspunten()
    .filter(f => f.klantId === req.params.id)
    .sort((a, b) => a.maand.localeCompare(b.maand))
  res.json(ok(items))
})

klantenRouter.post('/:id/doelen/:doelId/focuspunten', (req: Request, res: Response) => {
  const doel = getDoelen().find(d => d.id === req.params.doelId && d.klantId === req.params.id)
  if (!doel) return res.status(404).json(err('Doel niet gevonden'))
  const all = getFocuspunten()
  const item: KlantDoelFocuspunt = {
    id: genId(),
    doelId: req.params.doelId,
    klantId: req.params.id,
    maand: req.body.maand || now().slice(0, 7),
    beschrijving: req.body.beschrijving || '',
    team: req.body.team || 'overig',
    assigneeId: req.body.assigneeId ?? null,
    voltooid: !!req.body.voltooid,
    createdAt: now(),
    updatedAt: now(),
  }
  all.push(item)
  saveFocuspunten(all)
  res.json(ok(item))
})

klantenRouter.put('/:id/focuspunten/:fpId', (req: Request, res: Response) => {
  const all = getFocuspunten()
  const idx = all.findIndex(f => f.id === req.params.fpId && f.klantId === req.params.id)
  if (idx < 0) return res.status(404).json(err('Focuspunt niet gevonden'))
  all[idx] = { ...all[idx], ...req.body, id: all[idx].id, klantId: all[idx].klantId, doelId: all[idx].doelId, createdAt: all[idx].createdAt, updatedAt: now() }
  saveFocuspunten(all)
  res.json(ok(all[idx]))
})

klantenRouter.delete('/:id/focuspunten/:fpId', (req: Request, res: Response) => {
  saveFocuspunten(getFocuspunten().filter(f => !(f.id === req.params.fpId && f.klantId === req.params.id)))
  res.json(ok({ deleted: true }))
})
