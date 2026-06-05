// ============================================================
// Componenten Routes – ACF Component blokken per project
// Categorieën: broodblok, flexblok, posttype
// ============================================================
import { Router, Request, Response } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { readCollection, writeCollection } from '../storage'
import { genId, now, ok, err } from '../helpers'
import type { ComponentBlock, ComponentCategory, ComponentVariant, ComponentSubBlock } from '../../../shared/types'

export const componentenRouter = Router()

// ---------- Multer config voor afbeelding uploads ----------
const UPLOAD_DIR = path.resolve(__dirname, '../../data/uploads/components')
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `${genId()}-${Date.now()}${ext}`)
  },
})

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    const allowed = ['.png', '.jpg', '.jpeg', '.webp', '.gif']
    const ext = path.extname(file.originalname).toLowerCase()
    cb(null, allowed.includes(ext))
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
})

// ---------- Storage helpers ----------
function getComponents(): ComponentBlock[] { return readCollection<ComponentBlock>('components') }
function saveComponents(d: ComponentBlock[]) { writeCollection('components', d) }

// ---------- Seed defaults voor een project ----------
// Bron: Figma component library export (PAID-PLAN-test / Flexibel Simplified), 2026-05-27.
// 36 componenten: 4 broodblokken, 16 flexblokken, 10 posttypes.
type SeedComponent = {
  name: string
  category: ComponentCategory
  description?: string
  variants?: ComponentVariant[]
  subComponents?: ComponentSubBlock[]
  helpers?: string[]
}

// Helper voor een variant-as
const v = (property: string, values: string[]): ComponentVariant => ({ property, values })
// Helper voor een sub-component
const sub = (name: string, description = '', variants: ComponentVariant[] = []): ComponentSubBlock => ({ name, description, variants })

const DEFAULT_COMPONENTS: SeedComponent[] = [
  // ===================== Broodblokken (4) =====================
  {
    name: 'Hero', category: 'broodblok',
    description: 'Grote intro-sectie bovenaan een pagina met heading, afbeelding en CTA-buttons. Altijd het eerste blok op een pagina, full-width en visueel dominant.',
    subComponents: [
      sub('Groot/ImageMetTekst', 'Full-size hero met achtergrondafbeelding, titel, subtitel en twee buttons.'),
      sub('Klein/ImageMetTekst', 'Compactere hero met afbeelding en tekst, zelfde opzet als Groot maar kleiner.'),
    ],
  },
  {
    name: 'Navbar', category: 'broodblok',
    description: 'Hoofdnavigatie bovenaan elke pagina met logo, menu-items en CTA-button. Het enige blok dat op elke pagina terugkomt als navigatie-element.',
    subComponents: [
      sub('Klein/Standaard', 'Standaard navigatiebalk met logo en menu.'),
      sub('Klein/DigitaalToegankelijk', 'Navigatiebalk met toegankelijkheidsicoon.'),
    ],
  },
  {
    name: 'Footer', category: 'broodblok',
    description: 'Voettekst met logo, social media iconen, links en optioneel een contactformulier. Bevat contactinfo en site-brede links, sluit elke pagina af.',
    variants: [v('Variant', ['MetContactForm', 'Standaard'])],
  },
  {
    name: 'UnderFooter', category: 'broodblok',
    description: 'Smalle balk onder de footer met copyright-informatie. Het kleinste en meest minimalistische blok, altijd onderaan.',
    subComponents: [
      sub('Copyrightbalk', 'Eenregelige balk met copyright-tekst.'),
    ],
  },

  // ===================== Flexibele blokken (16) =====================
  {
    name: 'Text', category: 'flexblok',
    description: 'Puur tekstblok zonder media. Bevat tagline, heading, body text en twee buttons (primair + secundair). Het enige blok dat uitsluitend tekst toont.',
    variants: [v('Align', ['Left', 'Center', 'Right'])],
  },
  {
    name: 'MediaText', category: 'flexblok',
    description: 'Tekst naast of boven/onder media (afbeelding of video). Het meest veelzijdige blok. T.o.v. Cards: media en tekst staan naast/boven elkaar, niet als overlay.',
    subComponents: [
      sub('Default', 'Twee kolommen side-by-side, tekst en media naast elkaar. Tagline, heading, body, twee buttons.', [v('Layout', ['TextLeftImageRight', 'TextRightImageLeft', 'TextLeftVideoRight', 'TextRightVideoLeft'])]),
      sub('Centered', 'Gestapeld verticaal, tekst en media boven/onder elkaar, gecentreerd over de volle breedte.', [v('Layout', ['TextTopImageBottom', 'TextBottomImageTop', 'TextTopVideoBottom', 'TextBottomVideoTop'])]),
      sub('MediaOnly', 'Alleen media zonder tekst, puur een afbeelding of video placeholder.', [v('Type', ['Image', 'Video'])]),
      sub('TextRight', 'Losstaande variant met tekst rechts naast media.'),
    ],
  },
  {
    name: 'Columns', category: 'flexblok',
    description: 'Tekst verdeeld over 1, 2 of 3 kolommen. Elke kolom heeft een eigen tagline, heading, body text en button. Ideaal voor het vergelijken van diensten of features.',
    subComponents: [
      sub('1Col', '', [v('Align', ['Left', 'Center', 'Right'])]),
      sub('2Col', '', [v('Align', ['Left', 'Center', 'Right'])]),
      sub('3Col', '', [v('Align', ['Left', 'Center', 'Right'])]),
    ],
    helpers: ['TextBlockLeft', 'TextBlockCenter', 'TextBlockRight'],
  },
  {
    name: 'Cards', category: 'flexblok',
    description: 'Kaart-achtige blokken die tekst combineren met achtergrondafbeeldingen. De afbeelding vormt de achtergrond of is direct gekoppeld aan een tekstkaart.',
    subComponents: [
      sub('Blocks', 'Verschillende layout-configuraties voor tekst met afbeelding.', [v('Layout', ['TextOnImage', 'TextBelowImage', 'TextAboveImage'])]),
    ],
  },
  {
    name: 'MediaSlider', category: 'flexblok',
    description: 'Carrousel/slider met gecentreerde tekstbanner en navigatie-controls (pijlen + dots). Het enige blok met navigatie-controls, bedoeld voor doorbladerbare media.',
    subComponents: [
      sub('CenterBanner', 'Gecentreerde tekst boven een slider met navigatiepijlen en paginatie.'),
      sub('Doorlopend', 'Tekstblok naast een doorlopende (auto-scrollende) rij media-tiles die over de rand bleed\'t.', [v('Layout', ['TextLeftSliderRight', 'TextRightSliderLeft'])]),
    ],
  },
  {
    name: 'USP', category: 'flexblok',
    description: 'Unique Selling Points met iconen. Toont USP-items bestaande uit een icoon, heading en korte beschrijving. Verschilt van Columns doordat elk item een visueel icoon heeft.',
    subComponents: [
      sub('Default', '1, 2 of 3 USP-items in een rij, bovenaan een heading met button.', [v('Count', ['1', '2', '3'])]),
      sub('TextLeftImageRight', 'Beschrijvende tekst links met USP-items en een grote afbeelding rechts.'),
      sub('GridRightTextLeft', 'USP-items als grid rechts, samenvattende tekst links met button.'),
      sub('Item', 'Individueel USP-bouwblok (icoon + tekst).'),
    ],
  },
  {
    name: 'USPNumbers', category: 'flexblok',
    description: 'Statistieken en cijfers prominent weergegeven. Grote getallen met labels eronder. Draait om numerieke impact i.p.v. iconen.',
    subComponents: [
      sub('CenterBanner', 'Cijfers gecentreerd in een rij.'),
      sub('NumbersLeftTextRight', 'Cijfers links, heading en body text rechts.'),
    ],
  },
  {
    name: 'CTA', category: 'flexblok',
    description: 'Opvallende call-to-action blokken met donkere/gekleurde achtergronden en prominente buttons. Het "conversie-blok".',
    subComponents: [
      sub('CenterCard', 'Donkere kaart met afbeelding-thumbnail links, tekst en button rechts.'),
      sub('ImageLeftTextRight', 'Donkere achtergrond met afbeelding links en tekst rechts.'),
      sub('BackgroundTextLeft', 'Full-width achtergrondafbeelding met tekst-overlay links en button.'),
    ],
  },
  {
    name: 'MediaGrid', category: 'flexblok',
    description: 'Raster van media-items met titels in een grid-layout. Geschikt voor portfolio\'s, galerijen of productoverzichten.',
    subComponents: [
      sub('TextImage', 'Full-width sectie met heading bovenaan, dan grid van afbeeldingskaarten met titels, beschrijvingen en link-iconen.'),
      sub('TitleImage', 'Grid van afbeeldingen met titels.', [v('Tags', ['With', 'Without'])]),
    ],
  },
  {
    name: 'Quote', category: 'flexblok',
    description: 'Testimonial/citaat-blokken met aanhalingstekens-icoon, naam en persoonsfoto of bedrijfslogo. Het enige blok specifiek voor sociale bewijskracht.',
    subComponents: [
      sub('TextImage', 'Citaat met aanhalingstekens, tekst aan de ene kant, persoonsfoto aan de andere.', [v('Layout', ['TextLeftPersonRight', 'TextRightPersonLeft'])]),
      sub('TextInKader', 'Citaat in een gestileerd kader met aanhalingstekens, naam, achternaam en bedrijfslogo.'),
    ],
  },
  {
    name: 'StepsMedia', category: 'flexblok',
    description: 'Stapsgewijs proces met afbeelding. Genummerde stappen (1-5) verticaal met heading en beschrijving, plus een ondersteunende visual.',
    subComponents: [
      sub('StepsLeftImageRight', 'Genummerde stappen verticaal op een rij, afbeelding rechts.'),
      sub('Step', 'Individueel stap-bouwblok (nummer + tekst).'),
    ],
  },
  {
    name: 'StepsTeaser', category: 'flexblok',
    description: 'Stapsgewijs proces als compacte teaser met voortgangslijn (dots op een lijn). Het "stappenplan in een oogopslag".',
    subComponents: [
      sub('Default', 'Stappen als kaarten met voortgangsindicator, grotere stippen.', [v('Direction', ['Horizontal', 'Vertical'])]),
      sub('SmallDots', 'Zelfde maar met kleinere stippen op de voortgangslijn.', [v('Direction', ['Horizontal', 'Vertical'])]),
    ],
  },
  {
    name: 'Accordion', category: 'flexblok',
    description: 'Uitklapbare FAQ-achtige component met titel, beschrijvende tekst en inklapbare items met chevron-icoon. Het enige interactieve blok waar content verborgen is tot de gebruiker klikt.',
    variants: [v('Variant', ['Default'])],
  },
  {
    name: 'Form', category: 'flexblok',
    description: 'Formulier-componenten voor leadgeneratie en contact. Het enige blok met invoervelden, bedoeld voor gebruikersinteractie en data-verzameling.',
    subComponents: [
      sub('Default', 'Twee-kolom layout met contactinfo en USP-bolletjes links, formulierblok met donkere header rechts.'),
      sub('Contact', 'Eenvoudig formulier met titel, meerdere invoervelden en verzendknop.'),
      sub('FieldLeftImageRight', 'Formuliervelden links, afbeelding rechts.'),
    ],
  },
  {
    name: 'LinkBlocks', category: 'flexblok',
    description: 'Navigatie/link-kaarten als sectie. Elke kaart is een doorverwijzing met afbeelding, titel, beschrijving en button.',
    subComponents: [
      sub('Default', 'Sectie met heading, "bekijk alles"-link en 3 linkkaarten in een rij met paginatie.'),
      sub('Card', 'Individuele linkkaart-bouwblok.'),
    ],
  },
  {
    name: 'Featured', category: 'flexblok',
    description: 'Highlight-blok met uitgelicht content-item, geschikt voor het uitlichten van een persoon, case study of artikel.',
    subComponents: [
      sub('TextLeftHighlightRight', 'Beschrijvende tekst links en een uitgelichte kaart rechts met persoonsfoto, overlay-label en doorlink-pijl.'),
    ],
  },

  // ===================== Posttypes (10) =====================
  // Views (Archive/Detail/Teaser) gemodelleerd als sub-componenten.
  {
    name: 'News', category: 'posttype',
    description: 'Nieuwsberichten en actualiteiten.',
    subComponents: [sub('Archive', 'CardGrid'), sub('Teaser', 'CardSlider')],
    helpers: ['NewsCard'],
  },
  {
    name: 'Blogs', category: 'posttype',
    description: 'Blogartikelen met overzicht, detail en teaser views.',
    subComponents: [sub('Archive', 'CardGrid'), sub('Detail', 'ArticlePage'), sub('Teaser', 'CardSlider')],
    helpers: ['BlogCard', 'BlogHeading'],
  },
  {
    name: 'Events', category: 'posttype',
    description: 'Evenementen en bijeenkomsten.',
    subComponents: [sub('Archive', 'CardGrid'), sub('Teaser', 'CardSlider')],
    helpers: ['EventCard'],
  },
  {
    name: 'Affiliates', category: 'posttype',
    description: 'Partner- en affiliate-links.',
    subComponents: [sub('Teaser', 'LinkStrip')],
  },
  {
    name: 'Portfolio', category: 'posttype',
    description: 'Portfolio-items en projecten.',
    subComponents: [sub('Archive', 'CardGrid'), sub('Teaser', 'CardSlider')],
    helpers: ['PortfolioCard'],
  },
  {
    name: 'FAQ', category: 'posttype',
    description: 'Veelgestelde vragen met accordion-layouts.',
    subComponents: [
      sub('Archive', 'AccordionOneColumn, AccordionTwoColumns'),
      sub('Teaser', 'AccordionOneColumn, AccordionTwoColumns, TextLeftQuestionsRight'),
    ],
    helpers: ['FAQCard (Staat=Open | Staat=Dicht)', 'FAQItemOpen', 'FAQItemClosed'],
  },
  {
    name: 'Jobs', category: 'posttype',
    description: 'Vacatures en functies.',
    subComponents: [sub('Teaser', 'List, CardSlider')],
    helpers: ['JobItem', 'JobCard'],
  },
  {
    name: 'Cases', category: 'posttype',
    description: 'Klantcases en projectreferenties.',
    subComponents: [sub('Archive', 'CardGrid'), sub('Teaser', 'CardSlider')],
    helpers: ['CaseCard'],
  },
  {
    name: 'Testimonials', category: 'posttype',
    description: 'Klantervaringen en aanbevelingen.',
    subComponents: [sub('Archive', 'CardGrid'), sub('Teaser', 'CardSlider')],
    helpers: ['TestimonialCard'],
  },
  {
    name: 'Reviews', category: 'posttype',
    description: 'Beoordelingen en reviews.',
    subComponents: [sub('Teaser', 'ReviewCards')],
    helpers: ['ReviewCard'],
  },
]

// ===================== ROUTES =====================

// GET /api/componenten/:projectId
componentenRouter.get('/:projectId', (req: Request, res: Response) => {
  const all = getComponents().filter(c => c.projectId === req.params.projectId)
  res.json(ok(all))
})

// POST /api/componenten/:projectId/seed
// Maakt de standaard componenten aan als ze nog niet bestaan
componentenRouter.post('/:projectId/seed', (req: Request, res: Response) => {
  const { projectId } = req.params
  const all = getComponents()
  const existing = all.filter(c => c.projectId === projectId)

  if (existing.length > 0) {
    return res.json(ok(existing))
  }

  const created: ComponentBlock[] = DEFAULT_COMPONENTS.map(def => ({
    id: genId(),
    projectId,
    name: def.name,
    category: def.category,
    description: def.description || '',
    imagePath: '',
    variants: def.variants || [],
    subComponents: def.subComponents || [],
    helpers: def.helpers || [],
    createdAt: now(),
    updatedAt: now(),
  }))

  all.push(...created)
  saveComponents(all)
  res.json(ok(created))
})

// POST /api/componenten/:projectId
componentenRouter.post('/:projectId', (req: Request, res: Response) => {
  const all = getComponents()
  const item: ComponentBlock = {
    id: genId(),
    projectId: req.params.projectId,
    name: req.body.name || 'Nieuw component',
    category: req.body.category || 'flexblok',
    description: req.body.description || '',
    imagePath: '',
    variants: req.body.variants || [],
    subComponents: req.body.subComponents || [],
    helpers: req.body.helpers || [],
    createdAt: now(),
    updatedAt: now(),
  }
  all.push(item)
  saveComponents(all)
  res.json(ok(item))
})

// PUT /api/componenten/:projectId/:componentId
componentenRouter.put('/:projectId/:componentId', (req: Request, res: Response) => {
  const all = getComponents()
  const idx = all.findIndex(c => c.id === req.params.componentId && c.projectId === req.params.projectId)
  if (idx < 0) return res.status(404).json(err('Component niet gevonden'))
  all[idx] = {
    ...all[idx],
    ...req.body,
    id: all[idx].id,
    projectId: all[idx].projectId,
    updatedAt: now(),
  }
  saveComponents(all)
  res.json(ok(all[idx]))
})

// DELETE /api/componenten/:projectId/:componentId
componentenRouter.delete('/:projectId/:componentId', (req: Request, res: Response) => {
  const all = getComponents()
  const idx = all.findIndex(c => c.id === req.params.componentId && c.projectId === req.params.projectId)
  if (idx < 0) return res.status(404).json(err('Component niet gevonden'))

  // Verwijder eventueel gekoppelde afbeelding
  if (all[idx].imagePath) {
    const imgPath = path.resolve(__dirname, '../../data', all[idx].imagePath)
    if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath)
  }

  all.splice(idx, 1)
  saveComponents(all)
  res.json(ok({ deleted: true }))
})

// POST /api/componenten/:projectId/:componentId/image
// Upload afbeelding voor een component
componentenRouter.post('/:projectId/:componentId/image', upload.single('image'), (req: Request, res: Response) => {
  if (!req.file) return res.status(400).json(err('Geen afbeelding geüpload'))

  const all = getComponents()
  const idx = all.findIndex(c => c.id === req.params.componentId && c.projectId === req.params.projectId)
  if (idx < 0) return res.status(404).json(err('Component niet gevonden'))

  // Verwijder oude afbeelding als die bestaat
  if (all[idx].imagePath) {
    const oldPath = path.resolve(__dirname, '../../data', all[idx].imagePath)
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath)
  }

  // Sla relatief pad op
  all[idx].imagePath = `uploads/components/${req.file.filename}`
  all[idx].updatedAt = now()
  saveComponents(all)

  res.json(ok(all[idx]))
})

// DELETE /api/componenten/:projectId/:componentId/image
componentenRouter.delete('/:projectId/:componentId/image', (req: Request, res: Response) => {
  const all = getComponents()
  const idx = all.findIndex(c => c.id === req.params.componentId && c.projectId === req.params.projectId)
  if (idx < 0) return res.status(404).json(err('Component niet gevonden'))

  if (all[idx].imagePath) {
    const imgPath = path.resolve(__dirname, '../../data', all[idx].imagePath)
    if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath)
    all[idx].imagePath = ''
    all[idx].updatedAt = now()
    saveComponents(all)
  }

  res.json(ok(all[idx]))
})
