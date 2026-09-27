import type {
  BlockType,
  ComponentCategory,
  KlantCommunicatieType,
  SiteNodeType,
} from '@shared/types'
import type { IconName } from './icons'

// Domein → Kompas-icoon. Eén plek, zodat dezelfde entiteit overal hetzelfde icoon krijgt.

export const PAGE_TYPE_ICONS: Record<SiteNodeType, IconName> = {
  page: 'file',
  post: 'news',
  archive: 'archive',
  case: 'deals',
  utility: 'settings',
  landing: 'target',
  service: 'wrench',
  branch: 'building',
  blog: 'edit',
  'detail-template': 'layout',
}

export function pageTypeIcon(type: string): IconName {
  return PAGE_TYPE_ICONS[type as SiteNodeType] ?? 'file'
}

export const BLOCK_TYPE_ICONS: Record<BlockType, IconName> = {
  hero: 'image',
  introductie: 'note',
  usp: 'star',
  'dienst-uitleg': 'wrench',
  stappenplan: 'list',
  cases: 'deals',
  reviews: 'message',
  faq: 'help',
  cta: 'target',
  contact: 'phone',
  formulier: 'clipboard',
  'afbeelding-tekst': 'image',
  'branche-overzicht': 'building',
  'gerelateerde-paginas': 'link',
  video: 'video',
  prijzen: 'money',
  team: 'contacts',
  statistieken: 'chart',
  custom: 'component',
}

export function blockTypeIcon(type: string): IconName {
  return BLOCK_TYPE_ICONS[type as BlockType] ?? 'component'
}

export const COMPONENT_CATEGORY_ICONS: Record<ComponentCategory, IconName> = {
  broodblok: 'layers',
  flexblok: 'wrench',
  posttype: 'clipboard',
}

export function componentCategoryIcon(cat: string): IconName {
  return COMPONENT_CATEGORY_ICONS[cat as ComponentCategory] ?? 'component'
}

export const COMMUNICATIE_ICONS: Record<KlantCommunicatieType, IconName> = {
  email: 'mail',
  telefoon: 'phone',
  meeting: 'handshake',
  notitie: 'note',
  offerte: 'file',
  contract: 'edit',
}

export function communicatieIcon(type: string): IconName {
  return COMMUNICATIE_ICONS[type as KlantCommunicatieType] ?? 'message'
}

/** Icoon op extensie én mimetype (browsers geven Office-bestanden soms als octet-stream door). */
export function fileTypeIcon(bestandsnaam: string, mime: string): IconName {
  const ext = bestandsnaam.includes('.') ? bestandsnaam.split('.').pop()!.toLowerCase() : ''
  if (mime.startsWith('image/')) return 'image'
  if (mime === 'application/pdf' || ext === 'pdf') return 'file'
  if (['doc', 'docx', 'odt', 'rtf', 'pages'].includes(ext)) return 'note'
  if (['xls', 'xlsx', 'ods', 'csv', 'numbers'].includes(ext)) return 'table'
  if (['ppt', 'pptx', 'odp', 'key'].includes(ext)) return 'slides'
  if (mime.startsWith('video/')) return 'video'
  if (mime.startsWith('audio/')) return 'music'
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext) || mime.includes('zip') || mime.includes('compressed')) return 'archive'
  if (['ttf', 'otf', 'woff', 'woff2'].includes(ext) || mime.includes('font')) return 'type'
  if (['psd', 'ai', 'indd', 'fig', 'sketch', 'eps'].includes(ext)) return 'palette'
  if (mime.startsWith('text/') || ['txt', 'md'].includes(ext)) return 'note'
  if (['eml', 'msg'].includes(ext)) return 'mail'
  return 'paperclip'
}
