# Plan: Medewerkers-entiteit + brede integratie

**Status:** niet gestart. Plan zo geschreven dat je het later (zelf of via Claude) zonder voorkennis van deze sessie kunt oppakken.

## Context

De medewerkers-pagina is nu een placeholder ("Medewerkers komt eraan" in `client/src/views/MedewerkersView.vue`) — er bestaat geen `Medewerker`-type, geen Pinia-store, geen server-route en geen `data/medewerkers.json`. Op meerdere plekken in de codebase staan al wel vrije-tekst velden of hardcoded enums die conceptueel naar medewerkers verwijzen, maar ze hangen niet aan elkaar.

**Doel:** medewerkers als zelfstandige entiteit opzetten en op alle relevante plekken in de bestaande domeinen hergebruiken (communicatie, focuspunten, klant-account-manager, project-owner, content-structuur).

## Gekozen velden voor Medewerker

| Veld | Type | Bron |
|------|------|------|
| `id` | string | gegenereerd |
| `naam` | string | input |
| `email` | string | input |
| `functie` | string | input ("SEO specialist", "Account manager", ...) |
| `team` | `Team` (zelfde waarden als `KlantDoelTeam`: `seo \| content \| advertising \| website \| overig`) | dropdown |
| `avatarPath` | string \| null | multer-upload, pad zoals `uploads/medewerkers/{id}-{ts}.jpg` |
| `createdAt` / `updatedAt` | string (ISO) | server |

**Bewust niet meegenomen:** telefoon, startdatum, dienstverband-status. Te breed scope, kan later los toegevoegd.

## Bestaande hergebruik-plekken (uit verkenning)

| # | Plek | Huidige veld | Wijziging | Fase |
|---|------|--------------|-----------|------|
| 1 | `shared/types.ts:310` `KlantCommunicatie.medewerker` | `string` | → `medewerkerId: string \| null` | B |
| 2 | `shared/types.ts:366` `KlantDoelFocuspunt` | (heeft `team`-enum, geen persoon) | nieuw veld `assigneeId: string \| null` | B |
| 3 | `shared/types.ts:268` `Klant` | (heeft `contactpersoon` = externe contact) | nieuw veld `accountManagerId: string \| null` | B |
| 4 | `Project` in `shared/types.ts` | (geen owner) | nieuw veld `ownerId: string \| null` | C |
| 5 | `shared/types.ts:388` `ContentStructuurRow.wiePlaatst` | `string` | → `wiePlaatstId: string \| null` | C |
| 6 | `ChangeLogEntry` | (geen actor) | nieuw veld `actorId: string \| null` (geblokkeerd door ontbrekend current-user-concept) | uitgesteld |

---

## Fase A — Medewerker als zelfstandige entiteit

### A1. Datamodel (`shared/types.ts`)

Voeg toe ergens naast bestaande klant-types (bijv. na `KlantDoelgroep`-block, vóór `ContentStructuur`-sectie). Hergebruik de bestaande `KlantDoelTeam`-enum als gemeenschappelijk `Team`-alias:

```ts
// ---------- Medewerkers ----------
// Hergebruikt KlantDoelTeam als gedeelde Team-enum.
// (Type-alias zodat bestaande imports blijven werken.)
export type Team = KlantDoelTeam

export interface Medewerker {
  id: string
  naam: string
  email: string
  functie: string
  team: Team
  avatarPath: string | null
  createdAt: string
  updatedAt: string
}
```

Geen rename van `KlantDoelTeam` zelf — anders breken alle bestaande imports. `Team` is alleen een gemak-alias.

### A2. Server-route — nieuw bestand `server/src/routes/medewerkers.ts`

Volg het patroon van `server/src/routes/klanten.ts`. Boilerplate:

```ts
import { Router, Request, Response } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { readCollection, writeCollection } from '../storage'
import { genId, now, ok, err } from '../helpers'
import type { Medewerker } from '../../../shared/types'

export const medewerkersRouter = Router()

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

// LIST
medewerkersRouter.get('/', (_req, res) => res.json(ok(getMedewerkers())))

// GET
medewerkersRouter.get('/:id', (req, res) => {
  const m = getMedewerkers().find(x => x.id === req.params.id)
  if (!m) return res.status(404).json(err('Medewerker niet gevonden'))
  res.json(ok(m))
})

// POST
medewerkersRouter.post('/', (req, res) => {
  const list = getMedewerkers()
  const m = defaultMedewerkerFields(req.body)
  list.push(m)
  saveMedewerkers(list)
  res.json(ok(m))
})

// PUT
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

// DELETE — cascade afhandeling toevoegen zodra fase B/C FK's bestaan
medewerkersRouter.delete('/:id', (req, res) => {
  const id = req.params.id
  const list = getMedewerkers()
  const target = list.find(x => x.id === id)
  if (target?.avatarPath) {
    const fp = path.resolve(__dirname, '../../data', target.avatarPath)
    if (fs.existsSync(fp)) { try { fs.unlinkSync(fp) } catch { /* swallow */ } }
  }
  saveMedewerkers(list.filter(x => x.id !== id))
  // TODO fase B: zet medewerkerId/assigneeId/accountManagerId op null in andere collecties
  res.json(ok({ deleted: true }))
})

// AVATAR UPLOAD
medewerkersRouter.post('/:id/avatar', avatarUpload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json(err('Geen bestand'))
  const list = getMedewerkers()
  const idx = list.findIndex(x => x.id === req.params.id)
  if (idx < 0) return res.status(404).json(err('Medewerker niet gevonden'))
  // verwijder oud bestand
  const old = list[idx].avatarPath
  if (old) {
    const fp = path.resolve(__dirname, '../../data', old)
    if (fs.existsSync(fp)) { try { fs.unlinkSync(fp) } catch { /* swallow */ } }
  }
  list[idx].avatarPath = `uploads/medewerkers/${req.file.filename}`
  list[idx].updatedAt = now()
  saveMedewerkers(list)
  res.json(ok(list[idx]))
})
```

Registreer in `server/src/index.ts` na `klantenRouter`:

```ts
import { medewerkersRouter } from './routes/medewerkers'
// ...
app.use('/api/medewerkers', medewerkersRouter)
```

### A3. Storage

- Nieuw `data/medewerkers.json` aanmaken met `[]`.
- `data/uploads/medewerkers/` directory laat de server zelf aanmaken (zie `mkdirSync` boven).

### A4. Pinia store — `client/src/stores/medewerkersStore.ts`

Patroon van `client/src/stores/klantenStore.ts`.

```ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiFetch } from '../api'
import api from '../api'
import type { Medewerker } from '@shared/types'

export const useMedewerkersStore = defineStore('medewerkers', () => {
  const medewerkers = ref<Medewerker[]>([])
  const loaded = ref(false)
  const loading = ref(false)

  async function fetchMedewerkers(force = false) {
    if (loaded.value && !force) return
    loading.value = true
    try {
      medewerkers.value = await apiFetch<Medewerker[]>('GET', '/medewerkers')
      loaded.value = true
    } finally {
      loading.value = false
    }
  }

  async function createMedewerker(data: Partial<Medewerker>) {
    const m = await apiFetch<Medewerker>('POST', '/medewerkers', data)
    medewerkers.value.push(m)
    return m
  }

  async function updateMedewerker(id: string, data: Partial<Medewerker>) {
    const m = await apiFetch<Medewerker>('PUT', `/medewerkers/${id}`, data)
    const idx = medewerkers.value.findIndex(x => x.id === id)
    if (idx >= 0) medewerkers.value[idx] = m
    return m
  }

  async function deleteMedewerker(id: string) {
    await apiFetch('DELETE', `/medewerkers/${id}`)
    medewerkers.value = medewerkers.value.filter(m => m.id !== id)
  }

  async function uploadAvatar(id: string, file: File) {
    const fd = new FormData()
    fd.append('file', file)
    const m = await api.post<{ ok: boolean; data: Medewerker }>(`/medewerkers/${id}/avatar`, fd)
    const idx = medewerkers.value.findIndex(x => x.id === id)
    if (idx >= 0) medewerkers.value[idx] = m.data.data
    return m.data.data
  }

  // Helpers voor lookup vanuit andere componenten
  const byId = computed(() => Object.fromEntries(medewerkers.value.map(m => [m.id, m])))

  function getMedewerker(id: string | null | undefined): Medewerker | null {
    if (!id) return null
    return byId.value[id] || null
  }

  return {
    medewerkers, loading, loaded,
    fetchMedewerkers, createMedewerker, updateMedewerker, deleteMedewerker, uploadAvatar,
    byId, getMedewerker,
  }
})
```

> Check de exacte axios-API in `client/src/api.ts` voordat je `api.post` gebruikt — pas de `uploadAvatar`-call eventueel aan op het bestaande patroon (kijk hoe huisstijl-upload in `client/src/stores/klantenStore.ts` is gedaan).

### A5. Herbruikbare UI-componenten

Nieuwe map `client/src/components/medewerkers/`:

**MedewerkerAvatar.vue**
```
// Props: medewerker?: Medewerker | null; medewerkerId?: string | null; size?: 'xs'|'sm'|'md'|'lg'
// Toont:
// - foto uit `/api/uploads/{avatarPath}` als avatarPath gevuld
// - anders gekleurde cirkel met initialen (eerste letter voor- + achternaam)
// - team bepaalt achtergrondkleur (seo=blauw, content=groen, advertising=oranje, website=paars, overig=grijs)
// Lost zelf op via medewerkersStore.getMedewerker(medewerkerId) als alleen id is gegeven.
// Maat-mapping: xs=20px, sm=28px, md=36px, lg=48px
```

**MedewerkerSelect.vue**
```
// Props:
//   modelValue: string | null
//   team?: Team           // optioneel: filter dropdown op team
//   allowNull?: boolean   // toon "— geen —" optie
//   placeholder?: string
// Emits: update:modelValue
// Visueel: dropdown die per regel <MedewerkerAvatar size="sm" /> + naam toont
// Implementatie: kan een simpele <select> zijn met team-prefix "[SEO] Naam", of een
// custom listbox met avatars. Begin met <select>, custom UI later als nodig.
```

**MedewerkerTag.vue**
```
// Props: medewerkerId: string | null; clickable?: boolean
// Toont: <MedewerkerAvatar size="xs" /> + naam, in een pill
// Bij clickable=true: router-link naar /medewerkers (geen detailpage in fase A)
// Bij ontbrekende medewerker: "— Onbekend —" gedimd
```

Deze drie componenten zijn dé verzilvering van "brede integratie". In fase B/C verbruikt elk hergebruik-punt één van deze drie.

### A6. MedewerkersView (`client/src/views/MedewerkersView.vue`)

Vervang placeholder door:
- Lijst-tabel met kolommen: avatar, naam, email, functie, team-badge, acties.
- Knop "Nieuwe medewerker" rechtsboven → modal of inline form (kies patroon dat het meest lijkt op `KlantContactpersonenSection`).
- Filter-balk: zoekveld (naam/email) + team-dropdown.
- Klik op rij → bewerken-modus (inline of modal).
- Bewerken-form: naam, email, functie, team, avatar-upload-knop.
- Verwijderen: confirm-dialog.

Visueel patroon: kijk naar `client/src/views/KlantenView.vue` als template.

### A7. Routing & sidebar — geen wijziging nodig

`/medewerkers` bestaat al in `client/src/router.ts` en de sidebar-link staat in `client/src/components/AppSidebar.vue`. Alleen de view-content vervangen.

### A8. Verificatie fase A

- `npm run build` (client + server) groen.
- `/medewerkers` route toont lege lijst.
- "Nieuwe medewerker" werkt: naam/email/functie/team invullen → opslaan → verschijnt in lijst.
- Avatar uploaden → wordt zichtbaar in tabel + bestand staat in `data/uploads/medewerkers/`.
- Bewerken werkt, refresh behoudt waarden.
- Verwijderen werkt, avatar-bestand wordt opgeruimd.
- Smoke-test: gebruik `<MedewerkerAvatar :medewerkerId="'<id>'" size="md" />` ergens tijdelijk om te checken dat avatar + initialen-fallback rendert.

---

## Fase B — Eerste integratie-golf (klant-domein)

Voer pas uit nadat fase A is gemerged.

### B1. `KlantCommunicatie.medewerker` → `medewerkerId`

Wijzigingen:
- `shared/types.ts` — veld hernoemen, type `string | null`.
- `server/src/routes/klanten.ts` — POST/PUT-handlers en `defaultKlantFields`-equivalent voor communicatie aanpassen.
- `client/src/components/klanten/CommunicatieHistorieTab.vue` — vrije tekstinput vervangen door `<MedewerkerSelect v-model="form.medewerkerId" :allowNull="true" />`. In de tijdlijn-display: `<MedewerkerTag :medewerkerId="item.medewerkerId" />`.
- `client/src/stores/klantenStore.ts` — types-update.

Migratie `data/klantCommunicatie.json`:
- Optie 1 (snel): alle medewerker-strings naar `null` (data-verlies).
- Optie 2 (zorgvuldig): script dat per medewerker-string een match probeert op naam in `data/medewerkers.json`. Niet-matchende waarden behouden in nieuw veld `medewerkerNaamLegacy: string` voor handmatige fix.

Beslissing tijdens uitvoer afhankelijk van data-omvang. Open `data/klantCommunicatie.json` eerst om te kijken hoeveel records er zijn.

### B2. `KlantDoelFocuspunt.assigneeId` (nieuw veld)

Wijzigingen:
- `shared/types.ts:366` — voeg toe `assigneeId: string | null`.
- `server/src/routes/klanten.ts` — focuspunt POST/PUT accepteert nieuw veld.
- `client/src/components/klanten/KlantDoelenTab.vue` — bij focuspunt-form `<MedewerkerSelect v-model="form.assigneeId" :team="form.team" :allowNull="true" placeholder="— Niemand toegewezen —" />`. In display naast de team-badge: `<MedewerkerTag :medewerkerId="fp.assigneeId" v-if="fp.assigneeId" />`.

Migratie: alle bestaande focuspunten in `data/klantFocuspunten.json` krijgen `assigneeId: null`. Eénmalige edit, vergelijkbaar met de merkverhaal-backfill uit eerdere stap.

### B3. `Klant.accountManagerId` (nieuw veld)

**Let op:** niet `Klant.contactpersoon` overschrijven — dat veld blijft de externe primaire contact bij de klant (zie zoals het in CommercieleInformatieTab/InformatieTab wordt gebruikt). `accountManagerId` is een nieuw, apart veld voor de Pienter-account-manager.

Wijzigingen:
- `shared/types.ts:268` — `Klant`-interface uitbreiden met `accountManagerId: string | null`.
- `server/src/routes/klanten.ts:56` — `defaultKlantFields` krijgt `accountManagerId: body.accountManagerId ?? null`.
- `client/src/components/klanten/KlantInformatieTab.vue` — nieuwe regel/sectie "Pienter account-manager" in Contactgegevens met `<MedewerkerSelect v-model="klant.accountManagerId" :allowNull="true" />`.
- (Optioneel) Klant-overzicht `client/src/views/KlantenView.vue` en sidebar tonen `<MedewerkerTag>` als account-manager.

Migratie `data/klanten.json`: alle drie de bestaande klanten (`klant0001`, `185571ea`, `e98dcae0`) krijgen `accountManagerId: null` toegevoegd, in de key-volgorde direct na kernwaarden. Patroon hetzelfde als de eerdere migratie van merkverhaal/toneOfVoice/kernwaarden (commit op branch `Testversie-1`).

### B4. Cascade-delete uitbreiden in `server/src/routes/medewerkers.ts`

In de DELETE-handler van Medewerker, na het verwijderen van de medewerker:
- Loop door `klantCommunicatie` → zet `medewerkerId` op `null` waar het matcht.
- Loop door `klantFocuspunten` → zet `assigneeId` op `null` waar het matcht.
- Loop door `klanten` → zet `accountManagerId` op `null` waar het matcht.

### B5. Verificatie fase B

- Communicatie aanmaken bij een klant → dropdown toont alle medewerkers → na opslaan toont tijdlijn `<MedewerkerTag>`.
- Focuspunt aanmaken bij een doel → dropdown filtert op gekozen team → tag verschijnt naast team-badge.
- Klant openen → "Pienter account-manager"-veld instelbaar; refresh behoudt waarde.
- Medewerker verwijderen → controleer dat communicatie/focuspunten/klant-records de FK op `null` hebben gezet, geen JS-errors in consumer-componenten.

---

## Fase C — Tweede integratie-golf (project + content)

### C1. `Project.ownerId`

- `shared/types.ts` `Project`-interface: `ownerId: string | null`.
- `server/src/routes/projects.ts` — defaults + POST/PUT-handlers.
- `client/src/components/klanten/KlantProjectenTab.vue` — owner-tag op project-kaart.
- Project-aanmaak-form `client/src/views/ProjectNewView.vue` — `<MedewerkerSelect>` toevoegen.
- Migratie `data/projects.json`: alle records `ownerId: null`.

### C2. `ContentStructuurRow.wiePlaatst` → `wiePlaatstId`

- `shared/types.ts:388` — vervang string-veld door `wiePlaatstId: string | null`. Optioneel `wiePlaatstLegacy?: string` houden tijdens overgang.
- `server/src/routes/contentStructuur.ts` — defaults + handlers.
- Content-tabel UI (zoek wie `wiePlaatst` rendert) — `<MedewerkerSelect>` in edit-modus, `<MedewerkerTag>` in display.
- Migratie `data/contentStructuur.json`: probeer per string-waarde een match op `medewerker.naam` (case-insensitive). Matches → `wiePlaatstId`, niet-matches → `wiePlaatstId: null` + waarde behouden in `wiePlaatstLegacy`.

### C3. Cascade-delete verder uitbreiden

In de Medewerker DELETE-handler ook `projects.ownerId` en `contentStructuur.wiePlaatstId` op `null` zetten.

### C4. Verificatie fase C

- Project-overzicht toont owner-tag.
- Content-structuur-rij toont medewerker-tag.
- Migratie-mapping correct: handmatig één record nakijken in JSON.
- Medewerker verwijderen → cascade werkt voor alle 5 FK-velden.

---

## Buiten scope (expliciet niet meenemen)

- **Authenticatie / current-user-concept** in topbar (avatar rechtsboven, "ingelogd als"-state). Vereist voor:
  - "Mijn klanten" / "mijn projecten" filter
  - `ChangeLog.actorId` zinvol invullen
- **Permission-systeem.** Apart traject. Nu pijnpunten verzamelen, niet bouwen.
- **Medewerker-detailpagina** met workload-overzicht (X open focuspunten, Y klanten, Z projecten). Mooi follow-up nadat fase B+C draaien.
- **Slide-author / UserStory-author / Pages-owner / siteNode-lastEditedBy** — laag hergebruik-potentieel volgens verkenning, niet nu.
- **HR-velden op Medewerker** (telefoon, startdatum, dienstverband-status). Voeg pas toe als er concrete UI-vraag voor is.

---

## Volledige bestanden-checklist

**Nieuw aan te maken:**
- [ ] `shared/types.ts` — `Medewerker`-interface + `Team`-alias (toevoegen, niet vervangen)
- [ ] `server/src/routes/medewerkers.ts`
- [ ] `client/src/stores/medewerkersStore.ts`
- [ ] `client/src/components/medewerkers/MedewerkerAvatar.vue`
- [ ] `client/src/components/medewerkers/MedewerkerSelect.vue`
- [ ] `client/src/components/medewerkers/MedewerkerTag.vue`
- [ ] `data/medewerkers.json` (`[]`)
- [ ] `data/uploads/medewerkers/` (auto-aangemaakt door server)

**Aan te passen:**
- [ ] `client/src/views/MedewerkersView.vue` — placeholder vervangen (fase A)
- [ ] `server/src/index.ts` — router registreren (fase A)
- [ ] `client/src/components/klanten/CommunicatieHistorieTab.vue` (fase B)
- [ ] `client/src/components/klanten/KlantDoelenTab.vue` (fase B)
- [ ] `client/src/components/klanten/KlantInformatieTab.vue` (fase B)
- [ ] `server/src/routes/klanten.ts` (fase B — communicatie/focuspunten/klant defaults)
- [ ] `data/klanten.json` (fase B-migratie: `accountManagerId: null`)
- [ ] `data/klantCommunicatie.json` (fase B-migratie)
- [ ] `data/klantFocuspunten.json` (fase B-migratie: `assigneeId: null`)
- [ ] `server/src/routes/projects.ts` (fase C)
- [ ] `client/src/components/klanten/KlantProjectenTab.vue` (fase C)
- [ ] `client/src/views/ProjectNewView.vue` (fase C)
- [ ] `data/projects.json` (fase C-migratie: `ownerId: null`)
- [ ] `server/src/routes/contentStructuur.ts` (fase C)
- [ ] `data/contentStructuur.json` (fase C-migratie: string → `wiePlaatstId`)

---

## Hergebruik-patronen uit bestaande code

| Patroon | Voorbeeld in repo |
|---------|-------------------|
| Multer-upload + uploads-directory | huisstijl in `server/src/routes/klanten.ts:19-32` |
| `default<Entity>Fields` helper | `server/src/routes/klanten.ts:56` |
| Cascade-delete | `server/src/routes/klanten.ts:124` |
| Pinia-store (CRUD-acties + state) | `client/src/stores/klantenStore.ts` |
| Sectie-component met inline CRUD | `client/src/components/klanten/KlantContactpersonenSection.vue` |
| Lijst-view met filter + tabel | `client/src/views/KlantenView.vue` |
| Bestand-upload via FormData | huisstijl-upload in `client/src/stores/klantenStore.ts` |
| `apiFetch` REST-helper | `client/src/api.ts` |

---

## Aanbevolen volgorde

1. **Fase A** volledig → mergen → smoke-test in dev → commit.
2. **Fase B** als één pakket (drie integratie-velden hangen genoeg samen om in één PR te zitten) → migratie van JSON-bestanden in dezelfde commit.
3. **Fase C** apart (raakt project + content-domein, los te reviewen).

Tussen fases: bevestig kort dat de UI nog werkt zoals verwacht (geen regressies in andere tabs).
