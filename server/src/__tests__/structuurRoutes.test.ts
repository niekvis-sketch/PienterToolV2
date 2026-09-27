import express from 'express'
import type { AddressInfo } from 'net'
import type { Server } from 'http'
import type { PageBlock, ProjectMenu, SiteNode } from '../../../shared/types'

// In-memory opslag i.p.v. de echte /data-map.
const db: Record<string, unknown[]> = {}
jest.mock('../storage', () => ({
  readCollection: (name: string) => JSON.parse(JSON.stringify(db[name] ?? [])),
  writeCollection: (name: string, data: unknown[]) => { db[name] = JSON.parse(JSON.stringify(data)) },
}))

import { structuurRouter } from '../routes/structuur'

const P = 'proj1'
const DOMAIN = 'vanlier.nl'
let server: Server
let base = ''

function siteNode(id: string, title: string, slug: string, parentId: string | null, fullPath: string, extra: Partial<SiteNode> = {}): SiteNode {
  return {
    id, projectId: P, parentId, title, slug, fullUrl: `https://${DOMAIN}${fullPath}`, level: parentId ? 1 : 0, sortOrder: 0,
    type: 'page', goal: null, targetAudience: '', reasonExists: '', isInMainNav: true, isDetailTemplate: false,
    isParked: false, priority: 'middel', label: 'nieuw', contentStatus: 'niet-gestart', focusTopic: '',
    metaTitle: '', metaDescription: '', redirectsFrom: [], needsRedirect: false, relatedUserStoryIds: [],
    openQuestionIds: [], notes: '', createdAt: '', updatedAt: '', ...extra,
  }
}

function block(id: string, siteNodeId: string, name: string, sortOrder: number, extra: Partial<PageBlock> = {}): PageBlock {
  return {
    id, projectId: P, siteNodeId, sortOrder, name, type: 'custom', goal: '', targetUser: '', contentDescription: '',
    componentPattern: '', isReusable: false, reusableBlockId: null, notesContent: '', notesSeo: '', notesDesign: '',
    answersQuestionIds: [], forUserStoryIds: [], createdAt: '', ...extra,
  }
}

async function call(method: string, path: string, body?: unknown) {
  const res = await fetch(`${base}/api/structuur/${P}${path}`, {
    method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined,
  })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { status: res.status, body: (await res.json()) as any }
}

beforeAll(done => {
  const app = express()
  app.use(express.json())
  app.use('/api/structuur', structuurRouter)
  server = app.listen(0, () => {
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
    done()
  })
})
afterAll(done => { server.close(done) })

beforeEach(() => {
  for (const k of Object.keys(db)) delete db[k]
  db.projects = [{ id: P, domainNew: DOMAIN }]
  db.siteNodes = [
    siteNode('diensten', 'Diensten', 'diensten', null, '/diensten'),
    siteNode('bc', 'Bedrijfscatering', 'bedrijfscatering', 'diensten', '/diensten/bedrijfscatering'),
    siteNode('zl', 'Zakelijke lunch', 'zakelijke-lunch', 'diensten', '/diensten/zakelijke-lunch', { redirectsFrom: ['/lunch'] }),
    siteNode('zl-sub', 'Lunchmenu', 'lunchmenu', 'zl', '/diensten/zakelijke-lunch/lunchmenu'),
  ]
  db.pageBlocks = [
    block('b1', 'bc', 'Hero', 0),
    block('b2', 'zl', 'Hero', 0),
    block('b3', 'zl', 'Lunchconcepten', 1),
  ]
  db.menus = [{
    projectId: P, updatedAt: '',
    items: [
      { id: 'm1', siteNodeId: 'diensten', parentId: null, sortOrder: 0 },
      { id: 'm2', siteNodeId: 'zl', parentId: 'm1', sortOrder: 0 },
    ],
  }]
})

describe('POST /nodes/:nodeId/merge', () => {
  it('voegt een pagina samen: blokken, subpagina\'s en de oude URL gaan naar het doel', async () => {
    const res = await call('POST', '/nodes/zl/merge', { intoNodeId: 'bc' })
    expect(res.status).toBe(200)
    expect(res.body.data.movedBlocks).toBe(1)

    const nodes = db.siteNodes as SiteNode[]
    expect(nodes.find(n => n.id === 'zl')).toBeUndefined()
    const target = nodes.find(n => n.id === 'bc')!
    expect(target.redirectsFrom).toEqual(expect.arrayContaining(['/diensten/zakelijke-lunch', '/lunch']))
    expect(target.needsRedirect).toBe(true)

    const sub = nodes.find(n => n.id === 'zl-sub')!
    expect(sub.parentId).toBe('bc')
    expect(sub.fullUrl).toBe(`https://${DOMAIN}/diensten/bedrijfscatering/lunchmenu`)

    // Dubbele "Hero" vervalt, "Lunchconcepten" verhuist mee.
    const blocks = db.pageBlocks as PageBlock[]
    expect(blocks.filter(b => b.siteNodeId === 'bc').map(b => b.name)).toEqual(['Hero', 'Lunchconcepten'])
    expect(blocks.some(b => b.id === 'b2')).toBe(false)

    // Menu-item van de bron wijst nu naar het doel.
    const menu = (db.menus as ProjectMenu[])[0]
    expect(menu.items.find(i => i.id === 'm2')?.siteNodeId).toBe('bc')
  })

  it('weigert samenvoegen in een eigen subpagina', async () => {
    const res = await call('POST', '/nodes/zl/merge', { intoNodeId: 'zl-sub' })
    expect(res.status).toBe(400)
  })
})

describe('herbruikbare blokken', () => {
  it('neemt wijzigingen van het origineel over in de kopieën', async () => {
    db.pageBlocks = [
      block('orig', 'bc', 'Reviews', 0, { isReusable: true, contentDescription: 'oud' }),
      block('copy', 'zl', 'Reviews', 0, { isReusable: true, reusableBlockId: 'orig', contentDescription: 'oud' }),
    ]
    await call('PUT', '/nodes/bc/blocks/orig', { contentDescription: 'Drie klantreviews met sterren' })
    const copy = (db.pageBlocks as PageBlock[]).find(b => b.id === 'copy')!
    expect(copy.contentDescription).toBe('Drie klantreviews met sterren')
  })

  it('maakt kopieën zelfstandig als het origineel verdwijnt', async () => {
    db.pageBlocks = [
      block('orig', 'bc', 'Reviews', 0, { isReusable: true }),
      block('copy', 'zl', 'Reviews', 0, { isReusable: true, reusableBlockId: 'orig' }),
    ]
    await call('DELETE', '/nodes/bc/blocks/orig')
    const copy = (db.pageBlocks as PageBlock[]).find(b => b.id === 'copy')!
    expect(copy.reusableBlockId).toBeNull()
  })
})

describe('menu', () => {
  it('bewaart en leest het menu per project', async () => {
    const items = [{ id: 'x', siteNodeId: 'bc', parentId: null, sortOrder: 0 }]
    await call('PUT', '/menu', { items })
    const res = await call('GET', '/menu')
    expect(res.body.data.items).toEqual(items)
  })
})

describe('import', () => {
  it('neemt paginavelden uit de import over', async () => {
    db.siteNodes = []
    db.pageBlocks = []
    const res = await call('POST', '/nodes/import', {
      root: [{
        title: 'Home', slug: '', focusTopic: 'catering', label: 'bestaand', requirements: 'Offerteformulier',
        redirectsFrom: ['/home'], blocks: [{ name: 'Reviews', type: 'reviews', isReusable: true }],
      }],
    })
    const home = res.body.data.nodes[0] as SiteNode
    expect(home).toMatchObject({ focusTopic: 'catering', label: 'bestaand', requirements: 'Offerteformulier', redirectsFrom: ['/home'], needsRedirect: true })
    expect(res.body.data.blocks[0].isReusable).toBe(true)
  })
})
