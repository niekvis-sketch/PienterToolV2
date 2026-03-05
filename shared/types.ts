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

// ---------- Tasks ----------
export type TeamType = 'UX' | 'Content' | 'SEO' | 'Dev' | 'PM'
export type TaskStatus = 'todo' | 'doing' | 'blocked' | 'done'

export interface Task {
  id: string
  projectId: string
  title: string
  description: string
  team: TeamType
  status: TaskStatus
  dependsOnTaskIds: string[]
  relatedPageId: string | null
  dueDate: string | null
  phase: ProjectPhase
}

export type ProjectPhase =
  | 'strategie'
  | 'inventarisatie'
  | 'structuur'
  | 'content'
  | 'design'
  | 'development'
  | 'staging'
  | 'pre-live'
  | 'live'
  | 'nazorg'

// ---------- Sources ----------
export type SourceType = 'transcript' | 'note' | 'link' | 'file'

export interface Source {
  id: string
  projectId: string
  type: SourceType
  title: string
  contentText: string
  url: string
  filePath: string
  relatedPageIds: string[]
  tags: string[]
  createdAt: string
}

// ---------- Media ----------
export type MediaSource = 'upload' | 'scrape-mock'

export interface MediaItem {
  id: string
  projectId: string
  originalName: string
  newName: string
  sizeKb: number
  dimensions: { width: number; height: number }
  altTextSuggestion: string
  relatedPageId: string | null
  source: MediaSource
  sourceLabel: string // bijv. "Instagram", "Huidige website", "Drive"
  type: 'hero' | 'card' | 'logo' | 'general'
}

// ---------- Audit ----------
export type AuditEnvironment = 'staging' | 'live'

export interface AuditRun {
  id: string
  projectId: string
  environment: AuditEnvironment
  startedAt: string
  finishedAt: string | null
  summary: AuditSummary | null
}

export interface AuditSummary {
  totalIssues: number
  high: number
  medium: number
  low: number
  score: number // 0-100
}

export type AuditSeverity = 'low' | 'medium' | 'high'
export type AuditCategory =
  | '404'
  | 'meta'
  | 'noindex'
  | 'robots'
  | 'sitemap'
  | 'images'
  | 'forms'
  | 'tracking'
  | 'performance'
  | 'redirects'
  | 'lorem'

export type AuditIssueStatus = 'open' | 'fixed' | 'ignored'

export interface AuditIssue {
  id: string
  auditRunId: string
  severity: AuditSeverity
  category: AuditCategory
  pageId: string | null
  description: string
  recommendedFix: string
  status: AuditIssueStatus
}

// ---------- Structuur Import ----------
export interface StructureNode {
  title: string
  slug: string
  type?: PageType
  children?: StructureNode[]
}

export interface StructureImport {
  root: StructureNode[]
}

// ---------- API Responses ----------
export interface ApiResponse<T> {
  ok: boolean
  data?: T
  error?: string
}
