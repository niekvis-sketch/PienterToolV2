// ============================================================
// Statische "nep-API" voor de read-only GitHub Pages demo.
// Bootst de Express GET-endpoints exact na op basis van de
// gebundelde demo-data (zie demoData.ts). Schrijf-acties
// (POST/PUT/PATCH/DELETE) worden vriendelijk afgehandeld als
// no-op zodat de UI niet crasht, maar er wordt niets bewaard.
// ============================================================
import { coll } from './demoData'
import { computeStructureWarnings } from '@shared/structuurWarnings'

type ApiResult = { ok: boolean; data?: any; error?: string; _status?: number }

const okR = (data: any): ApiResult => ({ ok: true, data })
const notFound = (msg: string): ApiResult => ({ ok: false, error: msg, _status: 404 })

const nowIso = () => new Date().toISOString()
const genId = () => Math.random().toString(16).slice(2, 10)

// ---------- sorteer-helpers (exact zoals de server) ----------
const byStrDesc = (k: string) => (a: any, b: any) => (b[k] ?? '').localeCompare(a[k] ?? '')
const byStrAsc = (k: string) => (a: any, b: any) => (a[k] ?? '').localeCompare(b[k] ?? '')
const byNumAsc = (k: string) => (a: any, b: any) => (a[k] ?? 0) - (b[k] ?? 0)
const byDateDesc = (k: string) => (a: any, b: any) =>
  new Date(b[k]).getTime() - new Date(a[k]).getTime()

// ============================================================
//  /structuur/:projectId/warnings  — gedeelde logica met de server
// ============================================================
function computeWarnings(projectId: string): any[] {
  return computeStructureWarnings(coll('siteNodes').filter((n) => n.projectId === projectId))
}

// ============================================================
//  GET router
// ============================================================
function handleGet(segs: string[]): ApiResult {
  const [resource, a, b, c, d] = segs

  switch (resource) {
    // ---------- klanten ----------
    case 'klanten': {
      if (!a) return okR(coll('klanten'))
      if (!b) {
        const k = coll('klanten').find((x) => x.id === a)
        return k ? okR(k) : notFound('Klant niet gevonden')
      }
      switch (b) {
        case 'communicatie':
          return okR(coll('klantCommunicatie').filter((x) => x.klantId === a).sort(byStrDesc('datum')))
        case 'contactpersonen':
          return okR(coll('klantContactpersonen').filter((x) => x.klantId === a).sort(byStrAsc('naam')))
        case 'huisstijl':
          return okR(coll('klantHuisstijl').filter((x) => x.klantId === a).sort(byStrDesc('createdAt')))
        case 'bestanden':
          return okR(coll('klantBestanden').filter((x) => x.klantId === a).sort(byStrDesc('createdAt')))
        case 'doelgroepen':
          return okR(coll('klantDoelgroepen').filter((x) => x.klantId === a).sort(byStrAsc('naam')))
        case 'doelen':
          return okR(coll('klantDoelen').filter((x) => x.klantId === a).sort(byNumAsc('sortOrder')))
        case 'focuspunten':
          return okR(coll('klantFocuspunten').filter((x) => x.klantId === a).sort(byStrAsc('maand')))
      }
      break
    }

    // ---------- projects ----------
    case 'projects': {
      if (!a) return okR(coll('projects'))
      if (!b) {
        const p = coll('projects').find((x) => x.id === a)
        return p ? okR(p) : notFound('Project niet gevonden')
      }
      if (b === 'pages') return okR(coll('pages').filter((x) => x.projectId === a))
      if (b === 'seo') {
        const pageIds = coll('pages').filter((p) => p.projectId === a).map((p) => p.id)
        return okR(coll('seoFields').filter((s) => pageIds.includes(s.pageId)))
      }
      break
    }

    // ---------- structuur ----------
    case 'structuur': {
      // a = projectId
      if (b === 'progress') {
        const found = coll('structuurProgress').find((p) => p.projectId === a)
        if (found) return okR(found)
        return okR({
          id: genId(),
          projectId: a,
          currentFase: 1,
          fase1Complete: false,
          fase2Complete: false,
          fase3Complete: false,
          updatedAt: nowIso(),
        })
      }
      if (b === 'stories') return okR(coll('userStories').filter((x) => x.projectId === a))
      if (b === 'questions') return okR(coll('clientQuestions').filter((x) => x.projectId === a))
      if (b === 'fase1-summary') {
        const s = coll('fase1Summaries').find((x) => x.projectId === a)
        return okR(s ?? null)
      }
      if (b === 'warnings') return okR(computeWarnings(a))
      if (b === 'menu') return okR(coll('menus').find((m) => m.projectId === a) ?? null)
      if (b === 'reusable-blocks')
        return okR(coll('pageBlocks').filter((x) => x.projectId === a && x.isReusable))
      if (b === 'changelog')
        return okR(coll('changeLog').filter((x) => x.projectId === a).sort(byDateDesc('timestamp')))
      if (b === 'blocks')
        return okR(coll('pageBlocks').filter((x) => x.projectId === a).sort(byNumAsc('sortOrder')))
      if (b === 'nodes') {
        // /nodes  of  /nodes/:nodeId/blocks
        if (!c) return okR(coll('siteNodes').filter((x) => x.projectId === a))
        if (d === 'blocks')
          return okR(
            coll('pageBlocks')
              .filter((x) => x.siteNodeId === c && x.projectId === a)
              .sort(byNumAsc('sortOrder')),
          )
      }
      break
    }

    // ---------- doelgroepen ----------
    case 'doelgroepen': {
      // /:projectId  of  /:projectId/:doelgroepId/vragen
      if (a && !b) return okR(coll('doelgroepen').filter((x) => x.projectId === a))
      if (a && b && c === 'vragen')
        return okR(
          coll('doelgroepVragen')
            .filter((x) => x.projectId === a && x.doelgroepId === b)
            .sort(byNumAsc('sortOrder')),
        )
      break
    }

    // ---------- componenten ----------
    case 'componenten':
      if (a) return okR(coll('components').filter((x) => x.projectId === a))
      break

    // ---------- content-structuur ----------
    case 'content-structuur': {
      if (a && b === 'presets')
        return okR(coll('contentStructuurPresets').filter((x) => x.projectId === a))
      if (a && !b)
        return okR(coll('contentStructuur').filter((x) => x.projectId === a).sort(byNumAsc('sortOrder')))
      break
    }

    // ---------- medewerkers ----------
    case 'medewerkers': {
      if (!a) return okR(coll('medewerkers'))
      const m = coll('medewerkers').find((x) => x.id === a)
      return m ? okR(m) : notFound('Medewerker niet gevonden')
    }

    // ---------- slides ----------
    case 'slides': {
      if (a === 'presentations' && !b)
        return okR(
          coll('slidePresentations').map((p) => ({
            id: p.id,
            name: p.name,
            slideCount: (p.slides ?? []).length,
            createdAt: p.createdAt,
            updatedAt: p.updatedAt,
          })),
        )
      if (a === 'presentations' && b) {
        const p = coll('slidePresentations').find((x) => x.id === b)
        return p ? okR(p) : notFound('Presentatie niet gevonden')
      }
      if (a === 'presets') return okR(coll('slidePresets'))
      break
    }

    // ---------- seed ----------
    case 'seed':
      return okR({ message: 'Demo draait read-only; data is al geladen.' })

    case 'health':
      return okR({ status: 'static-demo', time: nowIso() })
  }

  return notFound(`Onbekend endpoint: /${segs.join('/')}`)
}

// ============================================================
//  Hoofd-entry: wordt aangeroepen door de axios-adapter
// ============================================================
export function handle(method: string, url: string, body?: any): ApiResult {
  const path = (url || '').split('?')[0]
  const segs = path.replace(/^\/+/, '').replace(/\/+$/, '').split('/').filter(Boolean)

  if (method === 'GET') return handleGet(segs)

  // Schrijf-acties: vriendelijke no-op zodat de UI niet breekt.
  // Er wordt niets bewaard (read-only demo).
  if (method === 'DELETE') return okR({ ok: true })
  if (body instanceof FormData && segs[0] === 'klanten' && segs[2] === 'bestanden') {
    return { ok: false, error: 'Uploaden kan niet in de read-only demo', _status: 400 }
  }
  // POST/PUT/PATCH: echo een plausibel object terug.
  const base = body && typeof body === 'object' && !(body instanceof FormData) ? body : {}
  return okR({ id: genId(), ...base, updatedAt: nowIso(), createdAt: nowIso() })
}
