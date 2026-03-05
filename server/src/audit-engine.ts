// ============================================================
// Audit Engine – Mock regels die issues genereren
// ============================================================
import { genId } from './helpers'
import type {
  Project, Page, SEOFields, MediaItem,
  AuditIssue, AuditSeverity, AuditCategory, AuditEnvironment
} from '../../shared/types'

export function generateAuditIssues(
  auditRunId: string,
  project: Project,
  pages: Page[],
  seoFields: SEOFields[],
  media: MediaItem[],
  environment: AuditEnvironment
): AuditIssue[] {
  const issues: AuditIssue[] = []

  function addIssue(severity: AuditSeverity, category: AuditCategory, pageId: string | null, description: string, recommendedFix: string) {
    issues.push({
      id: genId(),
      auditRunId,
      severity,
      category,
      pageId,
      description,
      recommendedFix,
      status: 'open',
    })
  }

  // Regel 1: 404 check – pagina niet in staging
  for (const page of pages) {
    if (environment === 'staging' && page.status !== 'staged' && page.status !== 'live') {
      addIssue('high', '404', page.id,
        `Pagina "${page.title}" (${page.fullUrl}) is nog niet beschikbaar in staging (status: ${page.status}).`,
        `Zorg dat de pagina gepubliceerd wordt op de staging omgeving voordat je live gaat.`)
    }
  }

  // Regel 2: Metadata check
  for (const seo of seoFields) {
    const page = pages.find(p => p.id === seo.pageId)
    if (!page) continue
    if (!seo.metaTitle) {
      addIssue('medium', 'meta', seo.pageId,
        `Meta-titel ontbreekt voor "${page.title}".`,
        `Voeg een unieke meta-titel toe van 50-60 tekens.`)
    }
    if (!seo.metaDescription) {
      addIssue('medium', 'meta', seo.pageId,
        `Meta-beschrijving ontbreekt voor "${page.title}".`,
        `Voeg een meta-beschrijving toe van 150-160 tekens.`)
    }
  }

  // Regel 3: Noindex check
  if (environment === 'live' && project.stagingNoindex) {
    addIssue('high', 'noindex', null,
      'De staging noindex-instelling staat nog aan. Zoekmachines zullen de live site niet indexeren.',
      'Zet "stagingNoindex" uit in de projectinstellingen voordat je live gaat.')
  }

  // Regel 4: Lorem ipsum check
  for (const page of pages) {
    if (page.notes.toLowerCase().includes('lorem')) {
      addIssue('low', 'lorem', page.id,
        `Pagina "${page.title}" bevat mogelijk placeholder-tekst (lorem ipsum).`,
        'Vervang alle placeholder-tekst door definitieve content.')
    }
  }

  // Regel 5: Grote afbeeldingen check
  for (const item of media) {
    if (item.sizeKb > 500) {
      addIssue('medium', 'images', item.relatedPageId,
        `Afbeelding "${item.originalName}" is ${item.sizeKb}KB. Dit kan de laadtijd negatief beïnvloeden.`,
        `Optimaliseer de afbeelding tot onder 500KB, gebruik WebP-formaat waar mogelijk.`)
    }
  }

  // Regel 6: Redirect check
  for (const seo of seoFields) {
    const page = pages.find(p => p.id === seo.pageId)
    if (!page) continue
    // Simulatie: pagina's met level 0 of 1 "zouden" redirects moeten hebben van het oude domein
    if (page.level <= 1 && seo.redirectsFrom.length === 0 && project.domainCurrent) {
      addIssue('medium', 'redirects', page.id,
        `Pagina "${page.title}" heeft geen redirects ingesteld vanaf het oude domein (${project.domainCurrent}).`,
        `Voeg redirects toe van de oude URL's naar ${page.fullUrl}.`)
    }
  }

  // Regel 7: Forms & tracking check
  if (!project.gtmConnected) {
    addIssue('high', 'tracking', null,
      'Google Tag Manager is niet gekoppeld aan dit project.',
      'Installeer GTM op de staging/live omgeving en verifieer de container.')
  }
  if (!project.eventsDefined) {
    addIssue('high', 'forms', null,
      'Er zijn nog geen formulier-events of conversie-tracking ingesteld.',
      'Definieer events voor contactformulieren, CTA-klikken en andere conversies in GTM.')
  }

  // Regel 8: Performance check (reproduceerbaar op basis van projectId)
  const perfSeed = project.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const lcp = 1.5 + (perfSeed % 40) / 10 // 1.5 - 5.5s
  const cls = (perfSeed % 30) / 100 // 0 - 0.3
  const fid = 50 + (perfSeed % 200) // 50 - 250ms
  const perfScore = Math.round(100 - (lcp > 2.5 ? 20 : 0) - (cls > 0.1 ? 15 : 0) - (fid > 100 ? 10 : 0) - (perfSeed % 15))

  if (perfScore < 80) {
    addIssue('medium', 'performance', null,
      `Core Web Vitals score: ${perfScore}/100 (LCP: ${lcp.toFixed(1)}s, CLS: ${cls.toFixed(2)}, FID: ${fid}ms).`,
      'Optimaliseer afbeeldingen, minimaliseer JavaScript, gebruik lazy loading en caching.')
  }
  if (lcp > 2.5) {
    addIssue('high', 'performance', null,
      `Largest Contentful Paint (LCP) is ${lcp.toFixed(1)}s, dit moet onder 2.5s zijn.`,
      'Optimaliseer de hero-afbeelding, gebruik preloading en verminder render-blocking resources.')
  }

  // Regel: Robots.txt check (altijd een reminder)
  addIssue('low', 'robots', null,
    'Controleer of robots.txt correct is ingesteld voor de live omgeving.',
    'Zorg dat robots.txt de sitemap vermeldt en geen belangrijke pagina\'s blokkeert.')

  // Regel: Sitemap check
  addIssue('low', 'sitemap', null,
    'Controleer of de XML-sitemap alle pagina\'s bevat en correct is ingediend bij Google Search Console.',
    'Genereer een sitemap via Yoast/RankMath en dien deze in bij Google Search Console.')

  return issues
}
