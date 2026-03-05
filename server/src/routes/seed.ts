// ============================================================
// Seed Route – Vult demo-data voor het prototype
// ============================================================
import { Router, Request, Response } from 'express'
import { readCollection, writeCollection, clearAll } from '../storage'
import { genId, now, ok } from '../helpers'
import type {
  Project, Page, SEOFields, Task, Source, MediaItem, AuditRun, AuditIssue, ProjectPhase
} from '../../../shared/types'
import { generateAuditIssues } from '../audit-engine'

export const seedRouter = Router()

seedRouter.get('/seed', (_req: Request, res: Response) => {
  // Check of er al data is
  const existing = readCollection<Project>('projects')
  if (existing.length > 0) {
    return res.json(ok({ message: 'Seed overgeslagen, er bestaat al data. Gebruik /api/seed/force om te resetten.' }))
  }
  runSeed()
  res.json(ok({ message: 'Demo-data succesvol aangemaakt.' }))
})

seedRouter.get('/seed/force', (_req: Request, res: Response) => {
  clearAll()
  runSeed()
  res.json(ok({ message: 'Alle data gereset en demo-data opnieuw aangemaakt.' }))
})

function runSeed() {
  // ---- Project ----
  const projectId = 'demo0001'
  const project: Project = {
    id: projectId,
    name: 'Cooling Service Holland',
    clientName: 'Cooling Service Holland B.V.',
    domainCurrent: 'coolingserviceholland.nl',
    domainNew: 'csh-nieuw.nl',
    languages: ['nl'],
    goLiveDate: '2026-05-15',
    createdAt: '2026-02-10T09:00:00.000Z',
    stagingNoindex: true,
    gtmConnected: false,
    eventsDefined: false,
  }
  writeCollection('projects', [project])

  // ---- Pagina's ----
  const pageHome = makePageId()
  const pageDiensten = makePageId()
  const pageOverOns = makePageId()
  const pageContact = makePageId()
  const pageFoodBev = makePageId()
  const pageUtiliteit = makePageId()
  const pageProjecten = makePageId()
  const pageCaseAH = makePageId()
  const pageCaseJumbo = makePageId()
  const pageBlog = makePageId()
  const pageBlogDetail = makePageId()

  const pages: Page[] = [
    { id: pageHome, projectId, title: 'Home', parentId: null, slug: '', fullUrl: 'https://csh-nieuw.nl', type: 'page', status: 'content-ready', notes: '', level: 0 },
    { id: pageDiensten, projectId, title: 'Diensten', parentId: pageHome, slug: 'diensten', fullUrl: 'https://csh-nieuw.nl/diensten', type: 'page', status: 'draft', notes: '', level: 1 },
    { id: pageFoodBev, projectId, title: 'Food & Beverage', parentId: pageDiensten, slug: 'food-beverage', fullUrl: 'https://csh-nieuw.nl/diensten/food-beverage', type: 'page', status: 'draft', notes: 'Nog lorem ipsum tekst aanwezig', level: 2 },
    { id: pageUtiliteit, projectId, title: 'Utiliteit', parentId: pageDiensten, slug: 'utiliteit', fullUrl: 'https://csh-nieuw.nl/diensten/utiliteit', type: 'page', status: 'draft', notes: '', level: 2 },
    { id: pageOverOns, projectId, title: 'Over ons', parentId: pageHome, slug: 'over-ons', fullUrl: 'https://csh-nieuw.nl/over-ons', type: 'page', status: 'content-ready', notes: '', level: 1 },
    { id: pageProjecten, projectId, title: 'Projecten', parentId: pageHome, slug: 'projecten', fullUrl: 'https://csh-nieuw.nl/projecten', type: 'archive', status: 'draft', notes: '', level: 1 },
    { id: pageCaseAH, projectId, title: 'Albert Heijn Distributiecentrum', parentId: pageProjecten, slug: 'albert-heijn-dc', fullUrl: 'https://csh-nieuw.nl/projecten/albert-heijn-dc', type: 'case', status: 'draft', notes: '', level: 2 },
    { id: pageCaseJumbo, projectId, title: 'Jumbo Supermarkten', parentId: pageProjecten, slug: 'jumbo-supermarkten', fullUrl: 'https://csh-nieuw.nl/projecten/jumbo-supermarkten', type: 'case', status: 'draft', notes: '', level: 2 },
    { id: pageBlog, projectId, title: 'Blog', parentId: pageHome, slug: 'blog', fullUrl: 'https://csh-nieuw.nl/blog', type: 'archive', status: 'draft', notes: '', level: 1 },
    { id: pageBlogDetail, projectId, title: 'F-gassen regelgeving 2026', parentId: pageBlog, slug: 'f-gassen-regelgeving-2026', fullUrl: 'https://csh-nieuw.nl/blog/f-gassen-regelgeving-2026', type: 'post', status: 'draft', notes: '', level: 2 },
    { id: pageContact, projectId, title: 'Contact', parentId: pageHome, slug: 'contact', fullUrl: 'https://csh-nieuw.nl/contact', type: 'page', status: 'staged', notes: '', level: 1 },
  ]
  writeCollection('pages', pages)

  // ---- SEO Fields ----
  const seoFields: SEOFields[] = [
    { pageId: pageHome, metaTitle: 'Cooling Service Holland | Koeltechniek specialist', metaDescription: 'Al meer dan 25 jaar uw partner in koeltechniek. Installatie, onderhoud en service voor retail, horeca en industrie.', focusTopic: 'koeltechniek specialist', redirectsFrom: [] },
    { pageId: pageDiensten, metaTitle: '', metaDescription: '', focusTopic: 'koeltechniek diensten', redirectsFrom: [] },
    { pageId: pageFoodBev, metaTitle: '', metaDescription: '', focusTopic: 'koeling food beverage', redirectsFrom: [] },
    { pageId: pageUtiliteit, metaTitle: '', metaDescription: '', focusTopic: 'utiliteitskoeling', redirectsFrom: [] },
    { pageId: pageOverOns, metaTitle: 'Over Cooling Service Holland', metaDescription: '', focusTopic: 'koeltechniek bedrijf', redirectsFrom: [] },
    { pageId: pageProjecten, metaTitle: '', metaDescription: '', focusTopic: 'koeltechniek projecten', redirectsFrom: [] },
    { pageId: pageCaseAH, metaTitle: '', metaDescription: '', focusTopic: 'koelinstallatie albert heijn', redirectsFrom: [] },
    { pageId: pageCaseJumbo, metaTitle: '', metaDescription: '', focusTopic: 'koeling jumbo supermarkten', redirectsFrom: [] },
    { pageId: pageBlog, metaTitle: '', metaDescription: '', focusTopic: 'koeltechniek blog', redirectsFrom: [] },
    { pageId: pageBlogDetail, metaTitle: '', metaDescription: '', focusTopic: 'f-gassen regelgeving', redirectsFrom: [] },
    { pageId: pageContact, metaTitle: 'Contact | Cooling Service Holland', metaDescription: 'Neem contact op voor vragen over koeltechniek, installatie of onderhoud.', focusTopic: 'contact koeltechniek', redirectsFrom: ['coolingserviceholland.nl/contact'] },
  ]
  writeCollection('seoFields', seoFields)

  // ---- Taken ----
  const taskUrlStruct = makePageId()
  const taskRedirect = makePageId()

  const tasks: Task[] = [
    // Strategie
    { id: makePageId(), projectId, title: 'Live datum prikken', description: 'Bepaal samen met klant en team de lanceerdatum.', team: 'PM', status: 'done', dependsOnTaskIds: [], relatedPageId: null, dueDate: '2026-02-20', phase: 'strategie' },
    { id: makePageId(), projectId, title: 'Domeincheck', description: 'Controleer of csh-nieuw.nl beschikbaar is en check de historie.', team: 'SEO', status: 'done', dependsOnTaskIds: [], relatedPageId: null, dueDate: null, phase: 'strategie' },
    { id: makePageId(), projectId, title: 'Supportanalyse en focus onderwerpen', description: 'Analyseer zoekvolumes en bepaal focus-onderwerpen per pagina.', team: 'SEO', status: 'doing', dependsOnTaskIds: [], relatedPageId: null, dueDate: null, phase: 'strategie' },
    // Inventarisatie
    { id: makePageId(), projectId, title: 'Interview vragenlijst maken', description: 'Stel vragen op om alle benodigde content te verzamelen bij de klant.', team: 'Content', status: 'done', dependsOnTaskIds: [], relatedPageId: null, dueDate: null, phase: 'inventarisatie' },
    { id: makePageId(), projectId, title: 'Klant feedbackmoment plannen', description: 'Plan presentatie en feedbackronde in.', team: 'PM', status: 'doing', dependsOnTaskIds: [], relatedPageId: null, dueDate: '2026-03-10', phase: 'inventarisatie' },
    // Structuur
    { id: taskUrlStruct, projectId, title: 'URL-structuur definitief maken', description: 'Bepaal de definitieve URL-structuur op basis van de geïmporteerde sitemap.', team: 'UX', status: 'doing', dependsOnTaskIds: [], relatedPageId: null, dueDate: null, phase: 'structuur' },
    { id: makePageId(), projectId, title: 'Pagina-indeling: Home', description: 'Maak een wireframe voor de homepage.', team: 'UX', status: 'todo', dependsOnTaskIds: [taskUrlStruct], relatedPageId: pageHome, dueDate: null, phase: 'structuur' },
    { id: makePageId(), projectId, title: 'Pagina-indeling: Diensten', description: 'Maak een wireframe voor de dienstenpagina.', team: 'UX', status: 'todo', dependsOnTaskIds: [taskUrlStruct], relatedPageId: pageDiensten, dueDate: null, phase: 'structuur' },
    // Content
    { id: makePageId(), projectId, title: 'Teksten schrijven: Home', description: 'Schrijf de content voor de homepage op basis van interviews.', team: 'Content', status: 'doing', dependsOnTaskIds: [], relatedPageId: pageHome, dueDate: '2026-03-20', phase: 'content' },
    { id: makePageId(), projectId, title: 'Teksten schrijven: Over ons', description: 'Schrijf de content voor de Over ons pagina.', team: 'Content', status: 'todo', dependsOnTaskIds: [], relatedPageId: pageOverOns, dueDate: null, phase: 'content' },
    { id: makePageId(), projectId, title: 'Teksten schrijven: Diensten', description: 'Schrijf de content voor alle dienstenpagina\'s.', team: 'Content', status: 'todo', dependsOnTaskIds: [], relatedPageId: pageDiensten, dueDate: null, phase: 'content' },
    // Design
    { id: makePageId(), projectId, title: 'Huisstijl verwerken in design', description: 'Pas het design aan op de huisstijl van CSH.', team: 'UX', status: 'todo', dependsOnTaskIds: [], relatedPageId: null, dueDate: null, phase: 'design' },
    // Development
    { id: makePageId(), projectId, title: 'Local environment opzetten', description: 'Clone repo\'s, importeer database, configureer local.', team: 'Dev', status: 'todo', dependsOnTaskIds: [], relatedPageId: null, dueDate: null, phase: 'development' },
    { id: makePageId(), projectId, title: 'Blokken bouwen in thema', description: 'Bouw alle benodigde WordPress blokken.', team: 'Dev', status: 'todo', dependsOnTaskIds: [], relatedPageId: null, dueDate: null, phase: 'development' },
    // Staging
    { id: makePageId(), projectId, title: 'Staging klaarzetten', description: 'Deploy naar staging, search/replace URLs.', team: 'Dev', status: 'todo', dependsOnTaskIds: [], relatedPageId: null, dueDate: null, phase: 'staging' },
    { id: makePageId(), projectId, title: 'Responsive check', description: 'Test alle pagina\'s op mobiel, tablet en desktop.', team: 'Dev', status: 'todo', dependsOnTaskIds: [], relatedPageId: null, dueDate: null, phase: 'staging' },
    // Pre-live
    { id: taskRedirect, projectId, title: 'Redirectplan opstellen', description: 'Maak een compleet redirectplan van oude naar nieuwe URL\'s.', team: 'SEO', status: 'todo', dependsOnTaskIds: [taskUrlStruct], relatedPageId: null, dueDate: null, phase: 'pre-live' },
    { id: makePageId(), projectId, title: 'Meetbaarheid instellen', description: 'GTM, GA4, events en conversies instellen.', team: 'SEO', status: 'todo', dependsOnTaskIds: [], relatedPageId: null, dueDate: null, phase: 'pre-live' },
  ]
  writeCollection('tasks', tasks)

  // ---- Sources (transcripts + notities) ----
  const sources: Source[] = [
    {
      id: makePageId(),
      projectId,
      type: 'transcript',
      title: 'Kickoff meeting – 10 feb 2026',
      contentText: `Aanwezig: Jan (CSH), Marieke (PM Pienter), Thomas (Content), Lisa (SEO).

Jan vertelt over de geschiedenis van Cooling Service Holland. Het bedrijf is in 1998 opgericht en richt zich op koeltechniek voor supermarkten, horeca en industriële toepassingen. Ze hebben inmiddels 45 medewerkers en werken door heel Nederland.

Belangrijkste punten uit het gesprek:
- De huidige website is verouderd en niet mobiel-vriendelijk. Klanten vinden het moeilijk om de juiste dienst te vinden.
- CSH wil meer nadruk leggen op hun specialisatie in F-gassen en duurzame koeling met natuurlijke koudemiddelen.
- Ze willen graag projectreferenties tonen, met name de grote installaties bij Albert Heijn en Jumbo.
- Het contactformulier werkt niet goed, leads komen soms niet aan.
- De blog moet actiever worden ingezet voor SEO, met name rond regelgeving (F-gassen) en verduurzaming.

Actiepunten:
- Thomas stuurt vragenlijst naar Jan voor content per dienst.
- Lisa doet keyword-analyse op "koeltechniek", "koelinstallatie" en branche-termen.
- Marieke plant feedbackmoment in over 4 weken.`,
      url: '',
      filePath: '',
      relatedPageIds: [pageHome, pageDiensten, pageOverOns],
      tags: ['kickoff', 'websitesessie', 'interview'],
      createdAt: '2026-02-10T14:00:00.000Z',
    },
    {
      id: makePageId(),
      projectId,
      type: 'transcript',
      title: 'SEO intake sessie – 17 feb 2026',
      contentText: `Aanwezig: Lisa (SEO), Thomas (Content), Jan (CSH).

Lisa presenteert de eerste keyword-analyse:
- "koeltechniek" heeft 1.900 maandelijkse zoekopdrachten, maar hoge concurrentie.
- "koelinstallatie bedrijf" heeft 720 zoekopdrachten, minder concurrentie.
- "f-gassen certificering" is een niche-term met 390 zoekopdrachten en weinig concurrentie, goed voor blog.
- Branche-specifieke termen zoals "koeling supermarkt" en "horeca koeling" zijn kansrijk.

Beslissingen:
- Focus op "koeltechniek specialist" als primaire term voor de homepage.
- Elke dienstenpagina krijgt een eigen focus-onderwerp per branche.
- Blog-strategie: maandelijks een artikel over regelgeving of technische innovatie.
- Redirects van oude pagina's zijn cruciaal, de huidige site heeft 35 geïndexeerde URL's.

Thomas vraagt of de structuur al definitief is. Lisa geeft aan dat URL-keuzes invloed hebben op SEO en dat dit vroeg bepaald moet worden.`,
      url: '',
      filePath: '',
      relatedPageIds: [pageHome, pageDiensten, pageBlog],
      tags: ['SEO', 'keyword-analyse', 'websitesessie'],
      createdAt: '2026-02-17T10:00:00.000Z',
    },
    {
      id: makePageId(),
      projectId,
      type: 'note',
      title: 'Notitie: beeldmateriaal status',
      contentText: `Beeldmateriaal is verspreid over meerdere bronnen:
- Oude website: lage resolutie afbeeldingen, niet bruikbaar voor hero-secties.
- Google Drive van Jan: bevat teamfoto's en enkele projectfoto's, maar zonder duidelijke naamgeving.
- Instagram account: goede sfeerbeelden, maar klein formaat (1080x1080).
- NAS server op kantoor: RAW bestanden van fotoshoot 2023, moeten nog bewerkt worden.

Afspraak: Jan levert voor 1 maart een selectie van bruikbare foto's aan via Drive. Thomas maakt een overzicht van welke beelden per pagina nodig zijn.`,
      url: '',
      filePath: '',
      relatedPageIds: [pageHome, pageOverOns, pageCaseAH],
      tags: ['beeldmateriaal', 'notitie'],
      createdAt: '2026-02-20T11:00:00.000Z',
    },
  ]
  writeCollection('sources', sources)

  // ---- Media items ----
  const mediaItems: MediaItem[] = [
    { id: makePageId(), projectId, originalName: 'hero-home.jpg', newName: 'hero-homepage-csh.jpg', sizeKb: 450, dimensions: { width: 1920, height: 1080 }, altTextSuggestion: 'Koelinstallatie in een supermarkt', relatedPageId: pageHome, source: 'upload', sourceLabel: 'Upload', type: 'hero' },
    { id: makePageId(), projectId, originalName: 'team-photo.jpg', newName: 'team-cooling-service-holland.jpg', sizeKb: 780, dimensions: { width: 1600, height: 1067 }, altTextSuggestion: 'Het team van Cooling Service Holland', relatedPageId: pageOverOns, source: 'upload', sourceLabel: 'Upload', type: 'hero' },
    { id: makePageId(), projectId, originalName: 'DSC_0442.jpg', newName: 'project-albert-heijn-dc.jpg', sizeKb: 1200, dimensions: { width: 3000, height: 2000 }, altTextSuggestion: 'Koelinstallatie in Albert Heijn distributiecentrum', relatedPageId: pageCaseAH, source: 'upload', sourceLabel: 'Upload', type: 'hero' },
    { id: makePageId(), projectId, originalName: 'logo-csh.svg', newName: 'logo-cooling-service-holland.svg', sizeKb: 28, dimensions: { width: 400, height: 120 }, altTextSuggestion: 'Logo Cooling Service Holland', relatedPageId: null, source: 'upload', sourceLabel: 'Upload', type: 'logo' },
    { id: makePageId(), projectId, originalName: 'food-koeling.jpg', newName: 'dienst-food-beverage-koeling.jpg', sizeKb: 320, dimensions: { width: 800, height: 600 }, altTextSuggestion: 'Koelinstallatie voor food and beverage sector', relatedPageId: pageFoodBev, source: 'upload', sourceLabel: 'Upload', type: 'card' },
    { id: makePageId(), projectId, originalName: 'kantoor-buiten.jpg', newName: 'kantoor-cooling-service-holland.jpg', sizeKb: 560, dimensions: { width: 1200, height: 800 }, altTextSuggestion: 'Kantoorpand Cooling Service Holland', relatedPageId: pageContact, source: 'upload', sourceLabel: 'Upload', type: 'general' },
  ]
  writeCollection('media', mediaItems)

  // ---- Audit runs (leeg, gebruiker kan zelf starten) ----
  writeCollection('auditRuns', [])
  writeCollection('auditIssues', [])
}

let _counter = 100
function makePageId(): string {
  return `seed${String(++_counter).padStart(4, '0')}`
}
