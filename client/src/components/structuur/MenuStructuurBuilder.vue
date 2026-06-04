<template>
  <div class="grid grid-cols-[300px_1fr] gap-6 items-start">
    <!-- ============ LINKERPANEEL — PAGINA'S ============ -->
    <div class="space-y-4">
      <div class="card p-4">
        <h4 class="mb-3 font-semibold text-sm text-gray-900">Pagina's</h4>

        <!-- Filter-tabs -->
        <div class="mb-3 flex items-center gap-1 rounded-lg bg-gray-100 p-1">
          <button
            v-for="f in pageFilters" :key="f.key"
            class="flex-1 rounded-md px-2 py-1 text-xs font-medium transition-colors"
            :class="pageFilter === f.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'"
            @click="pageFilter = f.key"
          >{{ f.label }}</button>
        </div>

        <!-- Zoek -->
        <div class="relative mb-3">
          <span class="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input v-model="pageSearch" class="input pl-8 text-sm" placeholder="Zoek pagina..." />
        </div>

        <!-- Checkbox-lijst -->
        <div class="max-h-72 space-y-1 overflow-y-auto pr-1">
          <p v-if="visiblePages.length === 0" class="py-4 text-center text-xs text-gray-400">Geen pagina's gevonden.</p>
          <label
            v-for="page in visiblePages" :key="page.id"
            class="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm"
            :class="isInMenu(page.id) ? 'cursor-not-allowed text-gray-400' : 'cursor-pointer hover:bg-gray-50 text-gray-700'"
          >
            <input
              type="checkbox"
              class="rounded border-gray-300 text-pienter-600 focus:ring-pienter-500"
              :disabled="isInMenu(page.id)"
              :checked="selected.has(page.id)"
              @change="toggleSelected(page.id)"
            />
            <span class="flex-1 truncate" :class="{ 'line-through': isInMenu(page.id) }">{{ page.title }}</span>
            <span v-if="isInMenu(page.id)" class="shrink-0 text-[10px] text-gray-400">in menu</span>
          </label>
        </div>

        <!-- Pagina toevoegen -->
        <button class="mt-3 w-full text-left text-xs font-medium text-pienter-600 hover:underline" @click="addPage">
          + Pagina toevoegen
        </button>

        <!-- Aan menu toevoegen -->
        <button
          class="btn-primary btn-sm mt-3 w-full"
          :disabled="selected.size === 0"
          @click="addSelectedToMenu"
        >
          Aan menu toevoegen ({{ selected.size }})
        </button>
      </div>

      <!-- Presets (stub) -->
      <div class="card p-4">
        <h4 class="mb-2 font-semibold text-sm text-gray-900">Presets</h4>
        <p class="text-xs text-gray-400">Nog geen presets opgeslagen.</p>
      </div>
    </div>

    <!-- ============ RECHTERPANEEL — MENU-STRUCTUUR ============ -->
    <div class="space-y-3">
      <div class="card p-4" @dragover.prevent @drop.prevent="onContainerDrop">
        <h4 class="mb-3 font-semibold text-sm text-gray-900">Menu-structuur</h4>

        <!-- Empty state -->
        <div v-if="flatMenu.length === 0" class="empty-state py-12">
          <div class="mb-3 text-4xl">📋</div>
          <p class="text-sm font-medium text-gray-600">Nog geen menu-items</p>
          <p class="text-xs text-gray-400">Vink links pagina's aan en klik op "Aan menu toevoegen".</p>
        </div>

        <!-- Menu-lijst -->
        <div v-else ref="listEl" class="relative">
          <template v-for="(item, i) in flatMenu" :key="item.id">
            <!-- Drop-indicator vóór deze rij -->
            <div
              v-if="dropIndicator && dropIndicator.pos === i"
              class="my-0.5 h-0.5 rounded bg-pienter-500"
              :style="{ marginLeft: dropIndicator.level * 24 + 'px' }"
            />
            <MenuRow
              :item="item"
              :page="pageOf(item.siteNodeId)"
              :is-dragging="draggedSet.has(item.id)"
              @remove="store.removeMenuItem(item.id)"
              @toggle="store.toggleMenuItemExpanded(item.id)"
              @update-label="(v) => store.updateMenuItem(item.id, { customLabel: v || undefined })"
              @dragstart="onRowDragStart(item.id)"
              @dragend="onDragEnd"
              @dragover="(e) => onRowDragOver(e, i)"
              @drop="applyDrop"
            />
          </template>
          <!-- Drop-indicator aan het einde -->
          <div
            v-if="dropIndicator && dropIndicator.pos === flatMenu.length"
            class="my-0.5 h-0.5 rounded bg-pienter-500"
            :style="{ marginLeft: dropIndicator.level * 24 + 'px' }"
          />
        </div>
      </div>

      <!-- Preset opslaan (stub) -->
      <div v-if="flatMenu.length > 0" class="flex justify-end">
        <button class="btn-secondary btn-sm" :title="presetHint" @click="savePreset">
          Menu als preset opslaan
        </button>
      </div>
      <p v-if="presetMsg" class="text-right text-xs text-gray-400">{{ presetMsg }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useStructuurStore } from '../../stores/structuurStore'
import type { SiteNode } from '@shared/types'
import { MAX_LEVEL, type FlatMenuItem } from './menuTypes'
import MenuRow from './MenuRow.vue'

const props = defineProps<{ projectId: string }>()
const store = useStructuurStore()

// ---------- Linkerpaneel ----------
const pageFilters = [
  { key: 'recent' as const, label: 'Meest recent' },
  { key: 'all' as const, label: 'Alles bekijken' },
]
const pageFilter = ref<'recent' | 'all'>('recent')
const pageSearch = ref('')
const selected = ref<Set<string>>(new Set())

const menuNodeIds = computed(() => new Set(store.menuItems.map(m => m.siteNodeId)))
function isInMenu(siteNodeId: string) {
  return menuNodeIds.value.has(siteNodeId)
}

const visiblePages = computed(() => {
  const q = pageSearch.value.trim().toLowerCase()
  let pages = store.siteNodes.filter(n => {
    if (!q) return true
    return n.title.toLowerCase().includes(q) || n.slug.toLowerCase().includes(q)
  })
  if (pageFilter.value === 'recent') {
    pages = [...pages]
      .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''))
      .slice(0, 8)
  } else {
    pages = [...pages].sort((a, b) => a.title.localeCompare(b.title, 'nl'))
  }
  return pages
})

function toggleSelected(id: string) {
  const next = new Set(selected.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  selected.value = next
}

function addSelectedToMenu() {
  for (const id of selected.value) {
    if (!isInMenu(id)) store.addMenuItem(id, null)
  }
  selected.value = new Set()
}

async function addPage() {
  const name = window.prompt('Naam van de nieuwe pagina')
  if (!name || !name.trim()) return
  const title = name.trim()
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  await store.createNode(props.projectId, { title, slug })
}

// ---------- Rechterpaneel: boom-opbouw ----------
const pageMap = computed(() => {
  const m = new Map<string, SiteNode>()
  for (const n of store.siteNodes) m.set(n.id, n)
  return m
})
function pageOf(siteNodeId: string) {
  return pageMap.value.get(siteNodeId)
}

// Platte lijst → hiërarchie → platte lijst met berekend `level`.
const flatMenu = computed<FlatMenuItem[]>(() => {
  const byParent = new Map<string | null, typeof store.menuItems>()
  for (const m of store.menuItems) {
    const arr = byParent.get(m.parentId) || []
    arr.push(m)
    byParent.set(m.parentId, arr)
  }
  for (const arr of byParent.values()) arr.sort((a, b) => a.sortOrder - b.sortOrder)

  const result: FlatMenuItem[] = []
  function walk(parentId: string | null, level: number) {
    for (const m of byParent.get(parentId) || []) {
      result.push({ ...m, level })
      walk(m.id, level + 1)
    }
  }
  walk(null, 0)
  return result
})

// ---------- Drag & drop ----------
const draggingId = ref<string | null>(null)
const dropIndicator = ref<{ pos: number; level: number } | null>(null)
const listEl = ref<HTMLElement | null>(null)

// Id's van het gesleepte item + zijn volledige subtree (mag niet op zichzelf droppen).
const draggedSet = computed<Set<string>>(() => {
  if (!draggingId.value) return new Set()
  const ids = new Set<string>([draggingId.value])
  let changed = true
  while (changed) {
    changed = false
    for (const m of store.menuItems) {
      if (m.parentId && ids.has(m.parentId) && !ids.has(m.id)) {
        ids.add(m.id)
        changed = true
      }
    }
  }
  return ids
})

function onRowDragStart(id: string) {
  draggingId.value = id
}

function onDragEnd() {
  draggingId.value = null
  dropIndicator.value = null
}

function onRowDragOver(event: DragEvent, renderIndex: number) {
  if (!draggingId.value) return
  const row = flatMenu.value[renderIndex]
  // Niet over de gesleepte subtree zelf hoveren.
  if (draggedSet.value.has(row.id)) return

  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  const afterHalf = event.clientY - rect.top > rect.height / 2
  const pos = afterHalf ? renderIndex + 1 : renderIndex

  // Voorafgaand zichtbaar (niet-gesleept) item bepaalt het max inspringniveau.
  let preceding: FlatMenuItem | null = null
  for (let i = pos - 1; i >= 0; i--) {
    if (!draggedSet.value.has(flatMenu.value[i].id)) { preceding = flatMenu.value[i]; break }
  }

  // Horizontale muispositie → gewenst niveau.
  const baseLeft = listEl.value?.getBoundingClientRect().left ?? rect.left
  let level = Math.round((event.clientX - baseLeft) / 24)
  const maxLevel = preceding ? Math.min(MAX_LEVEL, preceding.level + 1) : 0
  level = Math.max(0, Math.min(level, maxLevel))

  dropIndicator.value = { pos, level }
}

function onContainerDrop() {
  applyDrop()
}

function applyDrop() {
  const ind = dropIndicator.value
  const dragId = draggingId.value
  onDragEnd()
  if (!ind || !dragId) return

  // Voorafgaand zichtbaar (niet-gesleept) item op de drop-positie.
  let preceding: FlatMenuItem | null = null
  for (let i = ind.pos - 1; i >= 0; i--) {
    if (!draggedSet.value.has(flatMenu.value[i].id)) { preceding = flatMenu.value[i]; break }
  }

  const { parentId, index } = resolveTarget(preceding, ind.level)
  store.moveMenuItem(dragId, parentId, index)
}

// {preceding, level} → concrete parentId + positie tussen siblings.
function resolveTarget(preceding: FlatMenuItem | null, level: number): { parentId: string | null; index: number } {
  let parentId: string | null
  if (!preceding) {
    parentId = null
  } else if (level > preceding.level) {
    parentId = preceding.id            // subitem worden van het voorgaande item
  } else if (level === preceding.level) {
    parentId = preceding.parentId      // sibling van het voorgaande item
  } else {
    // Uitspringen: zoek de voorouder van `preceding` op het gewenste niveau.
    let cur: FlatMenuItem | undefined = preceding
    while (cur && cur.level > level) {
      cur = flatMenu.value.find(f => f.id === cur!.parentId)
    }
    parentId = cur ? cur.parentId : null
  }

  // Positie = aantal (niet-gesleepte) siblings van `parentId` vóór de drop-positie.
  const insertPos = preceding ? flatMenu.value.indexOf(preceding) + 1 : 0
  let index = 0
  for (let i = 0; i < insertPos; i++) {
    const f = flatMenu.value[i]
    if (!draggedSet.value.has(f.id) && f.parentId === parentId) index++
  }
  return { parentId, index }
}

// ---------- Preset (stub) ----------
const presetHint = 'Presets komen binnenkort'
const presetMsg = ref('')
function savePreset() {
  presetMsg.value = 'Presets opslaan komt binnenkort.'
  setTimeout(() => { presetMsg.value = '' }, 3000)
}
</script>
