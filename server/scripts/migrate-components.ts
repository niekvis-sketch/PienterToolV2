// ============================================================
// Eenmalige migratie: oude component-library → nieuwe Figma-export.
//
// 1. Vervangt de oude componenten van een project in components.json
//    door de nieuwe 36 (uit de seed / single source of truth).
// 2. Migreert pageBlocks: de oude componentnaam zat in `block.type`.
//    Die wordt verplaatst naar `componentPattern` (de nieuwe naam) en
//    `block.type` krijgt weer een echte BlockType.
//
// Draaien:  npx tsx server/scripts/migrate-components.ts [projectId]
// ============================================================
import { readCollection, writeCollection } from '../src/storage'
import { buildDefaultComponents } from '../src/routes/componenten'
import type { ComponentBlock, PageBlock, BlockType } from '../../shared/types'

const PROJECT_ID = process.argv[2] || 'demo0001'

// Oude componentnaam → nieuwe library-componentnaam (komt in componentPattern)
const OLD_TO_NEW_COMPONENT: Record<string, string> = {
  'Broodblok-Header+menu': 'Navbar',
  'Broodblok-Hero': 'Hero',
  'Broodblok-Footer': 'Footer',
  'Flexblok-USP-Tekst': 'USP',
  'Flexblok-USP-Cijfers': 'USPNumbers',
  'Flexblok-Quote': 'Quote',
  'Flexblok-Testimonials': 'Testimonials',
  'Flexblok-Tekst': 'Text',
  'Flexblok-Stappenplan-Teaser': 'StepsTeaser',
  'Flexblok-Stappenplan-Media': 'StepsMedia',
  'Flexblok-Media-Tekst': 'MediaText',
  'Flexblok-Media-Slider': 'MediaSlider',
  'Flexblok-Media-Grid': 'MediaGrid',
  'Flexblok-Kolommen-Tekst': 'Columns',
  'Flexblok-Formulier': 'Form',
  'Flexblok-CTA Banner': 'CTA',
  'Flexblok-Blokken-Tekst': 'Cards',
  'Flexblok-Accordion': 'Accordion',
  'posttype-cases-overzicht': 'Cases',
  'posttype-blog-overzicht': 'Blogs',
  'posttype-jobs-overzicht': 'Jobs',
}

// Oude componentnaam → semantische BlockType (komt in block.type)
const OLD_TO_BLOCKTYPE: Record<string, BlockType> = {
  'Broodblok-Header+menu': 'custom',
  'Broodblok-Hero': 'hero',
  'Broodblok-Footer': 'custom',
  'Flexblok-USP-Tekst': 'usp',
  'Flexblok-USP-Cijfers': 'statistieken',
  'Flexblok-Quote': 'reviews',
  'Flexblok-Testimonials': 'reviews',
  'Flexblok-Tekst': 'introductie',
  'Flexblok-Stappenplan-Teaser': 'stappenplan',
  'Flexblok-Stappenplan-Media': 'stappenplan',
  'Flexblok-Media-Tekst': 'afbeelding-tekst',
  'Flexblok-Media-Slider': 'afbeelding-tekst',
  'Flexblok-Media-Grid': 'afbeelding-tekst',
  'Flexblok-Kolommen-Tekst': 'dienst-uitleg',
  'Flexblok-Formulier': 'formulier',
  'Flexblok-CTA Banner': 'cta',
  'Flexblok-Blokken-Tekst': 'dienst-uitleg',
  'Flexblok-Accordion': 'faq',
  'posttype-cases-overzicht': 'cases',
  'posttype-blog-overzicht': 'custom',
  'posttype-jobs-overzicht': 'custom',
}

// ---------- 1. Componenten vervangen ----------
const allComponents = readCollection<ComponentBlock>('components')
const otherProjects = allComponents.filter(c => c.projectId !== PROJECT_ID)
const removed = allComponents.length - otherProjects.length
const fresh = buildDefaultComponents(PROJECT_ID)
writeCollection('components', [...otherProjects, ...fresh])
console.log(`components.json: ${removed} oude verwijderd, ${fresh.length} nieuwe toegevoegd voor "${PROJECT_ID}".`)

// ---------- 2. PageBlocks migreren ----------
const blocks = readCollection<PageBlock>('pageBlocks')
let migrated = 0
const unknown = new Set<string>()
for (const b of blocks) {
  const newName = OLD_TO_NEW_COMPONENT[b.type as string]
  if (newName) {
    b.componentPattern = newName
    b.type = OLD_TO_BLOCKTYPE[b.type as string] ?? 'custom'
    migrated++
  } else if (b.componentPattern === '' && !isKnownBlockType(b.type)) {
    // type is geen oude componentnaam én geen echte BlockType → noteer
    unknown.add(b.type as string)
  }
}
writeCollection('pageBlocks', blocks)
console.log(`pageBlocks.json: ${migrated} van ${blocks.length} blokken gemigreerd (componentnaam → componentPattern).`)
if (unknown.size > 0) {
  console.log(`Let op, onbekende type-waarden ongemoeid gelaten: ${Array.from(unknown).join(', ')}`)
}

function isKnownBlockType(t: string): boolean {
  const types: BlockType[] = ['hero', 'introductie', 'usp', 'dienst-uitleg', 'stappenplan', 'cases', 'reviews', 'faq', 'cta', 'contact', 'formulier', 'afbeelding-tekst', 'branche-overzicht', 'gerelateerde-paginas', 'video', 'prijzen', 'team', 'statistieken', 'custom']
  return (types as string[]).includes(t)
}

console.log('Migratie klaar.')
