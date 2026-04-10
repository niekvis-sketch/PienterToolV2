// ============================================================
// Pienter Website Proces Portaal – Gedeelde TypeScript types
// Gebruikt door zowel /client als /server
// ============================================================

// ---------- Project ----------
export interface Project {
  id: string
  name: string
  clientName: string
  domainCurrent: string
  domainNew: string
  languages: ('nl' | 'en')[]
  goLiveDate: string | null
  createdAt: string
  // Instellingen voor auditor
  stagingNoindex: boolean
  gtmConnected: boolean
  eventsDefined: boolean
}

// ---------- Pages ----------
export type PageType = 'page' | 'post' | 'archive' | 'case'
export type PageStatus = 'draft' | 'content-ready' | 'design-ready' | 'dev-ready' | 'staged' | 'live'

export interface Page {
  id: string
  projectId: string
  title: string
  parentId: string | null
  slug: string
  fullUrl: string
  type: PageType
  status: PageStatus
  notes: string
  level: number
}

// ---------- SEO Fields ----------
export interface SEOFields {
  pageId: string
  metaTitle: string
  metaDescription: string
  focusTopic: string
  redirectsFrom: string[]
}

// ---------- Structuur Import ----------
export interface StructureBlockNode {
  name: string
  type: BlockType | string
  goal?: string
  contentDescription?: string
}

export interface StructureNode {
  title: string
  slug: string
  type?: PageType
  children?: StructureNode[]
  blocks?: StructureBlockNode[]
}

export interface StructureImport {
  root: StructureNode[]
}

export interface StructureImportResult {
  nodes: SiteNode[]
  blocks: PageBlock[]
}

// ============================================================
// Websitestructuur Bepalen – 3-fasen systeem
// ============================================================

// ---------- Fase-tracking ----------
export type StructuurFase = 1 | 2 | 3

export interface StructuurProgress {
  id: string
  projectId: string
  currentFase: StructuurFase
  fase1Complete: boolean
  fase2Complete: boolean
  fase3Complete: boolean
  updatedAt: string
}

// ---------- Doelgroepen & Customer Journey Vragen ----------
export type JourneyFase = 'see' | 'think' | 'do' | 'care'

export interface Doelgroep {
  id: string
  projectId: string
  name: string
  description: string
  createdAt: string
}

export interface DoelgroepVraag {
  id: string
  projectId: string
  doelgroepId: string
  fase: JourneyFase
  text: string
  answer: string
  webpagina: string
  opmerkingen: string
  sortOrder: number
  createdAt: string
}

// ---------- Fase 1: User Stories & Klantvragen ----------
export interface UserStory {
  id: string
  projectId: string
  title: string
  asA: string          // "Als een [doelgroep]"
  iWant: string        // "wil ik [actie]"
  soThat: string       // "zodat ik [doel]"
  sourceId: string | null  // koppeling naar Bronnen-tab
  tags: string[]
  createdAt: string
}

export type QuestionStatus = 'open' | 'answered' | 'assumption' | 'insight'
export type QuestionGroup = 'navigatie' | 'doelgroep' | 'content' | 'seo' | 'functionaliteit' | 'beeldmateriaal' | 'conversie'

export interface ClientQuestion {
  id: string
  projectId: string
  userStoryId: string | null
  question: string
  answer: string
  status: QuestionStatus
  group: QuestionGroup
  impactOnStructure: string   // korte notitie over gevolgen voor structuur
  createdAt: string
}

export interface Fase1Summary {
  id: string
  projectId: string
  mainTopics: string[]           // hoofdonderwerpen die terugkomen
  uncertainTopics: string[]      // onderdelen die nog onzeker zijn
  seoImportantPages: string[]    // pagina's belangrijk voor vindbaarheid
  bundleOpportunities: string[]  // onderwerpen die gebundeld kunnen worden
  pendingFromClient: string[]    // wat klant nog moet aanleveren
  generatedAt: string
}

// ---------- Fase 2: Sitestructuur & Navigatie ----------
export type SiteNodeType = 'page' | 'post' | 'archive' | 'case' | 'utility' | 'landing' | 'service' | 'branch' | 'blog' | 'detail-template'
export type SiteNodeGoal = 'informeren' | 'overtuigen' | 'converteren'
export type SiteNodePriority = 'hoog' | 'middel' | 'laag'
export type SiteNodeLabel = 'nieuw' | 'bestaand' | 'herschrijven' | 'migreren' | 'onderzoeken' | 'fase-1' | 'fase-2'
export type ContentStatus = 'niet-gestart' | 'in-progress' | 'klaar' | 'review'

export interface SiteNode {
  id: string
  projectId: string
  parentId: string | null
  title: string
  slug: string
  fullUrl: string
  level: number
  sortOrder: number
  // Uitgebreide velden
  type: SiteNodeType
  goal: SiteNodeGoal | null
  targetAudience: string
  reasonExists: string          // "waarom bestaat deze pagina?"
  isInMainNav: boolean
  isDetailTemplate: boolean
  isParked: boolean             // tijdelijk geparkeerd
  priority: SiteNodePriority
  label: SiteNodeLabel
  contentStatus: ContentStatus
  // SEO
  focusTopic: string
  metaTitle: string
  metaDescription: string
  redirectsFrom: string[]       // oude URL's
  needsRedirect: boolean
  // Koppelingen
  relatedUserStoryIds: string[]
  openQuestionIds: string[]     // open vragen uit fase 1
  notes: string
  // Timestamps
  createdAt: string
  updatedAt: string
}

export interface StructureWarning {
  type: 'duplicate' | 'no-goal' | 'too-deep' | 'orphan' | 'name-slug-mismatch' | 'content-overlap' | 'merge-candidate' | 'internal-name' | 'no-focus' | 'needs-research'
  severity: 'info' | 'warning' | 'error'
  nodeId: string
  relatedNodeId?: string
  message: string
}

export interface UrlChange {
  nodeId: string
  oldUrl: string
  newUrl: string
  childrenAffected: number
  needsRedirect: boolean
}

// ---------- Fase 3: Pagina-indeling (Blokken) ----------
export type BlockType = 'hero' | 'introductie' | 'usp' | 'dienst-uitleg' | 'stappenplan' | 'cases' | 'reviews' | 'faq' | 'cta' | 'contact' | 'formulier' | 'afbeelding-tekst' | 'branche-overzicht' | 'gerelateerde-paginas' | 'video' | 'prijzen' | 'team' | 'statistieken' | 'custom'

export interface PageBlock {
  id: string
  projectId: string
  siteNodeId: string
  sortOrder: number
  name: string
  type: BlockType
  goal: string
  targetUser: string           // voor welke gebruiker/vraag
  contentDescription: string   // welke content moet hierin
  componentPattern: string     // welk component/patroon past
  isReusable: boolean          // herbruikbaar blok?
  reusableBlockId: string | null // verwijst naar origineel blok als hergebruikt
  notesContent: string
  notesSeo: string
  notesDesign: string
  // Koppelingen fase 1
  answersQuestionIds: string[]  // beantwoordt klantvraag X
  forUserStoryIds: string[]     // voor userstory Y
  createdAt: string
}

// ---------- Componenten (ACF blokken) ----------
export type ComponentCategory = 'broodblok' | 'flexblok' | 'posttype'

export interface ComponentBlock {
  id: string
  projectId: string
  name: string
  category: ComponentCategory
  description: string
  imagePath: string        // relatief pad naar geüploade afbeelding
  createdAt: string
  updatedAt: string
}

// ---------- Wijzigingslog ----------
export interface ChangeLogEntry {
  id: string
  projectId: string
  timestamp: string
  action: 'added' | 'moved' | 'renamed' | 'deleted' | 'url-changed' | 'block-added' | 'block-removed' | 'merged' | 'split'
  entityType: 'siteNode' | 'pageBlock'
  entityId: string
  entityTitle: string
  details: string          // bijv. "Verplaatst van /diensten naar /oplossingen"
  oldValue?: string
  newValue?: string
}

// ---------- Presentatiemodus ----------
export type PresentatieSlideType =
  | 'introductie'
  | 'visie'
  | 'missie'
  | 'klantreis'
  | 'doelgroepen'
  | 'merkwaarden'
  | 'kernwaarden'
  | 'doelgroeppaspoort'

export interface PresentatieSlideConfig {
  type: PresentatieSlideType
  enabled: boolean
  sortOrder: number
}

export interface PresentatieSessie {
  id: string
  projectId: string
  name: string
  style: 'light' | 'dark' | 'pienter'
  slides: PresentatieSlideConfig[]
  // Slide-inhoud
  visie: string
  missie: string
  merkwaarden: string[]
  kernwaarden: string[]
  doelgroepPaspoorten: DoelgroepPaspoort[]
  createdAt: string
  updatedAt: string
}

export interface DoelgroepPaspoort {
  id: string
  doelgroepId: string
  leeftijd: string
  functie: string
  opleiding: string
  bedrijfsgrootte: string
  beslisser: boolean | null
  brancheklimaat: string
  mediakanalen: string[]
  gender: string
}

// ---------- API Responses ----------
export interface ApiResponse<T> {
  ok: boolean
  data?: T
  error?: string
}
