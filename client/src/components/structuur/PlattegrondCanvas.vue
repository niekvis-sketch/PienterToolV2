<template>
  <div class="space-y-3">
    <!-- Toolbar -->
    <div class="flex items-center justify-between gap-3">
      <p class="text-xs text-gray-500">
        {{ nodes.length }} pagina's · {{ edges.length }} verbindingen — sleep een kaartje <strong>op een ander</strong> om het daaronder te hangen, of naar een <strong>lege plek</strong> om het hoofdpagina te maken. Loslaten tussen siblings bepaalt de volgorde.
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
import { ref, markRaw, watch, onMounted, nextTick } from 'vue'
import { VueFlow, useVueFlow, type Node, type Edge, type GraphNode } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import dagre from '@dagrejs/dagre'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import '@vue-flow/controls/dist/style.css'
import { useStructuurStore } from '../../stores/structuurStore'
import PageCardNode from './PageCardNode.vue'

const props = defineProps<{ projectId: string }>()
const store = useStructuurStore()

const { fitView, getIntersectingNodes, onNodeDrag, onNodeDragStop, onNodesInitialized, findNode } = useVueFlow()

// `as any`: Vue Flow's NodeComponent-type matcht een SFC met defineProps niet
// schoon — bekende typing-frictie, runtime werkt prima.
const nodeTypes = { pageCard: markRaw(PageCardNode) as any }

const nodes = ref<Node[]>([])
const edges = ref<Edge[]>([])
const saving = ref(false)
const moveMsg = ref('')

const NODE_WIDTH = 240
const HEADER_H = 48
const BLOCK_H = 30
const PADDING_H = 16

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
  g.setGraph({ rankdir: 'TB', nodesep: 40, ranksep: 90 })
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

  nodes.value = rawNodes.map((n): Node => {
    const p = g.node(n.id)
    const rowTop = p.y - (rowMaxHeight.get(Math.round(p.y)) ?? n._height) / 2
    return {
      id: n.id,
      type: n.type,
      data: n.data,
      position: { x: p.x - NODE_WIDTH / 2, y: rowTop },
      class: '',
    }
  })
  edges.value = rawEdges
}

function relayout() {
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

// Bepaal de geldige drop-parent voor een gesleepte node: het overlappende
// kaartje met het dichtstbijzijnde middelpunt dat geen (klein)kind is.
function resolveDropParent(dragged: GraphNode): string | null {
  const invalid = descendantsOf(dragged.id)
  invalid.add(dragged.id)
  const hits = getIntersectingNodes(dragged).filter((n) => !invalid.has(n.id))
  if (hits.length === 0) return null

  const cx = dragged.position.x + NODE_WIDTH / 2
  const cy = dragged.position.y + (dragged.dimensions?.height || 0) / 2
  let best: GraphNode | null = null
  let bestDist = Infinity
  for (const n of hits) {
    const nx = n.position.x + (n.dimensions?.width || NODE_WIDTH) / 2
    const ny = n.position.y + (n.dimensions?.height || 0) / 2
    const d = (nx - cx) ** 2 + (ny - cy) ** 2
    if (d < bestDist) { bestDist = d; best = n }
  }
  return best ? best.id : null
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

// Live highlight van het kaartje waar je bovenop hangt.
onNodeDrag(({ node }) => {
  const targetId = resolveDropParent(node)
  for (const n of nodes.value) n.class = n.id === targetId ? 'drop-target' : ''
})

onNodeDragStop(async ({ node }) => {
  for (const n of nodes.value) n.class = ''

  const current = store.siteNodes.find((n) => n.id === node.id)
  if (!current) { rebuild(); return }

  const newParentId = resolveDropParent(node)
  const droppedCenterX = node.position.x + NODE_WIDTH / 2
  const newSortOrder = computeSortOrder(node.id, newParentId, droppedCenterX)

  // Niets veranderd → gewoon terugsnappen naar de nette layout.
  if (newParentId === current.parentId && newSortOrder === current.sortOrder) {
    rebuild()
    return
  }

  saving.value = true
  moveMsg.value = ''
  try {
    await store.moveNode(props.projectId, node.id, newParentId, newSortOrder)
    rebuild()
    const parentTitle = newParentId ? store.siteNodes.find((n) => n.id === newParentId)?.title : null
    moveMsg.value = parentTitle ? `"${current.title}" verplaatst onder "${parentTitle}".` : `"${current.title}" is nu een hoofdpagina.`
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
</style>
