<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h3 class="text-lg font-bold text-gray-900">Fase 3 · Figma</h3>
      <p class="text-sm text-gray-500 mt-1">
        Selecteer de pagina's die je wilt exporteren. Je krijgt een lijst met per pagina de
        bijbehorende componenten — klaar om in Figma op te bouwen.
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      <!-- Pagina-selectie -->
      <div class="card p-5">
        <div class="flex items-center justify-between mb-3">
          <span class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Pagina's</span>
          <button class="text-xs text-pienter-600 hover:underline" @click="toggleSelectAll">
            {{ allSelected ? 'Alles deselecteren' : 'Alles selecteren' }}
          </button>
        </div>

        <div v-if="store.flatSortedNodes.length === 0" class="text-sm text-gray-400 py-6 text-center">
          Nog geen pagina's. Werk eerst de structuur uit in Fase 2.
        </div>
        <div v-else class="space-y-0.5 max-h-[60vh] overflow-y-auto">
          <label v-for="node in store.flatSortedNodes" :key="node.id"
            class="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 cursor-pointer text-sm"
            :style="{ paddingLeft: node.level * 14 + 8 + 'px' }">
            <input type="checkbox" class="rounded border-gray-300"
              :checked="selectedIds.includes(node.id)" @change="togglePage(node.id)" />
            <span class="flex-1 truncate text-gray-700">{{ node.title }}</span>
            <span class="text-[10px] text-gray-400">{{ blocksForPage(node.id).length }}b</span>
          </label>
        </div>
      </div>

      <!-- Resultaat -->
      <div class="card p-5">
        <div class="flex items-center justify-between mb-3">
          <span class="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Export ({{ exportPages.length }} pagina's)
          </span>
          <button class="btn-primary btn-sm" :disabled="!exportPages.length" @click="copyExport">
            {{ copied ? '✓ Gekopieerd' : '📋 Kopieer' }}
          </button>
        </div>

        <pre v-if="exportPages.length"
          class="text-xs text-gray-800 whitespace-pre-wrap font-mono leading-relaxed max-h-[60vh] overflow-y-auto bg-gray-50 rounded-lg p-4">{{ exportText }}</pre>
        <p v-else class="text-sm text-gray-400 py-6 text-center">Selecteer minstens één pagina.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useStructuurStore } from '../../stores/structuurStore'
import { useProjectStore } from '../../stores/projectStore'
import type { PageBlock } from '@shared/types'

const props = defineProps<{ projectId: string }>()
const store = useStructuurStore()
const projectStore = useProjectStore()

const selectedIds = ref<string[]>([])
const copied = ref(false)

onMounted(async () => {
  await store.fetchAllBlocks(props.projectId)
  // Standaard: alle pagina's met minstens één blok aanvinken
  const withBlocks = new Set(store.allProjectBlocks.map(b => b.siteNodeId))
  selectedIds.value = store.flatSortedNodes.filter(n => withBlocks.has(n.id)).map(n => n.id)
})

function blocksForPage(nodeId: string): PageBlock[] {
  return store.allProjectBlocks
    .filter(b => b.siteNodeId === nodeId)
    .sort((a, b) => a.sortOrder - b.sortOrder)
}

function togglePage(id: string) {
  const i = selectedIds.value.indexOf(id)
  if (i >= 0) selectedIds.value.splice(i, 1)
  else selectedIds.value.push(id)
}

const allSelected = computed(() =>
  store.flatSortedNodes.length > 0 && selectedIds.value.length === store.flatSortedNodes.length
)

function toggleSelectAll() {
  selectedIds.value = allSelected.value ? [] : store.flatSortedNodes.map(n => n.id)
}

// Geselecteerde pagina's in boom-volgorde
const exportPages = computed(() =>
  store.flatSortedNodes
    .filter(n => selectedIds.value.includes(n.id))
    .map(n => ({ node: n, blocks: blocksForPage(n.id) }))
)

// Component-label op "component + sub-component" niveau (componentPattern bevat al "X / Sub")
function componentLabel(b: PageBlock): string {
  return b.componentPattern || '— (geen component gekozen)'
}

const exportText = computed(() => {
  const lines: string[] = []
  const title = projectStore.currentProject?.name
  lines.push(title ? `Pagina-export — ${title}` : 'Pagina-export')
  lines.push(`${exportPages.value.length} pagina's`)
  lines.push('')
  for (const p of exportPages.value) {
    lines.push(`## ${p.node.title}  (${p.node.fullUrl})`)
    if (p.blocks.length === 0) {
      lines.push('  (geen blokken)')
    } else {
      p.blocks.forEach((b, i) => lines.push(`  ${i + 1}. ${componentLabel(b)}`))
    }
    lines.push('')
  }
  return lines.join('\n').trim()
})

async function copyExport() {
  try {
    await navigator.clipboard.writeText(exportText.value)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch {
    alert('Kopiëren mislukt — selecteer de tekst handmatig.')
  }
}
</script>
