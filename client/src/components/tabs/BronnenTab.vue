<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-xl font-bold text-gray-900 mb-1">Bronnen & Documenten</h2>
        <p class="text-sm text-gray-500">Transcripts, notities en links gekoppeld aan pagina's en taken</p>
      </div>
      <button class="btn-primary btn-sm" @click="showNew = true">Bron toevoegen</button>
    </div>

    <div class="flex gap-6" style="min-height: 400px">
      <!-- Linkerkant: lijst -->
      <div class="w-80 shrink-0 space-y-2">
        <div v-if="store.sources.length === 0" class="empty-state card p-8">
          <div class="text-3xl mb-3">📄</div>
          <h3 class="text-sm font-semibold text-gray-700">Nog geen bronnen</h3>
          <p class="text-xs">Plak hier een transcript of voeg notities toe.</p>
        </div>
        <div
          v-for="source in store.sources"
          :key="source.id"
          class="card p-3 cursor-pointer hover:border-pienter-300 transition-colors"
          :class="{ 'border-pienter-400 bg-pienter-50': selectedSource?.id === source.id }"
          @click="selectSource(source)"
        >
          <div class="flex items-center gap-2 mb-1">
            <span class="text-sm">{{ sourceIcon(source.type) }}</span>
            <span class="font-medium text-sm text-gray-900 truncate">{{ source.title }}</span>
          </div>
          <div class="flex gap-1 flex-wrap">
            <span v-for="tag in source.tags" :key="tag" class="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{{ tag }}</span>
          </div>
          <div class="text-[10px] text-gray-400 mt-1">{{ formatDate(source.createdAt) }} · {{ source.relatedPageIds.length }} pagina('s)</div>
        </div>
      </div>

      <!-- Rechterkant: detail -->
      <div class="flex-1">
        <div v-if="!selectedSource" class="empty-state card p-12">
          <div class="text-3xl mb-3">👈</div>
          <h3 class="text-sm font-semibold text-gray-700">Selecteer een bron</h3>
          <p class="text-xs">Klik links op een bron om de details te bekijken.</p>
        </div>

        <div v-else class="card p-5">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold">{{ selectedSource.title }}</h3>
            <span class="badge bg-gray-100 text-gray-600">{{ selectedSource.type }}</span>
          </div>

          <!-- Content -->
          <div class="bg-gray-50 rounded-lg p-4 mb-4 text-sm text-gray-700 whitespace-pre-wrap max-h-64 overflow-y-auto leading-relaxed">{{ selectedSource.contentText || '(geen inhoud)' }}</div>

          <!-- Tags -->
          <div class="mb-4">
            <label class="block text-xs font-medium text-gray-600 mb-1">Tags</label>
            <div class="flex gap-1 flex-wrap mb-2">
              <span v-for="tag in selectedSource.tags" :key="tag" class="badge bg-pienter-50 text-pienter-700 text-xs">
                {{ tag }}
                <button class="ml-1 hover:text-red-500" @click="removeTag(tag)">×</button>
              </span>
            </div>
            <div class="flex gap-2">
              <input v-model="newTag" class="input text-xs" placeholder="Nieuwe tag" @keyup.enter="addTag" />
              <button class="btn-secondary btn-sm" @click="addTag">Toevoegen</button>
            </div>
          </div>

          <!-- Gekoppelde pagina's -->
          <div class="mb-4">
            <label class="block text-xs font-medium text-gray-600 mb-1">Gekoppelde pagina's</label>
            <div class="flex gap-1 flex-wrap mb-2">
              <span v-for="pid in selectedSource.relatedPageIds" :key="pid" class="badge bg-blue-50 text-blue-700 text-xs">
                {{ pageName(pid) }}
                <button class="ml-1 hover:text-red-500" @click="unlinkPage(pid)">×</button>
              </span>
              <span v-if="selectedSource.relatedPageIds.length === 0" class="text-xs text-gray-400">Geen pagina's gekoppeld</span>
            </div>
            <div class="flex gap-2">
              <select v-model="linkPageId" class="select text-xs w-auto">
                <option value="">Kies pagina...</option>
                <option v-for="p in availablePages" :key="p.id" :value="p.id">{{ p.title }}</option>
              </select>
              <button class="btn-secondary btn-sm" @click="linkPage" :disabled="!linkPageId">Koppelen</button>
            </div>
          </div>

          <!-- Mock: Samenvatting genereren -->
          <div class="border-t border-gray-200 pt-4">
            <button class="btn-tertiary btn-sm" @click="generateSummary">✨ Samenvatting genereren (simulatie)</button>
            <div v-if="mockSummary" class="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
              <div class="font-medium text-xs text-amber-600 mb-1">Gesimuleerde samenvatting</div>
              {{ mockSummary }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Nieuwe bron modal -->
    <div v-if="showNew" class="fixed inset-0 bg-black/30 flex items-center justify-center z-50" @click.self="showNew = false">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
        <h3 class="text-lg font-bold mb-4">Bron toevoegen</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Type</label>
            <select v-model="newSource.type" class="select">
              <option value="transcript">Transcript</option>
              <option value="note">Notitie</option>
              <option value="link">Link</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Titel</label>
            <input v-model="newSource.title" class="input" placeholder="bijv. Kickoff meeting transcript" />
          </div>
          <div v-if="newSource.type === 'link'">
            <label class="block text-xs font-medium text-gray-600 mb-1">URL</label>
            <input v-model="newSource.url" class="input" placeholder="https://..." />
          </div>
          <div v-else>
            <label class="block text-xs font-medium text-gray-600 mb-1">Inhoud (plak transcript of notitie)</label>
            <textarea v-model="newSource.contentText" class="textarea font-mono text-xs" rows="8" placeholder="Plak hier de tekst..." />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Tags (komma-gescheiden)</label>
            <input v-model="newSource.tagsInput" class="input" placeholder="bijv. kickoff, interview, SEO" />
          </div>
        </div>
        <div class="flex gap-3 mt-6">
          <button class="btn-primary" @click="createSource" :disabled="!newSource.title">Toevoegen</button>
          <button class="btn-secondary" @click="showNew = false">Annuleren</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { useProjectStore } from '../../stores/projectStore'
import type { Source, SourceType } from '@shared/types'

const store = useProjectStore()
const selectedSource = ref<Source | null>(null)
const showNew = ref(false)
const newTag = ref('')
const linkPageId = ref('')
const mockSummary = ref('')

const newSource = reactive({
  type: 'transcript' as SourceType,
  title: '',
  contentText: '',
  url: '',
  tagsInput: '',
})

const availablePages = computed(() => {
  if (!selectedSource.value) return store.pages
  return store.pages.filter(p => !selectedSource.value!.relatedPageIds.includes(p.id))
})

function sourceIcon(type: SourceType): string {
  const icons: Record<SourceType, string> = { transcript: '🎙️', note: '📝', link: '🔗', file: '📎' }
  return icons[type] || '📄'
}

function pageName(pid: string): string {
  return store.pages.find(p => p.id === pid)?.title || 'Onbekend'
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })
}

function selectSource(source: Source) {
  selectedSource.value = source
  mockSummary.value = ''
}

async function addTag() {
  if (!newTag.value.trim() || !selectedSource.value) return
  const tags = [...selectedSource.value.tags, newTag.value.trim()]
  await store.updateSource(store.currentProject!.id, selectedSource.value.id, { tags })
  selectedSource.value.tags = tags
  newTag.value = ''
}

async function removeTag(tag: string) {
  if (!selectedSource.value) return
  const tags = selectedSource.value.tags.filter(t => t !== tag)
  await store.updateSource(store.currentProject!.id, selectedSource.value.id, { tags })
  selectedSource.value.tags = tags
}

async function linkPage() {
  if (!linkPageId.value || !selectedSource.value) return
  const relatedPageIds = [...selectedSource.value.relatedPageIds, linkPageId.value]
  await store.updateSource(store.currentProject!.id, selectedSource.value.id, { relatedPageIds })
  selectedSource.value.relatedPageIds = relatedPageIds
  linkPageId.value = ''
}

async function unlinkPage(pid: string) {
  if (!selectedSource.value) return
  const relatedPageIds = selectedSource.value.relatedPageIds.filter(id => id !== pid)
  await store.updateSource(store.currentProject!.id, selectedSource.value.id, { relatedPageIds })
  selectedSource.value.relatedPageIds = relatedPageIds
}

function generateSummary() {
  if (!selectedSource.value) return
  const text = selectedSource.value.contentText
  if (!text) {
    mockSummary.value = 'Geen inhoud om samen te vatten.'
    return
  }
  // Simpele mock: pak eerste 2-3 zinnen + keywords
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20)
  const summary = sentences.slice(0, 3).map(s => s.trim()).join('. ') + '.'
  const words = text.toLowerCase().split(/\s+/)
  const freq: Record<string, number> = {}
  const stopWords = new Set(['de', 'het', 'een', 'en', 'van', 'in', 'is', 'op', 'met', 'voor', 'aan', 'dat', 'die', 'er', 'als', 'zijn', 'wordt', 'naar', 'bij', 'ook', 'om', 'uit', 'kan', 'niet', 'maar', 'over', 'dan', 'nog', 'al', 'wel', 'dit', 'was', 'ze', 'we', 'hun', 'meer', 'heeft', 'hebben'])
  for (const w of words) {
    const clean = w.replace(/[^a-z]/g, '')
    if (clean.length > 3 && !stopWords.has(clean)) {
      freq[clean] = (freq[clean] || 0) + 1
    }
  }
  const topKeywords = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 5).map(e => e[0])
  mockSummary.value = `${summary}\n\nBelangrijkste onderwerpen: ${topKeywords.join(', ')}.`
}

async function createSource() {
  if (!newSource.title || !store.currentProject) return
  await store.createSource(store.currentProject.id, {
    type: newSource.type,
    title: newSource.title,
    contentText: newSource.contentText,
    url: newSource.url,
    tags: newSource.tagsInput.split(',').map(s => s.trim()).filter(Boolean),
    relatedPageIds: [],
  })
  newSource.title = ''
  newSource.contentText = ''
  newSource.url = ''
  newSource.tagsInput = ''
  showNew.value = false
}
</script>
