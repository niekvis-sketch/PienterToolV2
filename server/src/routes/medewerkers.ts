// ============================================================
// Medewerkers Routes – CRUD + avatar-upload
// ============================================================
import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { readCollection, writeCollection } from '../storage'
import { genId, now, ok, err } from '../helpers'
import type {
  Medewerker,
  Klant,
  KlantCommunicatie,
  KlantDoelFocuspunt,
  Project,
  ContentStructuurRow,
} from '../../../shared/types'

export const medewerkersRouter = Router()

// ---------- Multer config voor avatar uploads ----------
const AVATAR_DIR = path.resolve(__dirname, '../../data/uploads/medewerkers')
if (!fs.existsSync(AVATAR_DIR)) fs.mkdirSync(AVATAR_DIR, { recursive: true })

const avatarUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, AVATAR_DIR),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname)
      cb(null, `${genId()}-${Date.now()}${ext}`)
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
})

// ---------- helpers ----------
function getMedewerkers(): Medewerker[] { return readCollection<Medewerker>('medewerkers') }
function saveMedewerkers(m: Medewerker[]) { writeCollection('medewerkers', m) }

function defaultMedewerkerFields(body: Partial<Medewerker>): Medewerker {
  return {
    id: genId(),
    naam: body.naam || '',
    email: body.email || '',
    functie: body.functie || '',
    team: body.team || 'overig',
    avatarPath: body.avatarPath ?? null,
    createdAt: now(),
    updatedAt: now(),
  }
}

// ===================== MEDEWERKERS =====================

// LIST
medewerkersRouter.get('/', (_req, res) => res.json(ok(getMedewerkers())))

// GET by id
medewerkersRouter.get('/:id', (req, res) => {
  const m = getMedewerkers().find(x => x.id === req.params.id)
  if (!m) return res.status(404).json(err('Medewerker niet gevonden'))
  res.json(ok(m))
})

// CREATE
medewerkersRouter.post('/', (req, res) => {
  const list = getMedewerkers()
  const m = defaultMedewerkerFields(req.body)
  list.push(m)
  saveMedewerkers(list)
  res.json(ok(m))
})

// UPDATE
medewerkersRouter.put('/:id', (req, res) => {
  const list = getMedewerkers()
  const idx = list.findIndex(x => x.id === req.params.id)
  if (idx < 0) return res.status(404).json(err('Medewerker niet gevonden'))
  list[idx] = {
    ...list[idx],
    ...req.body,
    id: list[idx].id,
    createdAt: list[idx].createdAt,
    updatedAt: now(),
  }
  saveMedewerkers(list)
  res.json(ok(list[idx]))
})

// DELETE — cascade naar andere collecties komt in fase B/C
medewerkersRouter.delete('/:id', (req, res) => {
  const id = req.params.id
  const list = getMedewerkers()
  const target = list.find(x => x.id === id)
  if (!target) return res.status(404).json(err('Medewerker niet gevonden'))

  // Verwijder avatar-bestand als aanwezig
  if (target.avatarPath) {
    const fp = path.resolve(__dirname, '../../data', target.avatarPath)
    if (fs.existsSync(fp)) {
      try { fs.unlinkSync(fp) } catch { /* swallow */ }
    }
  }

  saveMedewerkers(list.filter(x => x.id !== id))

  // Cascade naar FK's in andere collecties — zet op null waar gekoppeld.
  const comms = readCollection<KlantCommunicatie>('klantCommunicatie')
  let commsChanged = false
  for (const c of comms) {
    if (c.medewerkerId === id) { c.medewerkerId = null; commsChanged = true }
  }
  if (commsChanged) writeCollection('klantCommunicatie', comms)

  const focuspunten = readCollection<KlantDoelFocuspunt>('klantFocuspunten')
  let fpChanged = false
  for (const f of focuspunten) {
    if (f.assigneeId === id) { f.assigneeId = null; fpChanged = true }
  }
  if (fpChanged) writeCollection('klantFocuspunten', focuspunten)

  const klanten = readCollection<Klant>('klanten')
  let klChanged = false
  for (const k of klanten) {
    if (k.accountManagerId === id) { k.accountManagerId = null; klChanged = true }
  }
  if (klChanged) writeCollection('klanten', klanten)

  const projects = readCollection<Project>('projects')
  let projChanged = false
  for (const p of projects) {
    if (p.ownerId === id) { p.ownerId = null; projChanged = true }
  }
  if (projChanged) writeCollection('projects', projects)

  const rows = readCollection<ContentStructuurRow>('contentStructuur')
  let rowsChanged = false
  for (const r of rows) {
    if (r.wiePlaatstId === id) { r.wiePlaatstId = null; rowsChanged = true }
  }
  if (rowsChanged) writeCollection('contentStructuur', rows)

  res.json(ok({ deleted: true }))
})

// AVATAR UPLOAD
medewerkersRouter.post('/:id/avatar', avatarUpload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json(err('Geen bestand'))
  const list = getMedewerkers()
  const idx = list.findIndex(x => x.id === req.params.id)
  if (idx < 0) return res.status(404).json(err('Medewerker niet gevonden'))

  // Oud avatarbestand verwijderen indien aanwezig
  const old = list[idx].avatarPath
  if (old) {
    const fp = path.resolve(__dirname, '../../data', old)
    if (fs.existsSync(fp)) {
      try { fs.unlinkSync(fp) } catch { /* swallow */ }
    }
  }

  list[idx].avatarPath = `uploads/medewerkers/${req.file.filename}`
  list[idx].updatedAt = now()
  saveMedewerkers(list)
  res.json(ok(list[idx]))
})
