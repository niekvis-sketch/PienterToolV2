// ============================================================
// Seed Route – Vult demo-data voor het prototype
// ============================================================
import { Router, Request, Response } from 'express'
import { readCollection, writeCollection, clearAll } from '../storage'
import { genId, now, ok } from '../helpers'
import type {
  Project, Page, SEOFields,
  UserStory, ClientQuestion, Fase1Summary, SiteNode, PageBlock, StructuurProgress, ChangeLogEntry,
  Klant
} from '../../../shared/types'

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
  // ---- Klant ----
  const klant: Klant = {
    id: 'klant0001',
    naam: 'Cooling Service Holland B.V.',
    status: 'actief',
    notities: '',
    contactpersoon: '',
    email: '',
    telefoon: '',
    website: 'coolingserviceholland.nl',
    kvkNummer: '',
    adres: '',
    stad: '',
    sector: 'Koeltechniek',
    merkverhaal: '',
    toneOfVoice: '',
    kernwaarden: '',
    contractType: '',
    contractWaarde: null,
    contractStartdatum: null,
    contractEinddatum: null,
    facturatiemethode: '',
    betaaltermijn: null,
    doelstellingen: '',
    uitdagingen: '',
    kansen: '',
    concurrenten: '',
    positionering: '',
    accountManagerId: null,
    createdAt: '2026-02-10T09:00:00.000Z',
    updatedAt: '2026-02-10T09:00:00.000Z',
  }
  writeCollection('klanten', [klant])

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
    ownerId: null,
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

  // ============================================================
  // Websitestructuur Bepalen – 3-fasen systeem (demo data)
  // ============================================================

  // ---- Structuur Progress ----
  const structuurProgress = [
    {
      id: makePageId(),
      projectId,
      currentFase: 2 as const,
      fase1Complete: true,
      fase2Complete: false,
      fase3Complete: false,
      updatedAt: '2026-02-25T14:00:00.000Z',
    },
  ]
  writeCollection('structuurProgress', structuurProgress)

  // ---- User Stories ----
  const storyId1 = makePageId()
  const storyId2 = makePageId()
  const storyId3 = makePageId()
  const storyId4 = makePageId()
  const storyId5 = makePageId()

  const userStories = [
    {
      id: storyId1, projectId,
      title: 'Facility manager zoekt koelspecialist',
      asA: 'facility manager van een supermarktketen',
      iWant: 'snel kunnen zien welke koeldiensten CSH aanbiedt',
      soThat: 'ik kan beoordelen of zij de juiste partner zijn voor ons onderhoud',
      sourceId: null, tags: ['navigatie', 'diensten'],
      createdAt: '2026-02-15T10:00:00.000Z',
    },
    {
      id: storyId2, projectId,
      title: 'Horeca-ondernemer wil referenties zien',
      asA: 'horeca-ondernemer',
      iWant: 'projectreferenties en cases bekijken in mijn branche',
      soThat: 'ik vertrouwen krijg dat CSH ervaring heeft met mijn type bedrijf',
      sourceId: null, tags: ['cases', 'social-proof'],
      createdAt: '2026-02-15T10:30:00.000Z',
    },
    {
      id: storyId3, projectId,
      title: 'Technisch directeur zoekt info F-gassen',
      asA: 'technisch directeur',
      iWant: 'informatie vinden over F-gassen regelgeving en verduurzaming',
      soThat: 'ik weet of CSH mij kan helpen met de overgang naar natuurlijke koudemiddelen',
      sourceId: null, tags: ['blog', 'seo', 'regelgeving'],
      createdAt: '2026-02-15T11:00:00.000Z',
    },
    {
      id: storyId4, projectId,
      title: 'Potentiële klant wil contact opnemen',
      asA: 'potentiële klant',
      iWant: 'eenvoudig een offerte kunnen aanvragen of contact opnemen',
      soThat: 'ik snel antwoord krijg op mijn vragen over koeltechniek',
      sourceId: null, tags: ['conversie', 'contact'],
      createdAt: '2026-02-16T09:00:00.000Z',
    },
    {
      id: storyId5, projectId,
      title: 'Sollicitant wil bedrijfscultuur kennen',
      asA: 'technisch monteur op zoek naar een nieuwe baan',
      iWant: 'lezen over het team, de cultuur en vacatures bij CSH',
      soThat: 'ik kan beslissen of ik wil solliciteren',
      sourceId: null, tags: ['over-ons', 'werken-bij'],
      createdAt: '2026-02-16T09:30:00.000Z',
    },
  ]
  writeCollection('userStories', userStories)

  // ---- Client Questions ----
  const qId1 = makePageId()
  const qId2 = makePageId()
  const qId3 = makePageId()
  const qId4 = makePageId()
  const qId5 = makePageId()
  const qId6 = makePageId()
  const qId7 = makePageId()
  const qId8 = makePageId()
  const qId9 = makePageId()
  const qId10 = makePageId()
  const qId11 = makePageId()
  const qId12 = makePageId()

  const clientQuestions = [
    { id: qId1, projectId, userStoryId: storyId1, question: 'Welke hoofddiensten moeten prominent in de navigatie staan?', answer: 'Installatie, onderhoud, storingsdienst en advies. Per branche een subpagina.', status: 'answered' as const, group: 'navigatie' as const, impactOnStructure: 'Bepaalt de submenu-structuur onder Diensten', createdAt: '2026-02-15T10:05:00.000Z' },
    { id: qId2, projectId, userStoryId: storyId1, question: 'Moet elke branche een eigen dienstenpagina krijgen?', answer: 'Ja, minimaal Food & Beverage, Utiliteit en Horeca.', status: 'answered' as const, group: 'navigatie' as const, impactOnStructure: 'Drie extra pagina\'s onder Diensten', createdAt: '2026-02-15T10:10:00.000Z' },
    { id: qId3, projectId, userStoryId: storyId2, question: 'Hoeveel projectreferenties wil de klant tonen?', answer: 'Minimaal 6-8 cases, verdeeld over branches.', status: 'answered' as const, group: 'content' as const, impactOnStructure: 'Projecten-archief met 6-8 case pagina\'s', createdAt: '2026-02-15T10:35:00.000Z' },
    { id: qId4, projectId, userStoryId: storyId2, question: 'Moeten cases filterbaar zijn per branche?', answer: '', status: 'open' as const, group: 'functionaliteit' as const, impactOnStructure: 'Eventueel filter-functionaliteit op archief-pagina', createdAt: '2026-02-15T10:40:00.000Z' },
    { id: qId5, projectId, userStoryId: storyId3, question: 'Welke blog-categorieën zijn gewenst?', answer: 'Regelgeving, duurzaamheid en technische innovatie.', status: 'answered' as const, group: 'seo' as const, impactOnStructure: 'Blog-archief met categorie-structuur', createdAt: '2026-02-15T11:05:00.000Z' },
    { id: qId6, projectId, userStoryId: storyId3, question: 'Is er een kennisbank of FAQ nodig naast de blog?', answer: '', status: 'assumption' as const, group: 'content' as const, impactOnStructure: 'We nemen aan dat de blog volstaat voor nu, geen aparte FAQ-sectie', createdAt: '2026-02-15T11:10:00.000Z' },
    { id: qId7, projectId, userStoryId: storyId4, question: 'Welke contactmogelijkheden moeten er zijn?', answer: 'Contactformulier, telefoon, e-mail en een WhatsApp-knop.', status: 'answered' as const, group: 'conversie' as const, impactOnStructure: 'Contact-pagina met meerdere CTA-blokken', createdAt: '2026-02-16T09:05:00.000Z' },
    { id: qId8, projectId, userStoryId: storyId4, question: 'Moet er een offerte-aanvraag flow komen?', answer: '', status: 'open' as const, group: 'conversie' as const, impactOnStructure: 'Eventueel aparte offerte-pagina of modal', createdAt: '2026-02-16T09:10:00.000Z' },
    { id: qId9, projectId, userStoryId: storyId5, question: 'Komt er een "Werken bij" sectie?', answer: 'Ja, dat willen we graag.', status: 'answered' as const, group: 'content' as const, impactOnStructure: 'Nieuwe pagina "Werken bij" onder Over ons', createdAt: '2026-02-16T09:35:00.000Z' },
    { id: qId10, projectId, userStoryId: null, question: 'Welke beelden heeft de klant beschikbaar voor de hero-secties?', answer: 'Deels beschikbaar, fotoshoot moet nog bewerkt worden.', status: 'insight' as const, group: 'beeldmateriaal' as const, impactOnStructure: 'Hero-blokken afhankelijk van beschikbaar materiaal', createdAt: '2026-02-17T10:00:00.000Z' },
    { id: qId11, projectId, userStoryId: null, question: 'Moet de website meertalig worden (NL/EN)?', answer: 'Niet in fase 1, mogelijk later Engels toevoegen.', status: 'answered' as const, group: 'functionaliteit' as const, impactOnStructure: 'Geen invloed op huidige structuur', createdAt: '2026-02-17T10:10:00.000Z' },
    { id: qId12, projectId, userStoryId: storyId1, question: 'Is er een verschil in diensten per regio?', answer: '', status: 'open' as const, group: 'doelgroep' as const, impactOnStructure: 'Eventueel regio-pagina\'s of werkgebied-pagina', createdAt: '2026-02-17T10:20:00.000Z' },
  ]
  writeCollection('clientQuestions', clientQuestions)

  // ---- Fase 1 Summary ----
  const fase1Summaries = [
    {
      id: makePageId(), projectId,
      mainTopics: ['Diensten per branche (food, utiliteit, horeca)', 'Projectreferenties/cases', 'F-gassen en duurzaamheid', 'Contact en offerteaanvraag', 'Werken bij / team'],
      uncertainTopics: ['Offerte-aanvraag als aparte pagina of modal?', 'Filter op cases per branche technisch?', 'Werkgebied / regio-pagina\'s?'],
      seoImportantPages: ['Home (koeltechniek specialist)', 'Diensten (koeltechniek diensten)', 'Blog (f-gassen regelgeving)', 'Cases (koelinstallatie projecten)'],
      bundleOpportunities: ['Diensten + branche-pagina\'s onder één submenu', 'Blog + kennisbank samenvoegen', 'Over ons + Werken bij als submenu'],
      pendingFromClient: ['Bewerkte fotoshoot beelden', 'Definitieve lijst van cases met beschrijvingen', 'Akkoord op "Werken bij" content'],
      generatedAt: '2026-02-20T12:00:00.000Z',
    },
  ]
  writeCollection('fase1Summaries', fase1Summaries)

  // ---- Site Nodes (Fase 2) ----
  const nodeHome = makePageId()
  const nodeDiensten = makePageId()
  const nodeFoodBev = makePageId()
  const nodeUtiliteit = makePageId()
  const nodeHoreca = makePageId()
  const nodeOverOns = makePageId()
  const nodeWerkenBij = makePageId()
  const nodeProjecten = makePageId()
  const nodeCaseAH = makePageId()
  const nodeCaseJumbo = makePageId()
  const nodeCaseHoreca = makePageId()
  const nodeBlog = makePageId()
  const nodeBlogFgassen = makePageId()
  const nodeContact = makePageId()

  const now = '2026-02-22T10:00:00.000Z'
  const siteNodes = [
    { id: nodeHome, projectId, parentId: null, title: 'Home', slug: '', fullUrl: 'https://csh-nieuw.nl', level: 0, sortOrder: 0, type: 'page' as const, goal: 'overtuigen' as const, targetAudience: 'Alle bezoekers', reasonExists: 'Eerste indruk en doorverwijzing naar diensten en cases', isInMainNav: false, isDetailTemplate: false, isParked: false, priority: 'hoog' as const, label: 'herschrijven' as const, contentStatus: 'in-progress' as const, focusTopic: 'koeltechniek specialist', metaTitle: 'Cooling Service Holland | Koeltechniek specialist', metaDescription: 'Al meer dan 25 jaar uw partner in koeltechniek.', redirectsFrom: ['coolingserviceholland.nl'], needsRedirect: true, relatedUserStoryIds: [storyId1], openQuestionIds: [], notes: '', createdAt: now, updatedAt: now },
    { id: nodeDiensten, projectId, parentId: nodeHome, title: 'Diensten', slug: 'diensten', fullUrl: 'https://csh-nieuw.nl/diensten', level: 1, sortOrder: 0, type: 'page' as const, goal: 'informeren' as const, targetAudience: 'Facility managers, technisch directeuren', reasonExists: 'Overzicht van alle diensten per branche', isInMainNav: true, isDetailTemplate: false, isParked: false, priority: 'hoog' as const, label: 'herschrijven' as const, contentStatus: 'niet-gestart' as const, focusTopic: 'koeltechniek diensten', metaTitle: '', metaDescription: '', redirectsFrom: ['coolingserviceholland.nl/diensten'], needsRedirect: true, relatedUserStoryIds: [storyId1], openQuestionIds: [qId12], notes: '', createdAt: now, updatedAt: now },
    { id: nodeFoodBev, projectId, parentId: nodeDiensten, title: 'Food & Beverage', slug: 'food-beverage', fullUrl: 'https://csh-nieuw.nl/diensten/food-beverage', level: 2, sortOrder: 0, type: 'service' as const, goal: 'overtuigen' as const, targetAudience: 'Supermarktketens, food retailers', reasonExists: 'Specifieke diensten voor food sector tonen', isInMainNav: true, isDetailTemplate: false, isParked: false, priority: 'hoog' as const, label: 'nieuw' as const, contentStatus: 'niet-gestart' as const, focusTopic: 'koeling food beverage', metaTitle: '', metaDescription: '', redirectsFrom: [], needsRedirect: false, relatedUserStoryIds: [storyId1], openQuestionIds: [], notes: 'Nog lorem ipsum tekst aanwezig', createdAt: now, updatedAt: now },
    { id: nodeUtiliteit, projectId, parentId: nodeDiensten, title: 'Utiliteit', slug: 'utiliteit', fullUrl: 'https://csh-nieuw.nl/diensten/utiliteit', level: 2, sortOrder: 1, type: 'service' as const, goal: 'overtuigen' as const, targetAudience: 'Vastgoedbeheerders, gebouwmanagers', reasonExists: 'Specifieke diensten voor utiliteit sector tonen', isInMainNav: true, isDetailTemplate: false, isParked: false, priority: 'middel' as const, label: 'nieuw' as const, contentStatus: 'niet-gestart' as const, focusTopic: 'utiliteitskoeling', metaTitle: '', metaDescription: '', redirectsFrom: [], needsRedirect: false, relatedUserStoryIds: [storyId1], openQuestionIds: [], notes: '', createdAt: now, updatedAt: now },
    { id: nodeHoreca, projectId, parentId: nodeDiensten, title: 'Horeca', slug: 'horeca', fullUrl: 'https://csh-nieuw.nl/diensten/horeca', level: 2, sortOrder: 2, type: 'service' as const, goal: 'overtuigen' as const, targetAudience: 'Horeca-ondernemers, restaurants', reasonExists: 'Specifieke diensten voor horeca sector tonen', isInMainNav: true, isDetailTemplate: false, isParked: false, priority: 'middel' as const, label: 'nieuw' as const, contentStatus: 'niet-gestart' as const, focusTopic: 'horeca koeling', metaTitle: '', metaDescription: '', redirectsFrom: [], needsRedirect: false, relatedUserStoryIds: [storyId2], openQuestionIds: [], notes: 'Nieuwe pagina op verzoek klant', createdAt: now, updatedAt: now },
    { id: nodeOverOns, projectId, parentId: nodeHome, title: 'Over ons', slug: 'over-ons', fullUrl: 'https://csh-nieuw.nl/over-ons', level: 1, sortOrder: 1, type: 'page' as const, goal: 'informeren' as const, targetAudience: 'Alle bezoekers, sollicitanten', reasonExists: 'Bedrijfsverhaal en vertrouwen opbouwen', isInMainNav: true, isDetailTemplate: false, isParked: false, priority: 'middel' as const, label: 'herschrijven' as const, contentStatus: 'klaar' as const, focusTopic: 'koeltechniek bedrijf', metaTitle: 'Over Cooling Service Holland', metaDescription: '', redirectsFrom: ['coolingserviceholland.nl/over-ons'], needsRedirect: true, relatedUserStoryIds: [storyId5], openQuestionIds: [], notes: '', createdAt: now, updatedAt: now },
    { id: nodeWerkenBij, projectId, parentId: nodeOverOns, title: 'Werken bij', slug: 'werken-bij', fullUrl: 'https://csh-nieuw.nl/over-ons/werken-bij', level: 2, sortOrder: 0, type: 'page' as const, goal: 'converteren' as const, targetAudience: 'Technisch monteurs, werkzoekenden', reasonExists: 'Vacatures en bedrijfscultuur tonen voor recruitment', isInMainNav: true, isDetailTemplate: false, isParked: false, priority: 'laag' as const, label: 'nieuw' as const, contentStatus: 'niet-gestart' as const, focusTopic: 'werken bij koeltechniek', metaTitle: '', metaDescription: '', redirectsFrom: [], needsRedirect: false, relatedUserStoryIds: [storyId5], openQuestionIds: [qId9], notes: 'Wachten op akkoord klant voor content', createdAt: now, updatedAt: now },
    { id: nodeProjecten, projectId, parentId: nodeHome, title: 'Projecten', slug: 'projecten', fullUrl: 'https://csh-nieuw.nl/projecten', level: 1, sortOrder: 2, type: 'archive' as const, goal: 'overtuigen' as const, targetAudience: 'Potentiële klanten', reasonExists: 'Social proof via uitgevoerde projecten', isInMainNav: true, isDetailTemplate: false, isParked: false, priority: 'hoog' as const, label: 'herschrijven' as const, contentStatus: 'niet-gestart' as const, focusTopic: 'koeltechniek projecten', metaTitle: '', metaDescription: '', redirectsFrom: ['coolingserviceholland.nl/projecten'], needsRedirect: true, relatedUserStoryIds: [storyId2], openQuestionIds: [qId4], notes: '', createdAt: now, updatedAt: now },
    { id: nodeCaseAH, projectId, parentId: nodeProjecten, title: 'Albert Heijn Distributiecentrum', slug: 'albert-heijn-dc', fullUrl: 'https://csh-nieuw.nl/projecten/albert-heijn-dc', level: 2, sortOrder: 0, type: 'case' as const, goal: 'overtuigen' as const, targetAudience: 'Facility managers retail', reasonExists: 'Topcase die expertise in retail-koeling bewijst', isInMainNav: false, isDetailTemplate: false, isParked: false, priority: 'hoog' as const, label: 'nieuw' as const, contentStatus: 'niet-gestart' as const, focusTopic: 'koelinstallatie albert heijn', metaTitle: '', metaDescription: '', redirectsFrom: [], needsRedirect: false, relatedUserStoryIds: [storyId2], openQuestionIds: [], notes: '', createdAt: now, updatedAt: now },
    { id: nodeCaseJumbo, projectId, parentId: nodeProjecten, title: 'Jumbo Supermarkten', slug: 'jumbo-supermarkten', fullUrl: 'https://csh-nieuw.nl/projecten/jumbo-supermarkten', level: 2, sortOrder: 1, type: 'case' as const, goal: 'overtuigen' as const, targetAudience: 'Facility managers retail', reasonExists: 'Topcase die schaal en betrouwbaarheid toont', isInMainNav: false, isDetailTemplate: false, isParked: false, priority: 'hoog' as const, label: 'nieuw' as const, contentStatus: 'niet-gestart' as const, focusTopic: 'koeling jumbo supermarkten', metaTitle: '', metaDescription: '', redirectsFrom: [], needsRedirect: false, relatedUserStoryIds: [storyId2], openQuestionIds: [], notes: '', createdAt: now, updatedAt: now },
    { id: nodeCaseHoreca, projectId, parentId: nodeProjecten, title: 'Restaurant De Kas', slug: 'restaurant-de-kas', fullUrl: 'https://csh-nieuw.nl/projecten/restaurant-de-kas', level: 2, sortOrder: 2, type: 'case' as const, goal: 'overtuigen' as const, targetAudience: 'Horeca-ondernemers', reasonExists: 'Case voor horeca-branche om breedheid te tonen', isInMainNav: false, isDetailTemplate: false, isParked: false, priority: 'middel' as const, label: 'nieuw' as const, contentStatus: 'niet-gestart' as const, focusTopic: 'koeling horeca restaurant', metaTitle: '', metaDescription: '', redirectsFrom: [], needsRedirect: false, relatedUserStoryIds: [storyId2], openQuestionIds: [], notes: 'Nog wachtend op case-beschrijving klant', createdAt: now, updatedAt: now },
    { id: nodeBlog, projectId, parentId: nodeHome, title: 'Blog', slug: 'blog', fullUrl: 'https://csh-nieuw.nl/blog', level: 1, sortOrder: 3, type: 'archive' as const, goal: 'informeren' as const, targetAudience: 'Technisch directeuren, vakgenoten', reasonExists: 'SEO-waarde en kennisdeling rond regelgeving en innovatie', isInMainNav: true, isDetailTemplate: false, isParked: false, priority: 'middel' as const, label: 'herschrijven' as const, contentStatus: 'niet-gestart' as const, focusTopic: 'koeltechniek blog', metaTitle: '', metaDescription: '', redirectsFrom: [], needsRedirect: false, relatedUserStoryIds: [storyId3], openQuestionIds: [qId6], notes: '', createdAt: now, updatedAt: now },
    { id: nodeBlogFgassen, projectId, parentId: nodeBlog, title: 'F-gassen regelgeving 2026', slug: 'f-gassen-regelgeving-2026', fullUrl: 'https://csh-nieuw.nl/blog/f-gassen-regelgeving-2026', level: 2, sortOrder: 0, type: 'post' as const, goal: 'informeren' as const, targetAudience: 'Technisch directeuren', reasonExists: 'SEO-content over actueel onderwerp met zoekvolume', isInMainNav: false, isDetailTemplate: false, isParked: false, priority: 'hoog' as const, label: 'nieuw' as const, contentStatus: 'niet-gestart' as const, focusTopic: 'f-gassen regelgeving', metaTitle: '', metaDescription: '', redirectsFrom: [], needsRedirect: false, relatedUserStoryIds: [storyId3], openQuestionIds: [], notes: '', createdAt: now, updatedAt: now },
    { id: nodeContact, projectId, parentId: nodeHome, title: 'Contact', slug: 'contact', fullUrl: 'https://csh-nieuw.nl/contact', level: 1, sortOrder: 4, type: 'page' as const, goal: 'converteren' as const, targetAudience: 'Alle bezoekers met vragen of offerteaanvraag', reasonExists: 'Primaire conversiepagina voor leads', isInMainNav: true, isDetailTemplate: false, isParked: false, priority: 'hoog' as const, label: 'herschrijven' as const, contentStatus: 'in-progress' as const, focusTopic: 'contact koeltechniek', metaTitle: 'Contact | Cooling Service Holland', metaDescription: 'Neem contact op voor vragen over koeltechniek.', redirectsFrom: ['coolingserviceholland.nl/contact'], needsRedirect: true, relatedUserStoryIds: [storyId4], openQuestionIds: [qId8], notes: '', createdAt: now, updatedAt: now },
  ]
  writeCollection('siteNodes', siteNodes)

  // ---- Page Blocks (Fase 3 – demo voor Home en Contact) ----
  const pageBlocks = [
    // Home page blokken
    { id: makePageId(), projectId, siteNodeId: nodeHome, sortOrder: 0, name: 'Hero banner', type: 'hero' as const, goal: 'Direct duidelijk maken wie CSH is', targetUser: 'Alle bezoekers', contentDescription: 'Krachtige headline, subkop, hero-afbeelding koelinstallatie, primaire CTA naar contact', componentPattern: 'full-width hero met overlay tekst', isReusable: false, reusableBlockId: null, notesContent: 'Headline: "Uw specialist in koeltechniek"', notesSeo: 'H1 met focus keyword "koeltechniek specialist"', notesDesign: 'Gebruik foto van koelinstallatie in supermarkt', answersQuestionIds: [], forUserStoryIds: [storyId1], createdAt: now },
    { id: makePageId(), projectId, siteNodeId: nodeHome, sortOrder: 1, name: 'USP-blok', type: 'usp' as const, goal: 'Kernwaarden en onderscheidende punten tonen', targetUser: 'Facility managers', contentDescription: '3-4 USPs: 25+ jaar ervaring, 24/7 storingsdienst, F-gassen gecertificeerd, landelijke dekking', componentPattern: '3-4 kolommen met iconen', isReusable: true, reusableBlockId: null, notesContent: 'USPs moeten concreet en meetbaar zijn', notesSeo: '', notesDesign: 'Iconen in huisstijlkleuren', answersQuestionIds: [], forUserStoryIds: [storyId1], createdAt: now },
    { id: makePageId(), projectId, siteNodeId: nodeHome, sortOrder: 2, name: 'Diensten overzicht', type: 'dienst-uitleg' as const, goal: 'Bezoekers doorverwijzen naar relevante dienstpagina', targetUser: 'Facility managers, technisch directeuren', contentDescription: 'Korte introductie + 3 kaarten: Food & Beverage, Utiliteit, Horeca', componentPattern: 'Sectie met 3 kaarten + afbeeldingen', isReusable: false, reusableBlockId: null, notesContent: 'Per kaart: korte tekst + link naar dienstpagina', notesSeo: 'Interne links naar dienstpagina\'s', notesDesign: 'Kaarten met hover-effect', answersQuestionIds: [qId1, qId2], forUserStoryIds: [storyId1], createdAt: now },
    { id: makePageId(), projectId, siteNodeId: nodeHome, sortOrder: 3, name: 'Uitgelichte cases', type: 'cases' as const, goal: 'Social proof tonen via uitgevoerde projecten', targetUser: 'Potentiële klanten', contentDescription: '2-3 uitgelichte cases met afbeelding en resultaat', componentPattern: 'Slider of grid met case-kaarten', isReusable: true, reusableBlockId: null, notesContent: 'Link naar volledige case-pagina', notesSeo: '', notesDesign: '', answersQuestionIds: [qId3], forUserStoryIds: [storyId2], createdAt: now },
    { id: makePageId(), projectId, siteNodeId: nodeHome, sortOrder: 4, name: 'CTA Contact', type: 'cta' as const, goal: 'Bezoeker aanzetten tot contact/offerte', targetUser: 'Alle bezoekers', contentDescription: 'Korte tekst + twee buttons: Offerte aanvragen, Bel ons', componentPattern: 'Full-width CTA balk', isReusable: true, reusableBlockId: null, notesContent: '', notesSeo: '', notesDesign: 'Contrastkleur achtergrond', answersQuestionIds: [qId7], forUserStoryIds: [storyId4], createdAt: now },
    // Contact page blokken
    { id: makePageId(), projectId, siteNodeId: nodeContact, sortOrder: 0, name: 'Contact header', type: 'hero' as const, goal: 'Duidelijk maken dat dit de contactpagina is', targetUser: 'Alle bezoekers', contentDescription: 'Headline "Neem contact op", subtekst met bereikbaarheid', componentPattern: 'Kleine hero met tekst', isReusable: false, reusableBlockId: null, notesContent: '', notesSeo: 'H1 met "contact koeltechniek"', notesDesign: 'Compacte hero', answersQuestionIds: [], forUserStoryIds: [storyId4], createdAt: now },
    { id: makePageId(), projectId, siteNodeId: nodeContact, sortOrder: 1, name: 'Contactformulier', type: 'formulier' as const, goal: 'Lead capture via formulier', targetUser: 'Potentiële klanten', contentDescription: 'Naam, e-mail, telefoon, bedrijf, bericht + submit', componentPattern: 'Twee-koloms layout: formulier links, contactinfo rechts', isReusable: false, reusableBlockId: null, notesContent: 'Verplichte velden: naam, e-mail, bericht', notesSeo: '', notesDesign: '', answersQuestionIds: [qId7], forUserStoryIds: [storyId4], createdAt: now },
    { id: makePageId(), projectId, siteNodeId: nodeContact, sortOrder: 2, name: 'Locatie en bereikbaarheid', type: 'afbeelding-tekst' as const, goal: 'Praktische info tonen', targetUser: 'Bezoekers die langskomen', contentDescription: 'Google Maps embed, adres, openingstijden, routebeschrijving', componentPattern: 'Map + tekst blok', isReusable: false, reusableBlockId: null, notesContent: '', notesSeo: '', notesDesign: 'Google Maps of statische kaart', answersQuestionIds: [], forUserStoryIds: [storyId4], createdAt: now },
  ]
  writeCollection('pageBlocks', pageBlocks)

  // ---- Change Log ----
  const changeLog = [
    { id: makePageId(), projectId, timestamp: '2026-02-22T10:00:00.000Z', action: 'added' as const, entityType: 'siteNode' as const, entityId: nodeHome, entityTitle: 'Home', details: 'Initiële structuur aangemaakt', oldValue: undefined, newValue: undefined },
    { id: makePageId(), projectId, timestamp: '2026-02-22T10:05:00.000Z', action: 'added' as const, entityType: 'siteNode' as const, entityId: nodeHoreca, entityTitle: 'Horeca', details: 'Nieuwe branche-pagina toegevoegd onder Diensten', oldValue: undefined, newValue: undefined },
    { id: makePageId(), projectId, timestamp: '2026-02-22T10:10:00.000Z', action: 'added' as const, entityType: 'siteNode' as const, entityId: nodeWerkenBij, entityTitle: 'Werken bij', details: 'Nieuwe pagina toegevoegd onder Over ons', oldValue: undefined, newValue: undefined },
    { id: makePageId(), projectId, timestamp: '2026-02-23T14:00:00.000Z', action: 'block-added' as const, entityType: 'pageBlock' as const, entityId: nodeHome, entityTitle: 'Home', details: '5 blokken toegevoegd aan Home pagina', oldValue: undefined, newValue: undefined },
  ]
  writeCollection('changeLog', changeLog)
}

let _counter = 100
function makePageId(): string {
  return `seed${String(++_counter).padStart(4, '0')}`
}
