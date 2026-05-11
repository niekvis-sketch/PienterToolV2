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

// ---------- Klanten ----------
export type KlantStatus = 'prospect' | 'actief' | 'inactief' | 'voormalig'
export type KlantCommunicatieType = 'email' | 'telefoon' | 'meeting' | 'notitie' | 'offerte' | 'contract'

export interface Klant {
  id: string
  naam: string
  status: KlantStatus
  notities: string
  // Klantinformatie - primaire contactpersoon
  contactpersoon: string
  email: string
  telefoon: string
  website: string
  kvkNummer: string
  adres: string
  stad: string
  sector: string
  // Merk & identiteit
  merkverhaal: string
  toneOfVoice: string
  kernwaarden: string
  // Commercieel
  contractType: string
  contractWaarde: number | null
  contractStartdatum: string | null
  contractEinddatum: string | null
  facturatiemethode: string
  betaaltermijn: number | null
  // Markt & positionering (voorheen Strategisch)
  doelstellingen: string
  uitdagingen: string
  kansen: string
  concurrenten: string
  positionering: string
  createdAt: string
  updatedAt: string
}

export interface KlantCommunicatie {
  id: string
  klantId: string
  type: KlantCommunicatieType
  datum: string
  samenvatting: string
  details: string
  medewerker: string
  createdAt: string
}

// Aanvullende contactpersonen (naast primaire op Klant)
export interface KlantContactpersoon {
  id: string
  klantId: string
  naam: string
  rol: string
  email: string
  telefoon: string
  opmerkingen: string
  createdAt: string
  updatedAt: string
}

// Geüploade huisstijlbestanden (logo, kleuren, fonts, brandbook etc.)
export interface KlantHuisstijlBestand {
  id: string
  klantId: string
  bestandsnaam: string
  filePath: string
  mimeType: string
  grootte: number
  beschrijving: string
  createdAt: string
}

// Doelgroep / persona op klantniveau (los van project-doelgroepen)
export interface KlantDoelgroep {
  id: string
  klantId: string
  naam: string
  omschrijving: string
  persona: string
  pijnpunten: string
  createdAt: string
  updatedAt: string
}

// Doelen
export type KlantDoelType = 'kort' | 'lang'
export type KlantDoelTeam = 'seo' | 'content' | 'advertising' | 'website' | 'overig'

export interface KlantDoel {
  id: string
  klantId: string
  titel: string
  beschrijving: string
  type: KlantDoelType
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface KlantDoelFocuspunt {
  id: string
  doelId: string
  klantId: string
  maand: string // formaat YYYY-MM
  beschrijving: string
  team: KlantDoelTeam
  voltooid: boolean
  createdAt: string
  updatedAt: string
}

// ---------- Medewerkers ----------
// Hergebruikt KlantDoelTeam als gedeelde Team-enum; alias zodat bestaande imports
// blijven werken.
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

// ---------- Content Structuur Document ----------
export type ContentRowStatus = 'niet-gestart' | 'in-progress' | 'klaar' | 'review'

export interface ContentStructuurRow {
  id: string
  projectId: string
  siteNodeId?: string | null
  naamPagina: string
  zoektermen: string
  tekstKlaar: boolean
  wiePlaatst: string
  status: ContentRowStatus
  watMistNog: string
  nieuweUrl: string
  slug: string
  metaTitel: string
  metaDescription: string
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface ContentStructuurPreset {
  id: string
  projectId: string
  name: string
  visibleColumns: string[]  // keys van ContentStructuurRow velden
  createdAt: string
}

// ============================================================
// Slides – freeform presentatie editor (pptx export)
// ============================================================

export type SlideLayoutType =
  | 'title_only'
  | 'title_content'
  | 'two_column'
  | 'image_text'
  | 'full_image'
  | 'blank'

export type SlideAlign = 'left' | 'center' | 'right'

export interface SlideTextElement {
  id: string
  type: 'text'
  slot: string
  value: string
  x: number
  y: number
  w: number
  h: number
  fontSize: number
  bold?: boolean
  italic?: boolean
  color: string // hex zonder #, e.g. "1F2937"
  align: SlideAlign
}

export interface SlideImageElement {
  id: string
  type: 'image'
  slot: string
  src: string // relatief pad zoals "uploads/slides-free/abc.png"
  x: number
  y: number
  w: number
  h: number
}

export type SlideElement = SlideTextElement | SlideImageElement

export interface SlideContent {
  elements: SlideElement[]
  background: string // hex zonder #
}

export interface Slide {
  id: string
  presentationId: string
  order: number
  layout: SlideLayoutType
  content: SlideContent
}

export interface SlidePresentation {
  id: string
  name: string
  slides: Slide[]
  createdAt: string
  updatedAt: string
}

export interface SlidePreset {
  id: string
  name: string
  layout: SlideLayoutType
  content: SlideContent
  createdAt: string
}

// ---------- API Responses ----------
export interface ApiResponse<T> {
  ok: boolean
  data?: T
  error?: string
}
