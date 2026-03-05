<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-xl font-bold text-gray-900 mb-1">Pre-live Auditor</h2>
        <p class="text-sm text-gray-500">Simuleer een scan van de staging- of live omgeving en bekijk/beheer issues</p>
      </div>
      <div class="flex gap-2">
        <select v-model="selectedEnv" class="select w-auto">
          <option value="staging">Staging</option>
          <option value="live">Live</option>
        </select>
        <button class="btn-primary" @click="startAudit" :disabled="scanning">
          {{ scanning ? 'Scannen...' : 'Start scan' }}
        </button>
      </div>
    </div>

    <!-- Scanning animatie -->
    <div v-if="scanning" class="card p-8 text-center mb-6">
      <div class="text-3xl mb-3 animate-pulse">🔍</div>
      <h3 class="font-semibold text-gray-900 mb-2">Scan bezig...</h3>
      <div class="w-64 h-2 bg-gray-100 rounded-full mx-auto overflow-hidden">
        <div class="h-full bg-pienter-500 rounded-full animate-scan-progress" />
      </div>
      <p class="text-sm text-gray-500 mt-3">{{ scanStep }}</p>
    </div>

    <!-- Geen audit runs -->
    <div v-if="!scanning && store.auditRuns.length === 0 && store.auditIssues.length === 0" class="empty-state card p-12">
      <div class="text-4xl mb-4">🔍</div>
      <h3 class="text-lg font-semibold text-gray-700">Nog geen audit uitgevoerd</h3>
      <p>Klik op "Start scan" om een pre-live check te draaien. De auditor controleert pagina's, metadata, afbeeldingen, redirects en meer.</p>
    </div>

    <!-- Resultaten -->
    <div v-if="!scanning && latestRun">
      <!-- Summary -->
      <div class="grid grid-cols-5 gap-4 mb-6">
        <div class="card p-4 text-center">
          <div class="text-2xl font-bold" :class="scoreColor">{{ latestRun.summary?.score ?? '-' }}</div>
          <div class="text-xs text-gray-500 mt-1">Score</div>
        </div>
        <div class="card p-4 text-center">
          <div class="text-2xl font-bold text-gray-900">{{ latestRun.summary?.totalIssues ?? 0 }}</div>
          <div class="text-xs text-gray-500 mt-1">Totaal issues</div>
        </div>
        <div class="card p-4 text-center">
          <div class="text-2xl font-bold text-red-600">{{ latestRun.summary?.high ?? 0 }}</div>
          <div class="text-xs text-gray-500 mt-1">Hoog</div>
        </div>
        <div class="card p-4 text-center">
          <div class="text-2xl font-bold text-orange-500">{{ latestRun.summary?.medium ?? 0 }}</div>
          <div class="text-xs text-gray-500 mt-1">Medium</div>
        </div>
        <div class="card p-4 text-center">
          <div class="text-2xl font-bold text-yellow-500">{{ latestRun.summary?.low ?? 0 }}</div>
          <div class="text-xs text-gray-500 mt-1">Laag</div>
        </div>
      </div>

      <!-- Filters -->
      <div class="flex gap-3 mb-4 flex-wrap">
        <select v-model="filterSeverity" class="select w-auto">
          <option value="">Alle prioriteiten</option>
          <option value="high">Hoog</option>
          <option value="medium">Medium</option>
          <option value="low">Laag</option>
        </select>
        <select v-model="filterCategory" class="select w-auto">
          <option value="">Alle categorieën</option>
          <option v-for="cat in categories" :key="cat" :value="cat">{{ categoryLabel(cat) }}</option>
        </select>
        <select v-model="filterIssueStatus" class="select w-auto">
          <option value="">Alle statussen</option>
          <option value="open">Open</option>
          <option value="fixed">Opgelost</option>
          <option value="ignored">Genegeerd</option>
        </select>
        <div class="flex-1" />
        <button class="btn-tertiary btn-sm" @click="showReport = true">📄 Bekijk rapport</button>
        <button class="btn-secondary btn-sm" @click="exportJson">Exporteer JSON</button>
      </div>

      <!-- Issues lijst -->
      <div class="space-y-2">
        <div
          v-for="issue in filteredIssues"
          :key="issue.id"
          class="card p-4"
          :class="{ 'opacity-50': issue.status !== 'open' }"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-1">
                <span class="badge text-[10px]" :class="severityClass(issue.severity)">{{ severityLabel(issue.severity) }}</span>
                <span class="badge bg-gray-100 text-gray-600 text-[10px]">{{ categoryLabel(issue.category) }}</span>
                <span v-if="issue.pageId" class="text-xs text-gray-400">📄 {{ pageName(issue.pageId) }}</span>
              </div>
              <p class="text-sm text-gray-900">{{ issue.description }}</p>
              <p class="text-xs text-gray-500 mt-1">💡 {{ issue.recommendedFix }}</p>
            </div>
            <div class="flex items-center gap-2 ml-4 shrink-0">
              <span v-if="issue.status !== 'open'" class="badge text-[10px]" :class="issue.status === 'fixed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'">
                {{ issue.status === 'fixed' ? 'Opgelost' : 'Genegeerd' }}
              </span>
              <button v-if="issue.status === 'open'" class="btn-primary btn-sm text-[10px]" @click="markFixed(issue)">✓ Opgelost</button>
              <button v-if="issue.status === 'open'" class="btn-secondary btn-sm text-[10px]" @click="markIgnored(issue)">Negeer</button>
              <button v-if="issue.status !== 'open'" class="btn-secondary btn-sm text-[10px]" @click="markOpen(issue)">Heropen</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Rapport modal (printable) -->
    <div v-if="showReport" class="fixed inset-0 bg-black/30 flex items-center justify-center z-50" @click.self="showReport = false">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-8">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-xl font-bold">Pre-live Audit Rapport</h3>
          <div class="flex gap-2">
            <button class="btn-secondary btn-sm" @click="printReport">🖨️ Print</button>
            <button class="btn-secondary btn-sm" @click="showReport = false">Sluiten</button>
          </div>
        </div>

        <div id="audit-report">
          <div class="border-b pb-4 mb-4">
            <h4 class="font-semibold text-gray-900">{{ store.currentProject?.name }}</h4>
            <p class="text-sm text-gray-500">Omgeving: {{ latestRun?.environment }} · Datum: {{ latestRun?.finishedAt ? formatDate(latestRun.finishedAt) : '-' }}</p>
            <div class="mt-3 flex gap-4 text-sm">
              <span>Score: <strong :class="scoreColor">{{ latestRun?.summary?.score }}/100</strong></span>
              <span>Issues: <strong>{{ latestRun?.summary?.totalIssues }}</strong></span>
              <span class="text-red-600">Hoog: {{ latestRun?.summary?.high }}</span>
              <span class="text-orange-500">Medium: {{ latestRun?.summary?.medium }}</span>
              <span class="text-yellow-500">Laag: {{ latestRun?.summary?.low }}</span>
            </div>
          </div>

          <div v-for="issue in store.auditIssues" :key="issue.id" class="py-3 border-b border-gray-100 text-sm">
            <div class="flex items-center gap-2 mb-1">
              <span class="font-medium" :class="issue.severity === 'high' ? 'text-red-600' : issue.severity === 'medium' ? 'text-orange-600' : 'text-yellow-600'">
                {{ severityLabel(issue.severity).toUpperCase() }}
              </span>
              <span class="text-gray-400">·</span>
              <span class="text-gray-600">{{ categoryLabel(issue.category) }}</span>
              <span v-if="issue.status !== 'open'" class="text-gray-400">· {{ issue.status === 'fixed' ? '✅ Opgelost' : '⏭️ Genegeerd' }}</span>
            </div>
            <p class="text-gray-900">{{ issue.description }}</p>
            <p class="text-gray-500 text-xs mt-0.5">Aanbeveling: {{ issue.recommendedFix }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useProjectStore } from '../../stores/projectStore'
import type { AuditIssue, AuditSeverity, AuditCategory, AuditEnvironment } from '@shared/types'

const store = useProjectStore()
const selectedEnv = ref<AuditEnvironment>('staging')
const scanning = ref(false)
const scanStep = ref('')
const filterSeverity = ref('')
const filterCategory = ref('')
const filterIssueStatus = ref('')
const showReport = ref(false)

const categories: AuditCategory[] = ['404', 'meta', 'noindex', 'robots', 'sitemap', 'images', 'forms', 'tracking', 'performance', 'redirects', 'lorem']

const latestRun = computed(() => {
  if (store.auditRuns.length === 0) return null
  return store.auditRuns[store.auditRuns.length - 1]
})

const scoreColor = computed(() => {
  const score = latestRun.value?.summary?.score ?? 0
  if (score >= 80) return 'text-green-600'
  if (score >= 50) return 'text-orange-500'
  return 'text-red-600'
})

const filteredIssues = computed(() => {
  return store.auditIssues.filter(i => {
    if (filterSeverity.value && i.severity !== filterSeverity.value) return false
    if (filterCategory.value && i.category !== filterCategory.value) return false
    if (filterIssueStatus.value && i.status !== filterIssueStatus.value) return false
    return true
  })
})

function severityClass(s: AuditSeverity): string {
  return `severity-${s}`
}

function severityLabel(s: AuditSeverity): string {
  const labels: Record<AuditSeverity, string> = { low: 'Laag', medium: 'Medium', high: 'Hoog' }
  return labels[s] || s
}

function categoryLabel(c: AuditCategory): string {
  const labels: Record<AuditCategory, string> = {
    '404': '404 Errors', meta: 'Metadata', noindex: 'Noindex', robots: 'Robots.txt',
    sitemap: 'Sitemap', images: 'Afbeeldingen', forms: 'Formulieren', tracking: 'Tracking',
    performance: 'Performance', redirects: 'Redirects', lorem: 'Placeholder tekst'
  }
  return labels[c] || c
}

function pageName(pid: string): string {
  return store.pages.find(p => p.id === pid)?.title || 'Onbekend'
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

async function startAudit() {
  if (!store.currentProject) return
  scanning.value = true

  // Simuleer scan stappen
  const steps = [
    'Verbinding maken met staging omgeving...',
    'Pagina\'s crawlen...',
    'Metadata controleren...',
    'Afbeeldingen analyseren...',
    'Redirects verifiëren...',
    'Performance meten (Core Web Vitals)...',
    'Tracking en formulieren checken...',
    'Rapport genereren...',
  ]
  for (const step of steps) {
    scanStep.value = step
    await delay(400 + Math.random() * 300)
  }

  await store.runAudit(store.currentProject.id, selectedEnv.value)
  scanning.value = false
}

async function markFixed(issue: AuditIssue) {
  await store.updateAuditIssue(issue.id, { status: 'fixed' })
}

async function markIgnored(issue: AuditIssue) {
  await store.updateAuditIssue(issue.id, { status: 'ignored' })
}

async function markOpen(issue: AuditIssue) {
  await store.updateAuditIssue(issue.id, { status: 'open' })
}

function exportJson() {
  const data = { run: latestRun.value, issues: store.auditIssues }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `audit-rapport-${store.currentProject?.name || 'export'}.json`
  link.click()
}

function printReport() {
  window.print()
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
</script>

<style scoped>
@keyframes scanProgress {
  0% { width: 0%; }
  100% { width: 100%; }
}
.animate-scan-progress {
  animation: scanProgress 3s ease-in-out;
}
</style>
