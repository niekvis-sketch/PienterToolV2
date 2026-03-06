<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-lg font-bold text-gray-900">Fase 2 · Websitestructuur & Navigatie</h3>
        <p class="text-sm text-gray-500 mt-1">Bouw de sitestructuur visueel op. Kopieer de klantvragen naar ChatGPT en importeer de gegenereerde structuur inclusief pagina-indeling.</p>
      </div>
      <div class="flex gap-2">
        <button class="btn-secondary btn-sm" @click="copyVragenToClipboard">📋 Kopieer klantvragen</button>
        <button class="btn-secondary btn-sm" @click="showImport = !showImport">📥 Importeren</button>
        <button class="btn-secondary btn-sm" @click="fetchWarnings">⚠️ Controleer ({{ store.warnings.length }})</button>
        <button class="btn-primary btn-sm" @click="addRootNode">+ Pagina toevoegen</button>
      </div>
    </div>

    <!-- Copy success notification -->
    <div v-if="copySuccess" class="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2 text-sm text-green-700">
      <span>✅</span>
      <span>{{ copySuccess }}</span>
    </div>

    <!-- Import panel -->
    <div v-if="showImport" class="card p-5">
      <h4 class="font-semibold text-sm text-gray-700 mb-3">Structuur importeren</h4>
      <p class="text-xs text-gray-500 mb-3">Plak hieronder de structuur die je van ChatGPT hebt teruggekregen. Kies het juiste formaat.</p>
      <div class="flex gap-4 mb-3">
        <button class="btn-sm" :class="importMode === 'json' ? 'btn-primary' : 'btn-secondary'" @click="importMode = 'json'">JSON-formaat</button>
        <button class="btn-sm" :class="importMode === 'csv' ? 'btn-primary' : 'btn-secondary'" @click="importMode = 'csv'">CSV / Spreadsheet</button>
      </div>
      <div v-if="importMode === 'json'">
        <textarea v-model="importJson" class="textarea font-mono text-xs" rows="10" placeholder='{"root":[{"title":"Home","slug":"","blocks":[{"name":"Hero","type":"hero","goal":"Directe aandacht"},{"name":"Introductie","type":"introductie"}],"children":[{"title":"Diensten","slug":"diensten","blocks":[...],"children":[...]}]}]}' />
      </div>
      <div v-if="importMode === 'csv'">
        <textarea v-model="importCsv" class="textarea font-mono text-xs" rows="8" placeholder="Pagina;Slug;Parent;Niveau&#10;Home;;&#10;Diensten;diensten;;0&#10;Airconditioning;airconditioning;Diensten;1" />
      </div>
      <div class="mt-3 flex items-center gap-2">
        <input type="checkbox" id="replaceNodes" v-model="importReplace" class="rounded border-gray-300 text-pienter-600 focus:ring-pienter-500" />
        <label for="replaceNodes" class="text-sm text-gray-700">Bestaande structuur verwijderen (vervangt alle huidige pagina's en blokken)</label>
      </div>
      <div class="flex gap-2 mt-3">
        <button v-if="importMode === 'json'" class="btn-primary btn-sm" @click="handleJsonImport" :disabled="!importJson.trim()">Importeren</button>
        <button v-if="importMode === 'csv'" class="btn-primary btn-sm" @click="handleCsvImport" :disabled="!importCsv.trim()">Importeren</button>
      </div>
      <p v-if="importMsg" class="text-sm mt-2" :class="importError ? 'text-red-600' : 'text-green-600'">{{ importMsg }}</p>
    </div>

    <!-- View switcher -->
    <div class="flex items-center gap-1 bg-gray-100 rounded-lg p-1 w-fit">
      <button v-for="v in views" :key="v.key" class="px-3 py-1.5 text-xs font-medium rounded-md transition-colors"
        :class="activeView === v.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'"
        @click="activeView = v.key">
        {{ v.icon }} {{ v.label }}
      </button>
    </div>

    <!-- Warnings bar -->
    <div v-if="store.warnings.length > 0" class="card p-4 border-l-4 border-amber-400 bg-amber-50">
      <div class="flex items-center justify-between mb-2">
        <h4 class="text-sm font-semibold text-amber-800">⚠️ {{ store.warnings.length }} waarschuwingen</h4>
        <button class="text-xs text-amber-600 hover:underline" @click="showAllWarnings = !showAllWarnings">
          {{ showAllWarnings ? 'Inklappen' : 'Alles tonen' }}
        </button>
      </div>
      <div v-if="showAllWarnings" class="space-y-1">
        <div v-for="w in store.warnings" :key="w.nodeId + w.type" class="flex items-start gap-2 text-xs text-amber-700">
          <span>{{ w.severity === 'error' ? '🔴' : w.severity === 'warning' ? '🟡' : 'ℹ️' }}</span>
          <span class="flex-1">{{ w.message }}</span>
          <button class="text-pienter-600 hover:underline" @click="selectAndScroll(w.nodeId)">Bekijk</button>
        </div>
      </div>
    </div>

    <!-- TREE VIEW -->
    <div v-if="activeView === 'tree'" class="card p-5">
      <div v-if="store.flatSortedNodes.length === 0" class="empty-state py-12">
        <div class="text-4xl mb-4">🌳</div>
        <h3 class="text-lg font-semibold text-gray-700">Nog geen pagina's</h3>
        <p>Importeer een structuur of voeg handmatig pagina's toe.</p>
      </div>
      <div v-else class="space-y-1">
        <TreeNode v-for="node in rootNodes" :key="node.id"
          :node="node" :all-nodes="store.siteNodes" :project-id="projectId"
          :selected-id="store.selectedNodeId"
          @select="store.selectedNodeId = $event"
          @add-child="addChildNode" @delete="deleteNode" @duplicate="duplicateNode"
          @toggle-nav="toggleNav" @toggle-park="togglePark"
        />
      </div>
      <!-- Geparkeerde pagina's -->
      <div v-if="store.parkedNodes.length > 0" class="mt-6 pt-4 border-t border-dashed border-gray-300">
        <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">📦 Geparkeerd (fase 2)</h4>
        <div v-for="node in store.parkedNodes" :key="node.id" class="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 text-sm text-gray-400">
          <span>📄</span>
          <span class="flex-1">{{ node.title }}</span>
          <button class="text-xs text-pienter-600 hover:underline" @click="togglePark(node.id)">Terugplaatsen</button>
        </div>
      </div>
    </div>

    <!-- TABLE VIEW -->
    <div v-if="activeView === 'table'" class="card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <th class="text-left px-4 py-3 font-medium text-gray-600">Pagina</th>
              <th class="text-left px-4 py-3 font-medium text-gray-600 w-16">Niv.</th>
              <th class="text-left px-4 py-3 font-medium text-gray-600">Slug</th>
              <th class="text-left px-4 py-3 font-medium text-gray-600">Volledige URL</th>
              <th class="text-left px-4 py-3 font-medium text-gray-600 w-20">Menu</th>
              <th class="text-left px-4 py-3 font-medium text-gray-600">Type</th>
              <th class="text-left px-4 py-3 font-medium text-gray-600">Doel</th>
              <th class="text-left px-4 py-3 font-medium text-gray-600">Focus</th>
              <th class="text-left px-4 py-3 font-medium text-gray-600 w-24">Status</th>
              <th class="text-left px-4 py-3 font-medium text-gray-600">Label</th>
              <th class="text-left px-4 py-3 font-medium text-gray-600 w-20">Prio</th>
              <th class="text-left px-4 py-3 font-medium text-gray-600 w-20">Redirect</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="node in store.flatSortedNodes" :key="node.id"
              class="hover:bg-gray-50 cursor-pointer"
              :class="{ 'bg-pienter-50': store.selectedNodeId === node.id, 'opacity-50': node.isParked }"
              @click="store.selectedNodeId = node.id"
            >
              <td class="px-4 py-2.5">
                <span :style="{ paddingLeft: node.level * 20 + 'px' }" class="flex items-center gap-1">
                  <span v-if="node.level > 0" class="text-gray-300 text-xs">└</span>
                  <span class="font-medium text-gray-900">{{ node.title }}</span>
                </span>
              </td>
              <td class="px-4 py-2.5 text-gray-400">{{ node.level }}</td>
              <td class="px-4 py-2.5 font-mono text-xs text-gray-500">{{ node.slug || '/' }}</td>
              <td class="px-4 py-2.5 text-xs text-pienter-600 max-w-[200px] truncate">{{ node.fullUrl }}</td>
              <td class="px-4 py-2.5 text-center">{{ node.isInMainNav ? '✅' : '—' }}</td>
              <td class="px-4 py-2.5 text-xs text-gray-600">{{ node.type }}</td>
              <td class="px-4 py-2.5 text-xs text-gray-600">{{ node.goal || '—' }}</td>
              <td class="px-4 py-2.5 text-xs text-gray-500">{{ node.focusTopic || '—' }}</td>
              <td class="px-4 py-2.5"><span :class="contentStatusClass(node.contentStatus)" class="text-[10px] rounded-full px-2 py-0.5">{{ node.contentStatus }}</span></td>
              <td class="px-4 py-2.5"><span :class="labelClass(node.label)" class="text-[10px] rounded-full px-2 py-0.5">{{ node.label }}</span></td>
              <td class="px-4 py-2.5"><span :class="prioClass(node.priority)" class="text-[10px] rounded-full px-2 py-0.5 font-medium">{{ node.priority }}</span></td>
              <td class="px-4 py-2.5 text-center">{{ node.needsRedirect ? '⚠️' : '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- NAVIGATION VIEW -->
    <div v-if="activeView === 'nav'" class="card p-5">
      <h4 class="font-semibold text-gray-900 mb-4">🧭 Hoofdnavigatie</h4>
      <div v-if="store.mainNavNodes.length === 0" class="text-sm text-gray-400 text-center py-8">Nog geen pagina's in het hoofdmenu.</div>
      <div v-else class="flex flex-wrap gap-3">
        <div v-for="node in topNavItems" :key="node.id" class="relative">
          <div class="bg-pienter-50 border-2 border-pienter-200 rounded-xl px-4 py-3 text-center min-w-[120px] cursor-pointer hover:border-pienter-400 transition-colors"
            :class="{ 'border-pienter-600 ring-2 ring-pienter-200': store.selectedNodeId === node.id }"
            @click="store.selectedNodeId = node.id">
            <div class="font-medium text-sm text-pienter-900">{{ node.title }}</div>
            <div class="text-[10px] text-pienter-500 mt-0.5">{{ node.slug || '/' }}</div>
          </div>
          <!-- Sub-items -->
          <div v-if="navChildren(node.id).length > 0" class="mt-2 ml-2 space-y-1">
            <div v-for="child in navChildren(node.id)" :key="child.id"
              class="bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs cursor-pointer hover:bg-gray-50"
              :class="{ 'border-pienter-400 bg-pienter-50': store.selectedNodeId === child.id }"
              @click="store.selectedNodeId = child.id">
              <span class="text-gray-400 mr-1">└</span> {{ child.title }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- PAGE LIST VIEW -->
    <div v-if="activeView === 'list'" class="space-y-4">
      <div class="flex gap-2 flex-wrap">
        <select v-model="listFilter.label" class="select text-xs w-auto">
          <option value="">Alle labels</option>
          <option v-for="l in allLabels" :key="l" :value="l">{{ l }}</option>
        </select>
        <select v-model="listFilter.priority" class="select text-xs w-auto">
          <option value="">Alle prioriteiten</option>
          <option value="hoog">Hoog</option>
          <option value="middel">Middel</option>
          <option value="laag">Laag</option>
        </select>
        <select v-model="listFilter.contentStatus" class="select text-xs w-auto">
          <option value="">Alle statussen</option>
          <option value="niet-gestart">Niet gestart</option>
          <option value="in-progress">In progress</option>
          <option value="klaar">Klaar</option>
          <option value="review">Review</option>
        </select>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div v-for="node in filteredList" :key="node.id"
          class="card p-4 cursor-pointer hover:border-pienter-300 transition-colors"
          :class="{ 'border-pienter-400 ring-2 ring-pienter-100': store.selectedNodeId === node.id }"
          @click="store.selectedNodeId = node.id">
          <div class="flex items-center gap-2 mb-2">
            <span class="font-medium text-sm text-gray-900">{{ node.title }}</span>
            <span :class="prioClass(node.priority)" class="text-[10px] rounded-full px-2 py-0.5">{{ node.priority }}</span>
          </div>
          <div class="text-xs text-pienter-600 font-mono mb-2">{{ node.fullUrl }}</div>
          <div class="flex flex-wrap gap-1 mb-2">
            <span class="text-[10px] bg-gray-100 text-gray-600 rounded px-1.5 py-0.5">{{ node.type }}</span>
            <span v-if="node.goal" class="text-[10px] bg-blue-50 text-blue-600 rounded px-1.5 py-0.5">{{ node.goal }}</span>
            <span :class="labelClass(node.label)" class="text-[10px] rounded px-1.5 py-0.5">{{ node.label }}</span>
          </div>
          <div v-if="node.focusTopic" class="text-xs text-gray-500">🔍 {{ node.focusTopic }}</div>
          <div v-if="node.targetAudience" class="text-xs text-gray-500">👥 {{ node.targetAudience }}</div>
          <div v-if="nodeOpenQuestions(node).length > 0" class="text-xs text-amber-600 mt-1">❓ {{ nodeOpenQuestions(node).length }} open vragen</div>
        </div>
      </div>
    </div>

    <!-- Selected node detail panel -->
    <div v-if="store.selectedNode" class="card p-5">
      <div class="flex items-center justify-between mb-4">
        <h4 class="font-bold text-gray-900">📄 {{ store.selectedNode.title }} bewerken</h4>
        <button class="text-gray-400 hover:text-gray-600" @click="store.selectedNodeId = null">✕ Sluiten</button>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Paginatitel</label>
          <input v-model="editNode.title" class="input" @blur="saveNode" />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Slug</label>
          <input v-model="editNode.slug" class="input font-mono text-sm" @blur="saveNode" />
          <div class="text-xs text-pienter-600 mt-1">URL: {{ editNode.fullUrl || '...' }}</div>
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Type pagina</label>
          <select v-model="editNode.type" class="select" @change="saveNode">
            <option v-for="t in nodeTypes" :key="t" :value="t">{{ t }}</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Doel van de pagina</label>
          <select v-model="editNode.goal" class="select" @change="saveNode">
            <option :value="null">— Nog niet bepaald</option>
            <option value="informeren">Informeren</option>
            <option value="overtuigen">Overtuigen</option>
            <option value="converteren">Converteren</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Doelgroep</label>
          <input v-model="editNode.targetAudience" class="input" @blur="saveNode" placeholder="bijv. facility managers, mkb-ondernemers" />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Prioriteit</label>
          <select v-model="editNode.priority" class="select" @change="saveNode">
            <option value="hoog">Hoog</option>
            <option value="middel">Middel</option>
            <option value="laag">Laag</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Label</label>
          <select v-model="editNode.label" class="select" @change="saveNode">
            <option v-for="l in allLabels" :key="l" :value="l">{{ l }}</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Contentstatus</label>
          <select v-model="editNode.contentStatus" class="select" @change="saveNode">
            <option value="niet-gestart">Niet gestart</option>
            <option value="in-progress">In progress</option>
            <option value="klaar">Klaar</option>
            <option value="review">Review</option>
          </select>
        </div>
      </div>
      <div class="mt-4 space-y-4">
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Waarom bestaat deze pagina?</label>
          <textarea v-model="editNode.reasonExists" class="textarea text-sm" rows="2" @blur="saveNode" placeholder="Beschrijf kort waarom deze pagina nodig is..." />
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Focus onderwerp (SEO)</label>
            <input v-model="editNode.focusTopic" class="input" @blur="saveNode" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Meta title</label>
            <input v-model="editNode.metaTitle" class="input" @blur="saveNode" />
            <div class="text-xs text-gray-400 mt-0.5">{{ (editNode.metaTitle || '').length }}/60</div>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Meta description</label>
            <input v-model="editNode.metaDescription" class="input" @blur="saveNode" />
            <div class="text-xs text-gray-400 mt-0.5">{{ (editNode.metaDescription || '').length }}/160</div>
          </div>
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Redirects van (oude URL's)</label>
          <input v-model="redirectsText" class="input font-mono text-xs" @blur="saveNode" placeholder="bijv. /oud-pad, /andere-url (komma-gescheiden)" />
        </div>
        <div class="flex items-center gap-6 text-sm">
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" v-model="editNode.isInMainNav" @change="saveNode" class="rounded border-gray-300" />
            In hoofdnavigatie
          </label>
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" v-model="editNode.needsRedirect" @change="saveNode" class="rounded border-gray-300" />
            Redirect nodig
          </label>
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" v-model="editNode.isParked" @change="saveNode" class="rounded border-gray-300" />
            Geparkeerd (fase 2)
          </label>
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Notities</label>
          <textarea v-model="editNode.notes" class="textarea text-sm" rows="2" @blur="saveNode" />
        </div>
        <!-- Gekoppelde vragen uit fase 1 -->
        <div v-if="nodeOpenQuestions(store.selectedNode).length > 0" class="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <h5 class="text-xs font-semibold text-amber-800 mb-2">❓ Open vragen uit Fase 1</h5>
          <div v-for="q in nodeOpenQuestions(store.selectedNode)" :key="q.id" class="text-xs text-amber-700 mb-1">
            • {{ q.question }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, reactive, onMounted } from 'vue'
import { useStructuurStore } from '../../stores/structuurStore'
import { useProjectStore } from '../../stores/projectStore'
import type { SiteNode, SiteNodeType, SiteNodeLabel, ContentStatus, ClientQuestion, JourneyFase } from '@shared/types'
import TreeNode from './TreeNode.vue'

const props = defineProps<{ projectId: string }>()
const store = useStructuurStore()
const projectStore = useProjectStore()

const activeView = ref<'tree' | 'table' | 'nav' | 'list'>('tree')
const showImport = ref(false)
const showAllWarnings = ref(false)
const importMode = ref<'json' | 'csv'>('json')
const importJson = ref('')
const importCsv = ref('')
const importMsg = ref('')
const importError = ref(false)
const importReplace = ref(true)
const copySuccess = ref('')

const views = [
  { key: 'tree' as const, icon: '🌳', label: 'Structuur' },
  { key: 'table' as const, icon: '📊', label: 'Tabel' },
  { key: 'nav' as const, icon: '🧭', label: 'Navigatie' },
  { key: 'list' as const, icon: '📋', label: 'Pagina-overzicht' },
]

const nodeTypes: SiteNodeType[] = ['page', 'post', 'archive', 'case', 'utility', 'landing', 'service', 'branch', 'blog', 'detail-template']
const allLabels: SiteNodeLabel[] = ['nieuw', 'bestaand', 'herschrijven', 'migreren', 'onderzoeken', 'fase-1', 'fase-2']

const listFilter = reactive({ label: '', priority: '', contentStatus: '' })

const editNode = reactive<Partial<SiteNode>>({})
const redirectsText = ref('')

const rootNodes = computed(() => {
  return store.siteNodes.filter(n => !n.parentId && !n.isParked).sort((a, b) => a.sortOrder - b.sortOrder)
})

const topNavItems = computed(() => {
  return store.siteNodes.filter(n => n.isInMainNav && !n.parentId && !n.isParked).sort((a, b) => a.sortOrder - b.sortOrder)
})

function navChildren(parentId: string) {
  return store.siteNodes.filter(n => n.parentId === parentId && n.isInMainNav && !n.isParked).sort((a, b) => a.sortOrder - b.sortOrder)
}

const filteredList = computed(() => {
  return store.flatSortedNodes.filter(n => {
    if (listFilter.label && n.label !== listFilter.label) return false
    if (listFilter.priority && n.priority !== listFilter.priority) return false
    if (listFilter.contentStatus && n.contentStatus !== listFilter.contentStatus) return false
    return true
  })
})

function nodeOpenQuestions(node: SiteNode) {
  return store.clientQuestions.filter(q => node.openQuestionIds?.includes(q.id) && q.status === 'open')
}

// Watch selected node to populate edit form
watch(() => store.selectedNodeId, (newId) => {
  if (newId) {
    const node = store.siteNodes.find(n => n.id === newId)
    if (node) {
      Object.assign(editNode, { ...node })
      redirectsText.value = (node.redirectsFrom || []).join(', ')
    }
  }
}, { immediate: true })

async function saveNode() {
  if (!store.selectedNodeId) return
  const redirects = redirectsText.value.split(',').map(s => s.trim()).filter(Boolean)
  await store.updateNode(props.projectId, store.selectedNodeId, { ...editNode, redirectsFrom: redirects })
  await fetchWarnings()
}

async function addRootNode() {
  await store.createNode(props.projectId, { title: 'Nieuwe pagina', slug: 'nieuwe-pagina' })
}

async function addChildNode(parentId: string) {
  await store.createNode(props.projectId, { parentId, title: 'Subpagina', slug: 'subpagina' })
}

async function deleteNode(nodeId: string) {
  if (!confirm('Pagina en alle subpagina\'s verwijderen?')) return
  await store.deleteNode(props.projectId, nodeId)
  if (store.selectedNodeId === nodeId) store.selectedNodeId = null
}

async function duplicateNode(nodeId: string) {
  await store.duplicateNode(props.projectId, nodeId)
}

async function toggleNav(nodeId: string) {
  const node = store.siteNodes.find(n => n.id === nodeId)
  if (node) await store.updateNode(props.projectId, nodeId, { isInMainNav: !node.isInMainNav })
}

async function togglePark(nodeId: string) {
  const node = store.siteNodes.find(n => n.id === nodeId)
  if (node) await store.updateNode(props.projectId, nodeId, { isParked: !node.isParked })
}

async function fetchWarnings() {
  await store.fetchWarnings(props.projectId)
}

function selectAndScroll(nodeId: string) {
  store.selectedNodeId = nodeId
}

// Load doelgroep data on mount
onMounted(async () => {
  if (projectStore.doelgroepen.length === 0) {
    await projectStore.fetchDoelgroepen(props.projectId)
  }
  if (projectStore.doelgroepVragen.length === 0) {
    await projectStore.fetchAllDoelgroepVragen(props.projectId)
  }
  if (projectStore.componenten.length === 0) {
    await projectStore.fetchComponenten(props.projectId)
  }
})

const faseLabels: Record<JourneyFase, string> = { see: 'See / Oriëntatie', think: 'Think / Overweging', do: 'Do / Kiezen', care: 'Care / Behoud & Vergroten' }
const faseOrder: JourneyFase[] = ['see', 'think', 'do', 'care']

async function copyVragenToClipboard() {
  const lines: string[] = []

  lines.push('=== DOELGROEPEN & KLANTVRAGEN ===')
  lines.push('')

  for (const dg of projectStore.doelgroepen) {
    const dgVragen = projectStore.doelgroepVragen.filter(v => v.doelgroepId === dg.id)
    if (dgVragen.length === 0) continue

    lines.push(`--- Doelgroep: ${dg.name} ${dg.description ? '(' + dg.description + ')' : ''} ---`)
    lines.push('')

    for (const fase of faseOrder) {
      const faseVragen = dgVragen.filter(v => v.fase === fase).sort((a, b) => a.sortOrder - b.sortOrder)
      if (faseVragen.length === 0) continue

      lines.push(`${faseLabels[fase]}:`)
      for (const v of faseVragen) {
        let line = `  - ${v.text}`
        if (v.answer) line += ` → ${v.answer}`
        if (v.webpagina) line += ` [${v.webpagina}]`
        lines.push(line)
      }
      lines.push('')
    }
  }

  lines.push('')
  lines.push('=== BESCHIKBARE COMPONENTEN (ACF BLOKKEN) ===')
  lines.push('Gebruik *uitsluitend* de volgende componentnamen bij het bepalen van de blok-indeling. Elk component heeft een specifieke categorie (broodblok, flexblok, posttype) en soms een beschrijving.')
  lines.push('')
  
  const componenten = projectStore.componenten
  if (componenten.length > 0) {
    const cats = ['broodblok', 'flexblok', 'posttype'] as const
    for (const cat of cats) {
      const catComps = componenten.filter(c => c.category === cat)
      if (catComps.length === 0) continue
      lines.push(`${cat.toUpperCase()}:`)
      for (const comp of catComps) {
        let compLine = `  - ${comp.name}`
        if (comp.description) compLine += `: ${comp.description}`
        lines.push(compLine)
      }
      lines.push('')
    }
  } else {
    lines.push('  - [Geen componenten gevonden in project - gebruik standaard indeling]')
    lines.push('')
  }

  lines.push('=== OPDRACHT ===')
  lines.push('Maak op basis van bovenstaande doelgroepen, klantvragen en componenten een websitestructuur met per pagina een blok-indeling.')
  lines.push('Belangrijk: De waarde voor "type" of "componentPattern" van een blok MOET overeenkomen met exact één van de componentnamen uit de lijst hierboven.')
  lines.push('Geef het resultaat terug als JSON in exact dit formaat:')
  lines.push('{')
  lines.push('  "root": [')
  lines.push('    {')
  lines.push('      "title": "Home",')
  lines.push('      "slug": "",')
  lines.push('      "blocks": [')
  lines.push('        { "name": "Hero", "type": "Broodblok-Hero", "goal": "Directe aandacht trekken", "contentDescription": "Korte tekst met CTA" },')
  lines.push('        { "name": "Introductie", "type": "Flexblok-Tekst", "goal": "Uitleg wat het bedrijf doet" },')
  lines.push('        { "name": "Diensten overzicht", "type": "Flexblok-Media-Grid", "goal": "Overzicht van diensten" },')
  lines.push('        { "name": "Reviews", "type": "Flexblok-Testimonials", "goal": "Vertrouwen opbouwen" },')
  lines.push('        { "name": "Call to Action", "type": "Flexblok-CTA-Banner", "goal": "Bezoeker laten converteren" }')
  lines.push('      ],')
  lines.push('      "children": [')
  lines.push('        { "title": "Pagina", "slug": "pagina", "blocks": [...], "children": [...] }')
  lines.push('      ]')
  lines.push('    }')
  lines.push('  ]')
  lines.push('}')
  lines.push('')
  lines.push('Houd rekening met:')
  lines.push('- Logische hiërarchie (max 3 niveaus diep)')
  lines.push('- Elke pagina moet een duidelijk doel hebben')
  lines.push('- Groepeer gerelateerde content')
  lines.push('- Gebruik duidelijke, SEO-vriendelijke slugs')
  lines.push('- Geef per pagina een logische blokindeling die past bij het doel van de pagina en gebruik ALLEEN de voorgedefinieerde componenten.')
  lines.push('- Elke pagina begint in ieder geval met een Broodblok-Hero (of vergelijkbaar broodblok)')

  const text = lines.join('\n')

  try {
    await navigator.clipboard.writeText(text)
    copySuccess.value = `Klantvragen van ${projectStore.doelgroepen.length} doelgroep(en) gekopieerd! Plak dit in ChatGPT om een structuur te genereren.`
    setTimeout(() => { copySuccess.value = '' }, 5000)
  } catch {
    const textarea = document.createElement('textarea')
    textarea.value = text
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    copySuccess.value = 'Klantvragen gekopieerd naar klembord!'
    setTimeout(() => { copySuccess.value = '' }, 5000)
  }
}

async function clearProjectNodes() {
  // Delete all nodes for this project (blocks are cleaned up server-side)
  for (const node of [...store.siteNodes].filter(n => !n.parentId)) {
    await store.deleteNode(props.projectId, node.id)
  }
  store.allProjectBlocks = []
}

async function handleJsonImport() {
  importMsg.value = ''
  importError.value = false
  try {
    const data = JSON.parse(importJson.value)
    if (!data.root) throw new Error('JSON moet een "root" array bevatten.')
    if (importReplace.value && store.siteNodes.length > 0) {
      await clearProjectNodes()
    }
    const result = await store.importNodes(props.projectId, data)
    const blockMsg = result.blocks && result.blocks.length > 0 ? ` en ${result.blocks.length} blokken` : ''
    importMsg.value = `✅ ${result.nodes.length} pagina's${blockMsg} geïmporteerd!`
    importJson.value = ''
    showImport.value = false
    await fetchWarnings()
  } catch (e: any) {
    importError.value = true
    importMsg.value = `Fout: ${e.message}`
  }
}

async function handleCsvImport() {
  importMsg.value = ''
  importError.value = false
  try {
    const lines = importCsv.value.trim().split('\n').filter(l => l.trim())
    if (lines.length < 2) throw new Error('Minimaal een header-rij en één pagina nodig.')
    if (importReplace.value && store.siteNodes.length > 0) {
      await clearProjectNodes()
    }
    // Skip header
    const rows = lines.slice(1).map(line => {
      const [title, slug, parentTitle, level] = line.split(';').map(s => s.trim())
      return { title, slug: slug || title.toLowerCase().replace(/\s+/g, '-'), parentTitle: parentTitle || undefined, level: level ? parseInt(level) : undefined }
    })
    const nodes = await store.importFlatNodes(props.projectId, rows)
    importMsg.value = `✅ ${nodes.length} pagina's geïmporteerd!`
    importCsv.value = ''
    showImport.value = false
    await fetchWarnings()
  } catch (e: any) {
    importError.value = true
    importMsg.value = `Fout: ${e.message}`
  }
}

function contentStatusClass(s: ContentStatus) {
  return { 'niet-gestart': 'bg-gray-100 text-gray-600', 'in-progress': 'bg-blue-100 text-blue-700', klaar: 'bg-green-100 text-green-700', review: 'bg-amber-100 text-amber-700' }[s]
}
function labelClass(l: SiteNodeLabel) {
  return { nieuw: 'bg-green-100 text-green-700', bestaand: 'bg-gray-100 text-gray-600', herschrijven: 'bg-orange-100 text-orange-700', migreren: 'bg-blue-100 text-blue-700', onderzoeken: 'bg-purple-100 text-purple-700', 'fase-1': 'bg-pienter-100 text-pienter-700', 'fase-2': 'bg-cyan-100 text-cyan-700' }[l]
}
function prioClass(p: string) {
  return { hoog: 'bg-red-100 text-red-700', middel: 'bg-amber-100 text-amber-700', laag: 'bg-green-100 text-green-700' }[p] || 'bg-gray-100 text-gray-600'
}
</script>
