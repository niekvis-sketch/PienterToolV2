<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-lg font-bold text-gray-900">Fase 3 · Pagina-indeling per pagina</h3>
        <p class="text-sm text-gray-500 mt-1">Klik op een pagina om de blok-indeling uit te werken.</p>
      </div>
    </div>

    <!-- Page selector (sidebar + detail) -->
    <div class="flex gap-6">
      <!-- Left: page list -->
      <div class="w-72 shrink-0 space-y-1">
        <div class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Pagina's</div>
        <div v-for="node in store.flatSortedNodes" :key="node.id"
          class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors"
          :class="selectedNodeId === node.id ? 'bg-pienter-50 border border-pienter-200 text-pienter-900 font-medium' : 'hover:bg-gray-50 text-gray-700'"
          :style="{ paddingLeft: node.level * 16 + 12 + 'px' }"
          @click="selectPage(node.id)"
        >
          <span v-if="node.level > 0" class="text-gray-300 text-xs">└</span>
          <span class="flex-1 truncate">{{ node.title }}</span>
          <span class="text-[10px] text-gray-400">{{ blockCountForNode(node.id) }}b</span>
        </div>
      </div>

      <!-- Right: page detail -->
      <div class="flex-1 min-w-0">
        <div v-if="!selectedNode" class="empty-state card p-12">
          <div class="text-4xl mb-4">👈</div>
          <h3 class="text-lg font-semibold text-gray-700">Selecteer een pagina</h3>
          <p>Klik links op een pagina om de blok-indeling te bewerken.</p>
        </div>

        <template v-else>
          <!-- Page header info -->
          <div class="card p-5 mb-4">
            <div class="flex items-center gap-3 mb-3">
              <h4 class="text-lg font-bold text-gray-900">{{ selectedNode.title }}</h4>
              <span class="text-xs text-pienter-600 font-mono">{{ selectedNode.fullUrl }}</span>
              <div class="ml-auto">
                <button
                  class="btn-sm text-xs flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-colors"
                  :class="showPreview ? 'bg-pienter-600 text-white hover:bg-pienter-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
                  @click="showPreview = !showPreview"
                >
                  👁️ {{ showPreview ? 'Verberg preview' : 'Visuele preview' }}
                </button>
              </div>
            </div>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div><span class="text-gray-500">Doelgroep:</span> <span class="font-medium">{{ selectedNode.targetAudience || '—' }}</span></div>
              <div><span class="text-gray-500">Doel:</span> <span class="font-medium">{{ selectedNode.goal || '—' }}</span></div>
              <div><span class="text-gray-500">Focus:</span> <span class="font-medium">{{ selectedNode.focusTopic || '—' }}</span></div>
              <div><span class="text-gray-500">Type:</span> <span class="font-medium">{{ selectedNode.type }}</span></div>
            </div>
            <!-- Open vragen uit fase 1 -->
            <div v-if="relatedQuestions.length > 0" class="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
              <h5 class="text-xs font-semibold text-amber-800 mb-1">📌 Relevante klantantwoorden / inzichten uit Fase 1</h5>
              <div v-for="q in relatedQuestions" :key="q.id" class="text-xs text-amber-700 mb-1">
                <span class="font-medium">{{ q.status === 'answered' ? '✅' : '❓' }}</span> {{ q.question }}
                <span v-if="q.answer" class="text-green-700"> → {{ q.answer }}</span>
              </div>
            </div>
          </div>

          <!-- Visual page preview -->
          <div v-if="showPreview" class="card p-5 mb-4">
            <div class="flex items-center gap-2 mb-4">
              <h4 class="text-sm font-semibold text-gray-700">👁️ Visuele pagina preview</h4>
              <span class="text-[10px] text-gray-400">Gebaseerd op blok-indeling en component afbeeldingen</span>
            </div>
            <PageVisualPreview
              :blocks="sortedBlocks"
              :components="projectStore.componenten"
              :page-url="selectedNode.fullUrl"
            />
          </div>

          <!-- Block list -->
          <div class="space-y-3 mb-4">
            <div v-if="store.pageBlocks.length === 0" class="card p-8 text-center">
              <div class="text-3xl mb-3">🧱</div>
              <p class="text-sm text-gray-500 mb-3">Nog geen blokken. Voeg blokken toe om de pagina-indeling te bepalen.</p>
              <button class="btn-primary btn-sm" @click="addBlock">+ Eerste blok toevoegen</button>
            </div>

            <div v-for="(block, idx) in sortedBlocks" :key="block.id" class="card overflow-hidden">
              <div class="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-100">
                <!-- Drag handle indicator -->
                <span class="text-gray-300 cursor-grab">⠿</span>
                <!-- Sort buttons -->
                <div class="flex flex-col gap-0.5">
                  <button class="text-gray-300 hover:text-gray-600 text-xs leading-none" :disabled="idx === 0" @click="moveBlockUp(block.id)">▲</button>
                  <button class="text-gray-300 hover:text-gray-600 text-xs leading-none" :disabled="idx === sortedBlocks.length - 1" @click="moveBlockDown(block.id)">▼</button>
                </div>
                <!-- Block type icon -->
                <span class="text-lg">{{ blockTypeIcon(block.type) }}</span>
                <!-- Editable name -->
                <input v-if="editingBlockId === block.id" v-model="editBlockName" class="input text-sm font-semibold flex-1"
                  @blur="saveBlockName(block)" @keyup.enter="saveBlockName(block)" />
                <span v-else class="flex-1 font-semibold text-gray-900 text-sm cursor-pointer" @click="startEditBlockName(block)">
                  {{ block.name }}
                </span>
                <!-- Type badge -->
                <span class="text-[10px] bg-gray-200 text-gray-600 rounded-full px-2 py-0.5">{{ block.type }}</span>
                <span v-if="block.isReusable" class="text-[10px] bg-purple-100 text-purple-700 rounded-full px-2 py-0.5">♻️ herbruikbaar</span>
                <!-- Actions -->
                <button class="text-gray-400 hover:text-pienter-600 text-xs" @click="toggleBlockDetail(block.id)">
                  {{ expandedBlockId === block.id ? '▲ Inklappen' : '▼ Details' }}
                </button>
                <button class="text-gray-300 hover:text-red-500 text-xs" @click="removeBlock(block.id)">🗑</button>
              </div>

              <!-- Block details (expanded) -->
              <div v-if="expandedBlockId === block.id" class="p-4 space-y-3">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-xs font-medium text-gray-600 mb-1">Type blok</label>
                    <select v-model="block.type" class="select text-sm" @change="updateBlock(block)">
                      <option v-for="bt in blockTypes" :key="bt" :value="bt">{{ bt }}</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-600 mb-1">Doel van het blok</label>
                    <input v-model="block.goal" class="input text-sm" @blur="updateBlock(block)" placeholder="Wat moet dit blok bereiken?" />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-600 mb-1">Voor welke gebruiker / vraag</label>
                    <input v-model="block.targetUser" class="input text-sm" @blur="updateBlock(block)" placeholder="bijv. potentiële klant die vergelijkt" />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-600 mb-1">Component (uit library)</label>
                    <select v-model="block.componentPattern" class="select text-sm" @change="updateBlock(block)">
                      <option value="">— Kies een component —</option>
                      <optgroup v-for="grp in componentsByCategory" :key="grp.key" :label="grp.label">
                        <option v-for="opt in grp.items" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                      </optgroup>
                      <!-- Fallback voor een eventuele oude vrije-tekst waarde -->
                      <option v-if="isLegacyPattern(block.componentPattern)" :value="block.componentPattern">
                        {{ block.componentPattern }} (oud)
                      </option>
                    </select>
                    <p v-if="projectStore.componenten.length === 0" class="text-[10px] text-amber-600 mt-1">
                      Nog geen componenten geladen — laad de standaardlibrary in de Componenten-tab.
                    </p>
                  </div>
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-600 mb-1">Welke content moet hierin komen</label>
                  <textarea v-model="block.contentDescription" class="textarea text-sm" rows="3" @blur="updateBlock(block)" placeholder="Beschrijf de verwachte inhoud van dit blok..." />
                </div>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label class="block text-xs font-medium text-gray-600 mb-1">📝 Notities content</label>
                    <textarea v-model="block.notesContent" class="textarea text-xs" rows="2" @blur="updateBlock(block)" />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-600 mb-1">🔍 Notities SEO</label>
                    <textarea v-model="block.notesSeo" class="textarea text-xs" rows="2" @blur="updateBlock(block)" />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-600 mb-1">🎨 Notities design</label>
                    <textarea v-model="block.notesDesign" class="textarea text-xs" rows="2" @blur="updateBlock(block)" />
                  </div>
                </div>
                <div class="flex items-center gap-4">
                  <label class="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" v-model="block.isReusable" @change="updateBlock(block)" class="rounded border-gray-300" />
                    Herbruikbaar blok (pagina-overstijgend)
                  </label>
                </div>
                <!-- Koppeling fase 1 vragen -->
                <div v-if="store.clientQuestions.length > 0" class="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <h5 class="text-xs font-semibold text-blue-800 mb-2">🔗 Koppel aan Fase 1 vragen</h5>
                  <div class="space-y-1 max-h-32 overflow-y-auto">
                    <label v-for="q in answeredAndInsightQuestions" :key="q.id" class="flex items-center gap-2 text-xs cursor-pointer">
                      <input type="checkbox" :checked="block.answersQuestionIds.includes(q.id)"
                        @change="toggleQuestionLink(block, q.id)" class="rounded border-gray-300" />
                      <span>{{ q.question.substring(0, 80) }}</span>
                      <span class="text-gray-400">({{ q.status }})</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Add block buttons -->
          <div class="flex flex-wrap gap-2 mb-6">
            <button class="btn-primary btn-sm" @click="addBlock">+ Blok toevoegen</button>
            <!-- Quick-add popular block types -->
            <button v-for="bt in quickBlockTypes" :key="bt.type" class="btn-secondary btn-sm text-xs" @click="addBlockOfType(bt.type, bt.name)">
              {{ bt.icon }} {{ bt.name }}
            </button>
          </div>

          <!-- Reusable blocks from other pages -->
          <div v-if="reusableBlocks.length > 0" class="card p-4 mb-4">
            <h4 class="text-sm font-semibold text-gray-700 mb-2">♻️ Herbruikbare blokken (uit andere pagina's)</h4>
            <div class="flex flex-wrap gap-2">
              <button v-for="rb in reusableBlocks" :key="rb.id" class="btn-secondary btn-sm text-xs" @click="addReusableBlock(rb)">
                {{ blockTypeIcon(rb.type) }} {{ rb.name }}
              </button>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, reactive, onMounted } from 'vue'
import { useStructuurStore } from '../../stores/structuurStore'
import { useProjectStore } from '../../stores/projectStore'
import PageVisualPreview from './PageVisualPreview.vue'
import type { PageBlock, BlockType, ComponentCategory } from '@shared/types'

const props = defineProps<{ projectId: string }>()
const store = useStructuurStore()
const projectStore = useProjectStore()
const showPreview = ref(false)

// Load all blocks on mount for sidebar counts
onMounted(async () => {
  await store.fetchAllBlocks(props.projectId)
  await projectStore.fetchComponenten(props.projectId)
})

const selectedNodeId = ref<string | null>(null)
const expandedBlockId = ref<string | null>(null)
const editingBlockId = ref<string | null>(null)
const editBlockName = ref('')

const blockTypes: BlockType[] = ['hero', 'introductie', 'usp', 'dienst-uitleg', 'stappenplan', 'cases', 'reviews', 'faq', 'cta', 'contact', 'formulier', 'afbeelding-tekst', 'branche-overzicht', 'gerelateerde-paginas', 'video', 'prijzen', 'team', 'statistieken', 'custom']

const quickBlockTypes = [
  { type: 'hero' as BlockType, name: 'Hero', icon: '🖼️' },
  { type: 'introductie' as BlockType, name: 'Introductie', icon: '📝' },
  { type: 'usp' as BlockType, name: 'USP\'s', icon: '⭐' },
  { type: 'cta' as BlockType, name: 'Call to Action', icon: '🎯' },
  { type: 'faq' as BlockType, name: 'FAQ', icon: '❓' },
  { type: 'reviews' as BlockType, name: 'Reviews', icon: '⭐' },
  { type: 'contact' as BlockType, name: 'Contact', icon: '📞' },
]

// Componenten uit de library, gegroepeerd per categorie voor de blok→component select.
// Sub-componenten verschijnen ingesprongen als "Component / Sub".
const componentsByCategory = computed(() => {
  const cats: { key: ComponentCategory; label: string }[] = [
    { key: 'broodblok', label: '🍞 Broodblokken' },
    { key: 'flexblok', label: '🔧 Flexibele Content' },
    { key: 'posttype', label: '📋 Posttypes' },
  ]
  return cats
    .map(c => ({
      ...c,
      items: projectStore.componenten
        .filter(comp => comp.category === c.key)
        .flatMap(comp => [
          { value: comp.name, label: comp.name },
          ...(comp.subComponents || []).map(sc => ({
            value: `${comp.name} / ${sc.name}`,
            label: `   ${comp.name} / ${sc.name}`,
          })),
        ]),
    }))
    .filter(c => c.items.length > 0)
})

const componentOptionValues = computed(() => {
  const set = new Set<string>()
  for (const grp of componentsByCategory.value) for (const it of grp.items) set.add(it.value)
  return set
})

// True als de huidige waarde niet (meer) in de library voorkomt — bijv. oude vrije tekst.
function isLegacyPattern(val: string): boolean {
  return !!val && !componentOptionValues.value.has(val)
}

const selectedNode = computed(() => store.siteNodes.find(n => n.id === selectedNodeId.value) || null)
const sortedBlocks = computed(() => [...store.pageBlocks].sort((a, b) => a.sortOrder - b.sortOrder))

const answeredAndInsightQuestions = computed(() =>
  store.clientQuestions.filter(q => q.status === 'answered' || q.status === 'insight')
)

const relatedQuestions = computed(() => {
  if (!selectedNode.value) return []
  return store.clientQuestions.filter(q =>
    selectedNode.value!.openQuestionIds?.includes(q.id) ||
    selectedNode.value!.relatedUserStoryIds?.some(sid =>
      q.userStoryId === sid
    )
  )
})

const reusableBlocks = computed(() => {
  // Get reusable blocks from other pages
  return store.pageBlocks.filter(b => b.isReusable && b.siteNodeId !== selectedNodeId.value)
})

function blockCountForNode(nodeId: string): number {
  return store.allProjectBlocks.filter(b => b.siteNodeId === nodeId).length
}

async function selectPage(nodeId: string) {
  selectedNodeId.value = nodeId
  store.selectedNodeId = nodeId
  await store.fetchBlocks(props.projectId, nodeId)
}

async function addBlock() {
  if (!selectedNodeId.value) return
  const b = await store.createBlock(props.projectId, selectedNodeId.value, {
    name: 'Nieuw blok', type: 'custom'
  })
  expandedBlockId.value = b.id
  store.allProjectBlocks.push(b)
}

async function addBlockOfType(type: BlockType, name: string) {
  if (!selectedNodeId.value) return
  const b = await store.createBlock(props.projectId, selectedNodeId.value, { name, type })
  expandedBlockId.value = b.id
  store.allProjectBlocks.push(b)
}

async function addReusableBlock(original: PageBlock) {
  if (!selectedNodeId.value) return
  const b = await store.createBlock(props.projectId, selectedNodeId.value, {
    name: original.name, type: original.type, goal: original.goal,
    contentDescription: original.contentDescription, componentPattern: original.componentPattern,
    isReusable: true, reusableBlockId: original.id,
    notesContent: original.notesContent, notesSeo: original.notesSeo, notesDesign: original.notesDesign
  })
  store.allProjectBlocks.push(b)
}

async function removeBlock(blockId: string) {
  if (!selectedNodeId.value || !confirm('Blok verwijderen?')) return
  await store.deleteBlock(props.projectId, selectedNodeId.value, blockId)
  store.allProjectBlocks = store.allProjectBlocks.filter(b => b.id !== blockId)
}

async function updateBlock(block: PageBlock) {
  if (!selectedNodeId.value) return
  await store.updateBlock(props.projectId, selectedNodeId.value, block.id, block)
}

function toggleBlockDetail(blockId: string) {
  expandedBlockId.value = expandedBlockId.value === blockId ? null : blockId
}

function startEditBlockName(block: PageBlock) {
  editingBlockId.value = block.id
  editBlockName.value = block.name
}

async function saveBlockName(block: PageBlock) {
  if (editBlockName.value !== block.name) {
    block.name = editBlockName.value
    await updateBlock(block)
  }
  editingBlockId.value = null
}

async function moveBlockUp(blockId: string) {
  if (!selectedNodeId.value) return
  const blocks = sortedBlocks.value
  const idx = blocks.findIndex(b => b.id === blockId)
  if (idx <= 0) return
  const ids = blocks.map(b => b.id)
  ;[ids[idx - 1], ids[idx]] = [ids[idx], ids[idx - 1]]
  await store.reorderBlocks(props.projectId, selectedNodeId.value, ids)
  await store.fetchBlocks(props.projectId, selectedNodeId.value)
}

async function moveBlockDown(blockId: string) {
  if (!selectedNodeId.value) return
  const blocks = sortedBlocks.value
  const idx = blocks.findIndex(b => b.id === blockId)
  if (idx < 0 || idx >= blocks.length - 1) return
  const ids = blocks.map(b => b.id)
  ;[ids[idx], ids[idx + 1]] = [ids[idx + 1], ids[idx]]
  await store.reorderBlocks(props.projectId, selectedNodeId.value, ids)
  await store.fetchBlocks(props.projectId, selectedNodeId.value)
}

function toggleQuestionLink(block: PageBlock, questionId: string) {
  const idx = block.answersQuestionIds.indexOf(questionId)
  if (idx >= 0) block.answersQuestionIds.splice(idx, 1)
  else block.answersQuestionIds.push(questionId)
  updateBlock(block)
}

function blockTypeIcon(type: BlockType) {
  const icons: Record<BlockType, string> = {
    hero: '🖼️', introductie: '📝', usp: '⭐', 'dienst-uitleg': '🔧',
    stappenplan: '📋', cases: '💼', reviews: '⭐', faq: '❓', cta: '🎯',
    contact: '📞', formulier: '📄', 'afbeelding-tekst': '🖼️',
    'branche-overzicht': '🏢', 'gerelateerde-paginas': '🔗', video: '🎬',
    prijzen: '💰', team: '👥', statistieken: '📊', custom: '🧩'
  }
  return icons[type] || '🧩'
}
</script>
