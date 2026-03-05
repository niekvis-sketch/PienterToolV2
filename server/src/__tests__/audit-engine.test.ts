// ============================================================
// Test: Audit Engine – controleert of issues correct gegenereerd worden
// ============================================================
import { generateAuditIssues } from '../audit-engine'
import type { Project, Page, SEOFields, MediaItem } from '../../../shared/types'

describe('generateAuditIssues', () => {
  const project: Project = {
    id: 'test-001',
    name: 'Test Project',
    clientName: 'Test BV',
    domainCurrent: 'oud.nl',
    domainNew: 'nieuw.nl',
    languages: ['nl'],
    goLiveDate: null,
    createdAt: '2026-01-01T00:00:00Z',
    stagingNoindex: true,
    gtmConnected: false,
    eventsDefined: false,
  }

  const pages: Page[] = [
    { id: 'p1', projectId: 'test-001', title: 'Home', parentId: null, slug: '', fullUrl: 'https://nieuw.nl', type: 'page', status: 'draft', notes: '', level: 0 },
    { id: 'p2', projectId: 'test-001', title: 'Contact', parentId: 'p1', slug: 'contact', fullUrl: 'https://nieuw.nl/contact', type: 'page', status: 'staged', notes: 'Lorem ipsum dolor sit', level: 1 },
  ]

  const seoFields: SEOFields[] = [
    { pageId: 'p1', metaTitle: '', metaDescription: '', focusTopic: 'test', redirectsFrom: [] },
    { pageId: 'p2', metaTitle: 'Contact', metaDescription: 'Neem contact op.', focusTopic: 'contact', redirectsFrom: ['oud.nl/contact'] },
  ]

  const media: MediaItem[] = [
    { id: 'm1', projectId: 'test-001', originalName: 'big.jpg', newName: 'big.jpg', sizeKb: 800, dimensions: { width: 1920, height: 1080 }, altTextSuggestion: '', relatedPageId: 'p1', source: 'upload', sourceLabel: 'Upload', type: 'hero' },
  ]

  it('genereert 404 issues voor paginas die niet in staging staan', () => {
    const issues = generateAuditIssues('run1', project, pages, seoFields, media, 'staging')
    const notFound = issues.filter(i => i.category === '404')
    // Home is draft, dus zou een 404 issue moeten genereren
    expect(notFound.length).toBeGreaterThanOrEqual(1)
    expect(notFound.some(i => i.pageId === 'p1')).toBe(true)
    // Contact is staged, dus geen 404
    expect(notFound.some(i => i.pageId === 'p2')).toBe(false)
  })

  it('genereert meta issues voor lege metadata', () => {
    const issues = generateAuditIssues('run1', project, pages, seoFields, media, 'staging')
    const metaIssues = issues.filter(i => i.category === 'meta')
    // Home heeft lege meta title en description
    expect(metaIssues.length).toBeGreaterThanOrEqual(2)
  })

  it('genereert noindex issue bij live scan als stagingNoindex aan staat', () => {
    const issues = generateAuditIssues('run1', project, pages, seoFields, media, 'live')
    const noindex = issues.filter(i => i.category === 'noindex')
    expect(noindex.length).toBe(1)
    expect(noindex[0].severity).toBe('high')
  })

  it('genereert image issues voor grote bestanden', () => {
    const issues = generateAuditIssues('run1', project, pages, seoFields, media, 'staging')
    const imgIssues = issues.filter(i => i.category === 'images')
    expect(imgIssues.length).toBeGreaterThanOrEqual(1)
  })

  it('genereert tracking issues als GTM niet gekoppeld is', () => {
    const issues = generateAuditIssues('run1', project, pages, seoFields, media, 'staging')
    const tracking = issues.filter(i => i.category === 'tracking')
    expect(tracking.length).toBeGreaterThanOrEqual(1)
  })

  it('detecteert lorem ipsum in notities', () => {
    const issues = generateAuditIssues('run1', project, pages, seoFields, media, 'staging')
    const lorem = issues.filter(i => i.category === 'lorem')
    expect(lorem.length).toBeGreaterThanOrEqual(1)
    expect(lorem[0].pageId).toBe('p2')
  })
})
