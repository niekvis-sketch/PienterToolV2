<template>
  <div class="space-y-3">
    <!-- Toolbar -->
    <div class="flex items-center justify-between gap-3">
      <p class="text-xs text-gray-500">
        {{ cardCount }} pagina's · {{ edges.length }} verbindingen — sleep een kaartje naar een <strong>rij</strong> om het niveau te bepalen (bovenste rij = hoofdpagina, lager = sub van de kaart erboven). De <strong>horizontale positie</strong> waar je loslaat wordt bewaard; "↻ Opnieuw ordenen" zet alles terug naar de automatische layout.
      </p>
      <div class="flex shrink-0 gap-2">
        <button class="btn-secondary btn-sm" :disabled="saving" @click="relayout">↻ Opnieuw ordenen</button>
        <button class="btn-secondary btn-sm" @click="fitView({ padding: 0.2 })">⤢ Passend</button>
      </div>
    </div>

    <!-- Status -->
    <p v-if="saving" class="text-xs text-pienter-600">Bezig met opslaan…</p>
    <p v-else-if="moveMsg" class="text-xs text-green-600">{{ moveMsg }}</p>

    <!-- Canvas -->
    <div class="h-[72vh] w-full overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
      <div v-if="nodes.length === 0" class="flex h-full flex-col items-center justify-center text-center">
        <div class="mb-3 text-4xl">🗺️</div>
        <p class="text-sm font-medium text-gray-600">Nog geen structuur om te tonen</p>
        <p class="text-xs text-gray-400">Importeer een structuur (knop "Importeren" hierboven) of voeg pagina's toe.</p>
      </div>

      <VueFlow
        v-else
        :nodes="nodes"
        :edges="edges"
        :node-types="nodeTypes"
        :nodes-draggable="!saving"
        :nodes-connectable="false"
        :elements-selectable="false"
        :min-zoom="0.05"
        :max-zoom="2"
        fit-view-on-init
        @pane-ready="onPaneReady"
      >
        <Background :gap="22" pattern-color="#d6dee8" />
        <Controls :show-interactive="false" />
      </VueFlow>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, markRaw, watch, onMounted, nextTick } from 'vue'
import { VueFlow, useVueFlow, type Node, type Edge, type GraphNode } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import dagre from '@dagrejs/dagre'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import '@vue-flow/controls/dist/style.css'
import { useStructuurStore } from '../../stores/structuurStore'
import PageCardNode from './PageCardNode.vue'
import LaneBackground from './LaneBackground.vue'

const props = defineProps<{ projectId: string }>()
const store = useStructuurStore()

const { fitView, onNodeDrag, onNodeDragStop, onNodesInitialized, findNode } = useVueFlow()

// `as any`: Vue Flow's NodeComponent-type matcht een SFC met defineProps niet
// schoon — bekende typing-frictie, runtime werkt prima.
const nodeTypes = { pageCard: markRaw(PageCardNode) as any, lane: markRaw(LaneBackground) as any }

const nodes = ref<Node[]>([])
const edges = ref<Edge[]>([])
const saving = ref(false)
const moveMsg = ref('')

// Aantal echte pagina-kaarten (lane-achtergronden niet meegeteld).
const cardCount = computed(() => nodes.value.filter((n) => n.type === 'pageCard').length)

const NODE_WIDTH = 240
const HEADER_H = 48
const BLOCK_H = 30
const PADDING_H = 16
const RANKSEP = 90
const LANE_PAD = 38      // verticale marge boven/onder de kaarten binnen een lane
const LANE_SIDE = 600    // horizontale overhang zodat lanes breed genoeg zijn

// Lane-banden (één per niveau, plus een lege reservelane onderaan), afgeleid
// uit de dagre-layout. Gebruikt voor zowel rendering als drop-detectie.
interface Lane { level: number; centerY: number; top: number; height: number }
let lanes: Lane[] = []

function laneLabel(level: number): string {
  if (level === 0) return "Hoofdpagina's"
  if (level === 1) return 'Subpagina’s'
  return `Niveau ${level + 1}`
}

function estimateHeight(blockCount: number): number {
  return HEADER_H + PADDING_H + Math.max(1, blockCount) * BLOCK_H
}

// Gemeten echte kaarthoogtes (gevuld zodra Vue Flow ze heeft gerenderd),
// zodat de layout exact klopt en kaarten elkaar niet overlappen.
const heightCache = new Map<string, number>()
function heightFor(id: string, blockCount: number): number {
  return heightCache.get(id) ?? estimateHeight(blockCount)
}

// Bouw nodes + edges uit de site-structuur en de blokken, en bereken een
// nette top-down boom-layout met dagre.
function rebuild() {
  const blocksByNode = new Map<string, typeof store.allProjectBlocks>()
  for (const b of store.allProjectBlocks) {
    const arr = blocksByNode.get(b.siteNodeId) || []
    arr.push(b)
    blocksByNode.set(b.siteNodeId, arr)
  }
  for (const arr of blocksByNode.values()) arr.sort((a, b) => a.sortOrder - b.sortOrder)

  const rawNodes = store.siteNodes.map((n) => {
    const blocks = (blocksByNode.get(n.id) || []).map((b) => ({
      id: b.id, name: b.name, type: b.type, goal: b.goal,
    }))
    return {
      id: n.id,
      type: 'pageCard',
      position: { x: 0, y: 0 },
      data: { title: n.title, fullUrl: n.fullUrl, blocks, aanname: !!n.aanname },
      _height: heightFor(n.id, blocks.length),
    }
  })

  const rawEdges: Edge[] = store.siteNodes
    .filter((n) => n.parentId && store.siteNodes.some((p) => p.id === n.parentId))
    .map((n) => ({
      id: `e-${n.parentId}-${n.id}`,
      source: n.parentId as string,
      target: n.id,
      type: 'default',
      animated: false,
      style: { stroke: '#94a3b8', strokeWidth: 1.5, strokeDasharray: '6 6' },
    }))

  // dagre layout
  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: 'TB', nodesep: 40, ranksep: RANKSEP })
  for (const n of rawNodes) g.setNode(n.id, { width: NODE_WIDTH, height: n._height })
  for (const e of rawEdges) g.setEdge(e.source, e.target)
  dagre.layout(g)

  // Per rij (gelijke dagre-center-y) de hoogste kaart bepalen, zodat we alle
  // kaarten in die rij op hun BOVENKANT kunnen uitlijnen i.p.v. op het midden.
  const rowMaxHeight = new Map<number, number>()
  for (const n of rawNodes) {
    const key = Math.round(g.node(n.id).y)
    rowMaxHeight.set(key, Math.max(rowMaxHeight.get(key) ?? 0, n._height))
  }

  const cardNodes = rawNodes.map((n): Node => {
    const p = g.node(n.id)
    const rowTop = p.y - (rowMaxHeight.get(Math.round(p.y)) ?? n._height) / 2
    // Verticaal volgt altijd de lane (niveau). Horizontaal: handmatige positie
    // (canvasX) als die is gezet, anders de automatische dagre-positie.
    const src = store.siteNodes.find((s) => s.id === n.id)
    const x = src?.canvasX != null ? src.canvasX : p.x - NODE_WIDTH / 2
    return {
      id: n.id,
      type: n.type,
      data: n.data,
      position: { x, y: rowTop },
      class: '',
    }
  })

  // ---------- Lanes afleiden ----------
  // Elke dagre-rank (gelijke center-y) is één niveau. Oplopende y = dieper niveau.
  const rankKeys = [...rowMaxHeight.keys()].sort((a, b) => a - b)
  lanes = rankKeys.map((key, level): Lane => ({
    level,
    centerY: key,
    top: key - (rowMaxHeight.get(key) ?? 0) / 2,
    height: rowMaxHeight.get(key) ?? 0,
  }))

  if (lanes.length > 0) {
    // Lege reservelane onderaan zodat je één niveau dieper kunt slepen.
    const last = lanes[lanes.length - 1]
    const spareHeight = estimateHeight(1)
    lanes.push({
      level: last.level + 1,
      centerY: last.top + last.height + RANKSEP + spareHeight / 2,
      top: last.top + last.height + RANKSEP,
      height: spareHeight,
    })
  }

  // Horizontale uitstrekking van alle kaarten → breedte van de lane-banden.
  const xs = cardNodes.map((n) => n.position.x)
  const minX = xs.length ? Math.min(...xs) : 0
  const maxRight = xs.length ? Math.max(...cardNodes.map((n) => n.position.x + NODE_WIDTH)) : NODE_WIDTH
  const laneX = minX - LANE_SIDE
  const laneWidth = maxRight - minX + LANE_SIDE * 2

  const laneNodes: Node[] = lanes.map((lane) => ({
    id: `lane-${lane.level}`,
    type: 'lane',
    data: { label: laneLabel(lane.level), level: lane.level, active: false },
    position: { x: laneX, y: lane.top - LANE_PAD },
    style: { width: `${laneWidth}px`, height: `${lane.height + LANE_PAD * 2}px` },
    draggable: false,
    selectable: false,
    connectable: false,
    focusable: false,
    zIndex: -1,
    class: '',
  }))

  // Lanes eerst (achtergrond), daarna de kaarten erbovenop.
  nodes.value = [...laneNodes, ...cardNodes]
  edges.value = rawEdges
}

// Welk niveau hoort bij een gegeven verticale positie? Grenzen liggen op de
// middens tussen opeenvolgende lane-centers.
function levelForY(y: number): number {
  if (lanes.length === 0) return 0
  for (let i = 0; i < lanes.length; i++) {
    const next = lanes[i + 1]
    const upper = next ? (lanes[i].centerY + next.centerY) / 2 : Infinity
    if (y < upper) return lanes[i].level
  }
  return lanes[lanes.length - 1].level
}

function laneForLevel(level: number): Lane | undefined {
  return lanes.find((l) => l.level === level)
}

// "Opnieuw ordenen": handmatige horizontale posities wissen en terug naar de
// automatische dagre-layout.
async function relayout() {
  const manual = store.siteNodes.filter((n) => n.canvasX != null)
  if (manual.length > 0) {
    saving.value = true
    try {
      for (const n of manual) await store.updateNode(props.projectId, n.id, { canvasX: null })
    } finally {
      saving.value = false
    }
  }
  rebuild()
  setTimeout(() => fitView({ padding: 0.2 }), 50)
}

function onPaneReady() {
  fitView({ padding: 0.2 })
}

// Zodra Vue Flow de kaarten echt heeft opgemeten: cache de werkelijke hoogtes
// en herbouw de layout zodat de spacing exact klopt (geen overlap meer).
onNodesInitialized(() => {
  let changed = false
  for (const n of nodes.value) {
    if (n.type !== 'pageCard') continue
    const real = findNode(n.id)?.dimensions?.height
    if (real && Math.abs((heightCache.get(n.id) ?? 0) - real) > 1) {
      heightCache.set(n.id, real)
      changed = true
    }
  }
  if (changed) {
    rebuild()
    nextTick(() => fitView({ padding: 0.2 }))
  }
})

// ---------- Drag-to-reparent ----------

// Alle (klein)kinderen van een node — die mogen nooit de nieuwe parent worden.
function descendantsOf(id: string): Set<string> {
  const out = new Set<string>()
  const stack = [id]
  while (stack.length) {
    const cur = stack.pop() as string
    for (const n of store.siteNodes) {
      if (n.parentId === cur && !out.has(n.id)) {
        out.add(n.id)
        stack.push(n.id)
      }
    }
  }
  return out
}

// Bepaal het doel-niveau (uit de verticale lane) en de bijbehorende parent
// voor een gesleepte node. De parent is de dichtstbijzijnde kaart één niveau
// hoger (op X-afstand) die geen (klein)kind van de gesleepte node is.
interface DropResult { valid: boolean; parentId: string | null; level: number }

function computeDrop(dragged: GraphNode): DropResult {
  const height = dragged.dimensions?.height || 0
  const centerY = dragged.position.y + height / 2
  const level = levelForY(centerY)

  // Bovenste rij → hoofdpagina (geen parent).
  if (level <= 0) return { valid: true, parentId: null, level: 0 }

  const invalid = descendantsOf(dragged.id)
  invalid.add(dragged.id)

  // Kandidaat-parents: kaarten precies één niveau hoger, geen eigen (klein)kind.
  const candidates = store.siteNodes.filter((n) => (n.level ?? 0) === level - 1 && !invalid.has(n.id))
  if (candidates.length === 0) return { valid: false, parentId: null, level }

  const cx = dragged.position.x + NODE_WIDTH / 2
  let best: string | null = null
  let bestDist = Infinity
  for (const c of candidates) {
    const fn = nodes.value.find((x) => x.id === c.id)
    const ccx = fn ? fn.position.x + NODE_WIDTH / 2 : 0
    const d = Math.abs(ccx - cx)
    if (d < bestDist) { bestDist = d; best = c.id }
  }
  return { valid: true, parentId: best, level }
}

// Bepaal sortOrder zodat de node op de juiste plek tussen siblings landt,
// op basis van de horizontale loslaat-positie.
function computeSortOrder(draggedId: string, parentId: string | null, droppedCenterX: number): number {
  const siblings = store.siteNodes
    .filter((n) => n.parentId === parentId && n.id !== draggedId)
    .map((n) => {
      const fn = nodes.value.find((x) => x.id === n.id)
      const centerX = fn ? fn.position.x + NODE_WIDTH / 2 : 0
      return { sortOrder: n.sortOrder, centerX }
    })
    .sort((a, b) => a.centerX - b.centerX)

  const index = siblings.filter((s) => s.centerX < droppedCenterX).length
  const prev = siblings[index - 1]
  const next = siblings[index]
  if (prev && next) return (prev.sortOrder + next.sortOrder) / 2
  if (prev) return prev.sortOrder + 1
  if (next) return next.sortOrder - 1
  return 0
}

// Live: snap verticaal naar de doel-lane en highlight lane + doel-parent.
function clearHighlights() {
  for (const n of nodes.value) {
    if (n.type === 'pageCard') n.class = ''
    else if (n.type === 'lane') n.data = { ...n.data, active: false }
  }
}

onNodeDrag(({ node }) => {
  const drop = computeDrop(node)
  const lane = laneForLevel(drop.level)
  if (lane) node.position.y = lane.top   // houd de kaart in zijn rij
  for (const n of nodes.value) {
    if (n.type === 'pageCard') n.class = n.id === drop.parentId ? 'drop-target' : ''
    else if (n.type === 'lane') n.data = { ...n.data, active: drop.valid && n.id === `lane-${drop.level}` }
  }
})

onNodeDragStop(async ({ node }) => {
  clearHighlights()

  const current = store.siteNodes.find((n) => n.id === node.id)
  if (!current) { rebuild(); return }

  const drop = computeDrop(node)
  // Ongeldige rij (geen kaart om onder te hangen) → terugsnappen.
  if (!drop.valid) { rebuild(); return }

  const newParentId = drop.parentId
  const newCanvasX = Math.round(node.position.x)
  const droppedCenterX = node.position.x + NODE_WIDTH / 2
  const newSortOrder = computeSortOrder(node.id, newParentId, droppedCenterX)

  const hierarchyChanged = newParentId !== current.parentId || newSortOrder !== current.sortOrder
  const xChanged = current.canvasX == null || Math.abs(current.canvasX - newCanvasX) > 0.5

  // Niets veranderd → gewoon terugsnappen naar de nette layout.
  if (!hierarchyChanged && !xChanged) {
    rebuild()
    return
  }

  saving.value = true
  moveMsg.value = ''
  try {
    if (hierarchyChanged) {
      // Niveau/volgorde (en horizontale positie) in één keer opslaan.
      await store.moveNode(props.projectId, node.id, newParentId, newSortOrder, newCanvasX)
      const parentTitle = newParentId ? store.siteNodes.find((n) => n.id === newParentId)?.title : null
      moveMsg.value = parentTitle ? `"${current.title}" verplaatst onder "${parentTitle}".` : `"${current.title}" is nu een hoofdpagina.`
    } else {
      // Alleen horizontaal verschoven → lichte update, geen URL-herberekening.
      await store.updateNode(props.projectId, node.id, { canvasX: newCanvasX })
      moveMsg.value = `Positie van "${current.title}" aangepast.`
    }
    rebuild()
    setTimeout(() => { moveMsg.value = '' }, 4000)
  } catch (e: any) {
    moveMsg.value = ''
    rebuild()
  } finally {
    saving.value = false
  }
})

onMounted(async () => {
  // Blokken voor alle pagina's ophalen (siteNodes zijn al geladen via StructuurModule).
  await store.fetchAllBlocks(props.projectId)
  rebuild()
})

// Herbouw zodra de onderliggende data verandert (import, toevoegen, enz.).
watch(
  () => [store.siteNodes.length, store.allProjectBlocks.length],
  () => rebuild(),
)
</script>

<!-- Globaal (niet scoped): treft de Vue Flow node-wrapper -->
<style>
.vue-flow__node.drop-target {
  outline: 2px solid #2563eb;
  outline-offset: 3px;
  border-radius: 0.6rem;
}
/* Lane-achtergronden mogen pannen/klikken op de canvas niet blokkeren. */
.vue-flow__node-lane {
  pointer-events: none;
  cursor: default;
}
</style>
