<template>
  <div>
    <!-- Step navigation + progress -->
    <div class="mb-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-bold text-gray-900">Websitestructuur bepalen</h2>
        <div class="flex gap-2">
          <button class="btn-secondary btn-sm" @click="showExport = !showExport">📤 Exporteren</button>
          <button class="btn-secondary btn-sm" @click="showChangelog = !showChangelog">📋 Wijzigingslog</button>
        </div>
      </div>

      <!-- Progress bar steps -->
      <div class="flex items-center gap-0 bg-white rounded-xl border border-gray-200 overflow-hidden">
        <button v-for="(step, idx) in steps" :key="step.fase"
          class="flex-1 flex items-center gap-3 px-5 py-4 text-left transition-colors relative"
          :class="{
            'bg-pienter-50 text-pienter-900': currentFase === step.fase,
            'bg-white text-gray-500 hover:bg-gray-50': currentFase !== step.fase,
            'border-r border-gray-200': idx < steps.length - 1
          }"
          @click="goToFase(step.fase)"
        >
          <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
            :class="{
              'bg-pienter-600 text-white': currentFase === step.fase,
              'bg-green-500 text-white': isComplete(step.fase) && currentFase !== step.fase,
              'bg-gray-200 text-gray-500': !isComplete(step.fase) && currentFase !== step.fase
            }">
            <span v-if="isComplete(step.fase) && currentFase !== step.fase">✓</span>
            <span v-else>{{ step.fase }}</span>
          </div>
          <div class="min-w-0">
            <div class="font-semibold text-sm truncate">{{ step.title }}</div>
            <div class="text-xs opacity-70 truncate">{{ step.subtitle }}</div>
          </div>
          <!-- Connector arrow -->
          <div v-if="currentFase === step.fase" class="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 w-3 h-3 rotate-45 bg-pienter-50 border-t border-r border-gray-200" />
        </button>
      </div>

      <!-- Progress info -->
      <div class="flex items-center justify-between mt-3 text-xs text-gray-500">
        <span>
          {{ progressSummary }}
        </span>
        <div class="flex gap-3">
          <button v-if="currentFase > 1" class="text-pienter-600 hover:underline" @click="goToFase((currentFase - 1) as any)">← Vorige fase</button>
          <button v-if="currentFase < 2" class="text-pienter-600 hover:underline font-medium" @click="goToFase((currentFase + 1) as any)">Volgende fase →</button>
        </div>
      </div>
    </div>

    <!-- Export panel -->
    <div v-if="showExport" class="card p-5 mb-6">
      <h3 class="font-semibold text-gray-900 mb-3">📤 Exporteren</h3>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button class="btn-secondary btn-sm text-xs text-left" @click="exportStructure('nav-urls')">🧭 Navigatie + URL's</button>
        <button class="btn-secondary btn-sm text-xs text-left" @click="exportStructure('full-table')">📊 Volledige tabel (CSV)</button>
        <button class="btn-secondary btn-sm text-xs text-left" @click="exportStructure('content-inventory')">📝 Content-inventarisatie</button>
        <button class="btn-secondary btn-sm text-xs text-left" @click="exportStructure('page-blocks')">🧱 Pagina-indelingen</button>
        <button class="btn-secondary btn-sm text-xs text-left" @click="exportStructure('open-questions')">❓ Open vragen</button>
        <button class="btn-secondary btn-sm text-xs text-left" @click="exportStructure('seo-export')">🔍 SEO-export</button>
        <button class="btn-secondary btn-sm text-xs text-left" @click="exportStructure('dev-export')">💻 Developer-export</button>
        <button class="btn-secondary btn-sm text-xs text-left" @click="exportStructure('change-report')">📋 Wijzigingsrapport</button>
      </div>
      <div class="mt-3 text-xs text-gray-500">
        Selecteer een exportformaat. Het bestand wordt direct gedownload als CSV of JSON.
      </div>
    </div>

    <!-- Changelog panel -->
    <div v-if="showChangelog" class="card p-5 mb-6 max-h-96 overflow-y-auto">
      <h3 class="font-semibold text-gray-900 mb-3">📋 Wijzigingslog</h3>
      <div v-if="store.changeLog.length === 0" class="text-sm text-gray-400">Nog geen wijzigingen geregistreerd.</div>
      <div v-else class="space-y-2">
        <div v-for="entry in store.changeLog" :key="entry.id" class="flex items-start gap-3 text-xs border-b border-gray-100 pb-2">
          <span class="text-gray-400 whitespace-nowrap">{{ formatTime(entry.timestamp) }}</span>
          <span>{{ actionIcon(entry.action) }}</span>
          <div class="flex-1">
            <span class="font-medium text-gray-800">{{ entry.entityTitle }}</span>
            <span class="text-gray-500 ml-1">{{ entry.details }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Phase content (Fase 3 / pagina-indeling zit nu als sub-tab in Fase 2) -->
    <Fase1Vragen v-if="currentFase === 1" :project-id="projectId" />
    <Fase2Structuur v-else :project-id="projectId" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useStructuurStore } from '../../stores/structuurStore'
import { useProjectStore } from '../../stores/projectStore'
import type { StructuurFase, ChangeLogEntry } from '@shared/types'
import Fase1Vragen from './Fase1Vragen.vue'
import Fase2Structuur from './Fase2Structuur.vue'

const projectStore = useProjectStore()
const store = useStructuurStore()
const projectId = computed(() => projectStore.currentProject?.id || '')

const showExport = ref(false)
const showChangelog = ref(false)

// Fase 3 (pagina-indeling) is verhuisd naar een sub-tab binnen Fase 2, dus de
// fasebalk telt nog 2 stappen. Een opgeslagen currentFase===3 valt terug op 2.
const currentFase = computed(() => Math.min(store.progress?.currentFase || 1, 2))

const steps = [
  { fase: 1 as StructuurFase, title: 'User Stories → Vragen', subtitle: 'Input verzamelen & analyseren' },
  { fase: 2 as StructuurFase, title: 'Structuur, navigatie & indeling', subtitle: 'Pagina\'s, hiërarchie, URL\'s & blokken' },
]

const progressSummary = computed(() => {
  const stories = store.userStories.length
  const questions = store.clientQuestions.length
  const answered = store.answeredQuestions.length
  const nodes = store.siteNodes.length
  const blocks = store.pageBlocks.length

  if (currentFase.value === 1) return `${stories} user stories · ${questions} vragen (${answered} beantwoord)`
  if (currentFase.value === 2) return `${nodes} pagina's in structuur · ${store.warnings.length} waarschuwingen`
  return `${nodes} pagina's · ${blocks} blokken uitgewerkt`
})

function isComplete(fase: StructuurFase): boolean {
  if (!store.progress) return false
  if (fase === 1) return store.progress.fase1Complete
  if (fase === 2) return store.progress.fase2Complete
  if (fase === 3) return store.progress.fase3Complete
  return false
}

async function goToFase(fase: StructuurFase) {
  if (!projectId.value) return
  await store.updateProgress(projectId.value, { currentFase: fase })
}

function formatTime(ts: string) {
  const d = new Date(ts)
  return d.toLocaleDateString('nl-NL', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function actionIcon(action: ChangeLogEntry['action']) {
  return {
    added: '➕', moved: '↕️', renamed: '✏️', deleted: '🗑',
    'url-changed': '🔗', 'block-added': '🧱', 'block-removed': '🧱',
    merged: '🔀', split: '✂️'
  }[action] || '📝'
}

// === Export functions ===
function exportStructure(type: string) {
  const nodes = store.flatSortedNodes
  const questions = store.clientQuestions
  let content = ''
  let filename = ''
  let mimeType = 'text/csv;charset=utf-8;'

  switch (type) {
    case 'nav-urls': {
      const rows = [['Pagina', 'Niveau', 'Slug', 'Volledige URL', 'In menu', 'Doel'].join(',')]
      nodes.forEach(n => rows.push([esc(n.title), n.level, esc(n.slug), esc(n.fullUrl), n.isInMainNav ? 'Ja' : 'Nee', n.goal || ''].join(',')))
      content = rows.join('\n')
      filename = 'navigatie-urls.csv'
      break
    }
    case 'full-table': {
      const rows = [['Pagina', 'Niveau', 'Slug', 'URL', 'Type', 'Doel', 'Doelgroep', 'Focus', 'Meta title', 'Meta desc', 'Status', 'Label', 'Prio', 'In menu', 'Redirect', 'Notities'].join(',')]
      nodes.forEach(n => rows.push([
        esc(n.title), n.level, esc(n.slug), esc(n.fullUrl), n.type, n.goal || '',
        esc(n.targetAudience), esc(n.focusTopic), esc(n.metaTitle), esc(n.metaDescription),
        n.contentStatus, n.label, n.priority, n.isInMainNav ? 'Ja' : 'Nee',
        n.needsRedirect ? 'Ja' : 'Nee', esc(n.notes)
      ].join(',')))
      content = rows.join('\n')
      filename = 'structuur-volledig.csv'
      break
    }
    case 'content-inventory': {
      const rows = [['Pagina', 'URL', 'Doel', 'Doelgroep', 'Focus', 'Contentstatus', 'Reden', 'Notities'].join(',')]
      nodes.forEach(n => rows.push([
        esc(n.title), esc(n.fullUrl), n.goal || '', esc(n.targetAudience),
        esc(n.focusTopic), n.contentStatus, esc(n.reasonExists), esc(n.notes)
      ].join(',')))
      content = rows.join('\n')
      filename = 'content-inventarisatie.csv'
      break
    }
    case 'page-blocks': {
      const data = nodes.map(n => ({
        pagina: n.title, url: n.fullUrl, doel: n.goal,
        blokken: store.pageBlocks.filter(b => b.siteNodeId === n.id).map(b => ({
          naam: b.name, type: b.type, doel: b.goal, content: b.contentDescription,
          component: b.componentPattern, herbruikbaar: b.isReusable
        }))
      }))
      content = JSON.stringify(data, null, 2)
      filename = 'pagina-indelingen.json'
      mimeType = 'application/json;charset=utf-8;'
      break
    }
    case 'open-questions': {
      const rows = [['Vraag', 'Status', 'Groep', 'Antwoord', 'Impact'].join(',')]
      questions.forEach(q => rows.push([esc(q.question), q.status, q.group, esc(q.answer), esc(q.impactOnStructure)].join(',')))
      content = rows.join('\n')
      filename = 'open-vragen.csv'
      break
    }
    case 'seo-export': {
      const rows = [['Pagina', 'URL', 'Focus', 'Meta title', 'Meta desc', 'Redirects van', 'Redirect nodig'].join(',')]
      nodes.forEach(n => rows.push([
        esc(n.title), esc(n.fullUrl), esc(n.focusTopic), esc(n.metaTitle),
        esc(n.metaDescription), (n.redirectsFrom || []).join('; '), n.needsRedirect ? 'Ja' : 'Nee'
      ].join(',')))
      content = rows.join('\n')
      filename = 'seo-export.csv'
      break
    }
    case 'dev-export': {
      const data = nodes.map(n => ({
        title: n.title, slug: n.slug, fullUrl: n.fullUrl,
        type: n.type, level: n.level, parentId: n.parentId,
        isInMainNav: n.isInMainNav, isDetailTemplate: n.isDetailTemplate,
        redirectsFrom: n.redirectsFrom, needsRedirect: n.needsRedirect,
        blocks: store.pageBlocks.filter(b => b.siteNodeId === n.id).map(b => ({
          name: b.name, type: b.type, componentPattern: b.componentPattern, isReusable: b.isReusable
        }))
      }))
      content = JSON.stringify(data, null, 2)
      filename = 'developer-export.json'
      mimeType = 'application/json;charset=utf-8;'
      break
    }
    case 'change-report': {
      const data = store.changeLog.map(e => ({
        datum: e.timestamp, actie: e.action, entiteit: e.entityTitle,
        details: e.details, oud: e.oldValue, nieuw: e.newValue
      }))
      content = JSON.stringify(data, null, 2)
      filename = 'wijzigingsrapport.json'
      mimeType = 'application/json;charset=utf-8;'
      break
    }
  }

  if (content) {
    const blob = new Blob([content], { type: mimeType })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = filename
    link.click()
  }
}

function esc(s: string) {
  return `"${(s || '').replace(/"/g, '""')}"`
}

onMounted(async () => {
  if (projectId.value) {
    await store.loadAll(projectId.value)
  }
})

watch(projectId, async (newId) => {
  if (newId) await store.loadAll(newId)
})
</script>
