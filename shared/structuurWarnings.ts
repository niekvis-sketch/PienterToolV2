// ============================================================
// Structuur-waarschuwingen (Fase 2) — pure functie, gedeeld door
// de Express-server en de statische demo-API zodat beide exact
// dezelfde controles doen.
// ============================================================
import type { SiteNode, StructureWarning } from './types'

export type WarningNode = Pick<
  SiteNode,
  'id' | 'title' | 'slug' | 'level' | 'parentId' | 'goal' | 'focusTopic' | 'isParked' | 'isDetailTemplate'
>

const SEVERITY_ORDER: Record<StructureWarning['severity'], number> = { error: 0, warning: 1, info: 2 }

const INTERNAL_PATTERNS = ['test', 'temp', 'draft', 'todo', 'tbd', 'xxx', 'pagina-']

/** Zoekwoord normaliseren: hoofdletters, witruimte en leestekens gelijktrekken. */
export function normalizeTopic(topic: string | null | undefined): string {
  return (topic ?? '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
}

/** Jaccard-overlap van de woorden in twee titels (0–1). */
export function titleOverlap(a: string, b: string): number {
  const sa = new Set(a.toLowerCase().split(/\s+/).filter(Boolean))
  const sb = new Set(b.toLowerCase().split(/\s+/).filter(Boolean))
  const inter = [...sa].filter(w => sb.has(w))
  const union = new Set([...sa, ...sb])
  return union.size === 0 ? 0 : inter.length / union.size
}

export function computeStructureWarnings(nodes: WarningNode[]): StructureWarning[] {
  const warnings: StructureWarning[] = []
  const active = nodes.filter(n => !n.isParked)

  for (const node of nodes) {
    const title = node.title ?? ''
    if (node.level > 3) {
      warnings.push({ type: 'too-deep', severity: 'warning', nodeId: node.id, message: `"${title}" hangt ${node.level} niveaus diep – overweeg om deze hoger te plaatsen.` })
    }
    if (!node.goal && !node.isParked) {
      warnings.push({ type: 'no-goal', severity: 'info', nodeId: node.id, message: `"${title}" heeft nog geen paginadoel (informeren/overtuigen/converteren).` })
    }
    if (!node.focusTopic && !node.isParked) {
      warnings.push({ type: 'no-focus', severity: 'info', nodeId: node.id, message: `"${title}" heeft nog geen focus onderwerp voor SEO.` })
    }
    if (node.parentId && !nodes.find(n => n.id === node.parentId)) {
      warnings.push({ type: 'orphan', severity: 'error', nodeId: node.id, message: `"${title}" verwijst naar een niet-bestaande bovenliggende pagina.` })
    }
    // Naam-slug mismatch (slug bevat woorden die helemaal niet in de titel voorkomen)
    if (node.slug && title) {
      const titleWords = title.toLowerCase().split(/\s+/)
      const slugWords = node.slug.replace(/-/g, ' ').toLowerCase().split(/\s+/)
      const overlap = slugWords.filter(sw => titleWords.some(tw => tw.includes(sw) || sw.includes(tw)))
      if (slugWords.length > 0 && overlap.length === 0 && !node.isDetailTemplate) {
        warnings.push({ type: 'name-slug-mismatch', severity: 'warning', nodeId: node.id, message: `De slug "${node.slug}" lijkt niet overeen te komen met de paginanaam "${title}".` })
      }
    }
    if (!node.isParked) {
      const duplicate = active.find(n => n.id !== node.id && n.title.toLowerCase() === title.toLowerCase())
      if (duplicate) {
        warnings.push({ type: 'duplicate', severity: 'warning', nodeId: node.id, relatedNodeId: duplicate.id, message: `"${title}" heeft dezelfde naam als een andere pagina – mogelijke overlap.` })
      }
    }
    if (INTERNAL_PATTERNS.some(p => title.toLowerCase().includes(p))) {
      warnings.push({ type: 'internal-name', severity: 'warning', nodeId: node.id, message: `"${title}" klinkt als een interne werknaam – overweeg een definitieve paginanaam.` })
    }
  }

  // Keyword-kannibalisatie: twee of meer actieve pagina's met hetzelfde focus-zoekwoord
  // concurreren in Google met elkaar.
  const byTopic = new Map<string, WarningNode[]>()
  for (const n of active) {
    const key = normalizeTopic(n.focusTopic)
    if (!key) continue
    byTopic.set(key, [...(byTopic.get(key) ?? []), n])
  }
  for (const group of byTopic.values()) {
    if (group.length < 2) continue
    const [first, ...rest] = group
    for (const other of rest) {
      warnings.push({
        type: 'keyword-cannibalization',
        severity: 'error',
        nodeId: first.id,
        relatedNodeId: other.id,
        message: `"${first.title}" en "${other.title}" concurreren in Google: beide pagina's richten zich op het zoekwoord "${first.focusTopic.trim()}". Voeg ze samen of geef elke pagina een eigen focus.`,
      })
    }
  }

  // Titels die sterk op elkaar lijken
  for (let i = 0; i < active.length; i++) {
    for (let j = i + 1; j < active.length; j++) {
      const a = active[i], b = active[j]
      if (a.title.toLowerCase() !== b.title.toLowerCase() && titleOverlap(a.title, b.title) > 0.6) {
        warnings.push({
          type: 'merge-candidate', severity: 'info', nodeId: a.id, relatedNodeId: b.id,
          message: `"${a.title}" en "${b.title}" lijken inhoudelijk overeen te komen – overweeg samenvoegen.`,
        })
      }
    }
  }

  return warnings.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity])
}
