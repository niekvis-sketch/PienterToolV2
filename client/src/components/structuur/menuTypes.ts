// Menu-/navigatiebouwer (Fase 2) — types
//
// Een MenuItem verwijst via `siteNodeId` naar een echte pagina (SiteNode).
// De menu-structuur (welke pagina's, in welke volgorde en hiërarchie) wordt
// alléén in-memory in de Pinia-store bijgehouden — niet gepersisteerd.
// Zie structuurStore.ts (// Menu items (in-memory only — niet gepersisteerd)).

export interface MenuItem {
  id: string
  siteNodeId: string
  customLabel?: string
  parentId: string | null
  sortOrder: number
  expanded?: boolean
}

// Een MenuItem met berekend hiërarchie-niveau, afgeleid uit de platte lijst.
// `level` stuurt zowel de inspringing als de drag-logica.
export interface FlatMenuItem extends MenuItem {
  level: number
}

// Max diepte van het menu (Home = level 0).
export const MAX_LEVEL = 3
