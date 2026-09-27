// Menu-/navigatiebouwer (Fase 2) — types
//
// Een MenuItem verwijst via `siteNodeId` naar een echte pagina (SiteNode).
// De menu-structuur (welke pagina's, in welke volgorde en hiërarchie) wordt per
// project op de server bewaard (GET/PUT /api/structuur/:projectId/menu). Zonder
// opgeslagen menu bouwt de store het op uit de paginastructuur.
import type { ProjectMenuItem } from '@shared/types'

export interface MenuItem extends ProjectMenuItem {
  expanded?: boolean   // alleen UI-state, wordt niet opgeslagen
}

// Een MenuItem met berekend hiërarchie-niveau, afgeleid uit de platte lijst.
// `level` stuurt zowel de inspringing als de drag-logica.
export interface FlatMenuItem extends MenuItem {
  level: number
}

// Max diepte van het menu (Home = level 0).
export const MAX_LEVEL = 3
