// ============================================================
// Klanten Routes – CRUD + communicatie
// ============================================================
import { Router, Request, Response } from 'express'
import { readCollection, writeCollection } from '../storage'
import { genId, now, ok, err } from '../helpers'
import type { Klant, KlantCommunicatie } from '../../../shared/types'

export const klantenRouter = Router()

// ---------- helpers ----------
function getKlanten(): Klant[] { return readCollection<Klant>('klanten') }
function saveKlanten(k: Klant[]) { writeCollection('klanten', k) }
function getCommunicatie(): KlantCommunicatie[] { return readCollection<KlantCommunicatie>('klantCommunicatie') }
function saveCommunicatie(c: KlantCommunicatie[]) { writeCollection('klantCommunicatie', c) }

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
  const klant: Klant = {
    id: genId(),
    naam: req.body.naam || 'Nieuwe klant',
    status: req.body.status || 'prospect',
    notities: req.body.notities || '',
    contactpersoon: req.body.contactpersoon || '',
    email: req.body.email || '',
    telefoon: req.body.telefoon || '',
    website: req.body.website || '',
    kvkNummer: req.body.kvkNummer || '',
    adres: req.body.adres || '',
    stad: req.body.stad || '',
    sector: req.body.sector || '',
    contractType: req.body.contractType || '',
    contractWaarde: req.body.contractWaarde ?? null,
    contractStartdatum: req.body.contractStartdatum || null,
    contractEinddatum: req.body.contractEinddatum || null,
    facturatiemethode: req.body.facturatiemethode || '',
    betaaltermijn: req.body.betaaltermijn ?? null,
    doelstellingen: req.body.doelstellingen || '',
    uitdagingen: req.body.uitdagingen || '',
    kansen: req.body.kansen || '',
    concurrenten: req.body.concurrenten || '',
    positionering: req.body.positionering || '',
    createdAt: now(),
    updatedAt: now(),
  }
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
  let klanten = getKlanten()
  klanten = klanten.filter(k => k.id !== req.params.id)
  saveKlanten(klanten)
  // Verwijder ook bijbehorende communicatie
  let comm = getCommunicatie()
  comm = comm.filter(c => c.klantId !== req.params.id)
  saveCommunicatie(comm)
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
    medewerker: req.body.medewerker || '',
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
  let comm = getCommunicatie()
  comm = comm.filter(c => !(c.id === req.params.commId && c.klantId === req.params.id))
  saveCommunicatie(comm)
  res.json(ok({ deleted: true }))
})
