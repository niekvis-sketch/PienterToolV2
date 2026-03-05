<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-xl font-bold text-gray-900 mb-1">Media Hub</h2>
        <p class="text-sm text-gray-500">Centraal overzicht van alle beeldmateriaal met naamgeving- en alt-tekst suggesties</p>
      </div>
      <div class="flex gap-2">
        <button class="btn-secondary btn-sm" @click="scrapeMock">🔍 Scrape bestaande bronnen (simulatie)</button>
        <button class="btn-primary btn-sm" @click="showUpload = true">Upload toevoegen</button>
      </div>
    </div>

    <!-- Lege staat -->
    <div v-if="store.media.length === 0" class="empty-state card p-12">
      <div class="text-4xl mb-4">🖼️</div>
      <h3 class="text-lg font-semibold text-gray-700">Nog geen media</h3>
      <p>Upload afbeeldingen of gebruik de scrape-simulatie om bestaande bronnen te inventariseren.</p>
    </div>

    <!-- Media grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="item in store.media" :key="item.id" class="card p-4">
        <!-- Placeholder thumbnail -->
        <div class="bg-gray-100 rounded-lg h-32 flex items-center justify-center mb-3">
          <div class="text-center">
            <div class="text-2xl mb-1">{{ item.type === 'logo' ? '🏷️' : item.type === 'hero' ? '🏞️' : item.type === 'card' ? '🃏' : '📷' }}</div>
            <div class="text-[10px] text-gray-400">{{ item.dimensions.width }}×{{ item.dimensions.height }}</div>
          </div>
        </div>

        <!-- Info -->
        <div class="space-y-2">
          <div>
            <div class="text-[10px] text-gray-400 uppercase tracking-wide">Origineel</div>
            <div class="text-xs text-gray-500 font-mono truncate">{{ item.originalName }}</div>
          </div>
          <div>
            <div class="text-[10px] text-gray-400 uppercase tracking-wide">Voorgestelde naam</div>
            <div class="text-xs text-pienter-700 font-mono font-medium truncate">{{ item.newName }}</div>
          </div>
          <div>
            <div class="text-[10px] text-gray-400 uppercase tracking-wide">Alt-tekst suggestie</div>
            <div class="text-xs text-gray-700">{{ item.altTextSuggestion || '(geen)' }}</div>
          </div>
          <div class="flex items-center justify-between">
            <div class="flex gap-2">
              <span class="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{{ item.sizeKb }}KB</span>
              <span class="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{{ item.type }}</span>
              <span v-if="item.sizeKb > 500" class="text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded">⚠️ Groot</span>
            </div>
            <span class="text-[10px] text-gray-400">{{ item.sourceLabel }}</span>
          </div>
          <div>
            <div class="text-[10px] text-gray-400 uppercase tracking-wide">Aanbevolen afmeting</div>
            <div class="text-xs text-gray-600">{{ recommendedSize(item.type) }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Upload modal -->
    <div v-if="showUpload" class="fixed inset-0 bg-black/30 flex items-center justify-center z-50" @click.self="showUpload = false">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
        <h3 class="text-lg font-bold mb-4">Media toevoegen (simulatie)</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Originele bestandsnaam</label>
            <input v-model="upload.originalName" class="input" placeholder="bijv. IMG_1234.jpg" />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Type</label>
              <select v-model="upload.type" class="select">
                <option value="hero">Hero</option>
                <option value="card">Card</option>
                <option value="logo">Logo</option>
                <option value="general">Algemeen</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Gekoppelde pagina</label>
              <select v-model="upload.relatedPageId" class="select">
                <option value="">Geen</option>
                <option v-for="p in store.pages" :key="p.id" :value="p.id">{{ p.title }}</option>
              </select>
            </div>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Geschatte grootte (KB)</label>
            <input v-model.number="upload.sizeKb" type="number" class="input" />
          </div>

          <!-- Auto-genereerde suggesties -->
          <div v-if="upload.originalName" class="bg-pienter-50 border border-pienter-200 rounded-lg p-3">
            <div class="text-xs font-medium text-pienter-700 mb-2">✨ Automatische suggesties</div>
            <div class="space-y-1">
              <div class="text-xs"><span class="text-gray-500">Nieuwe naam:</span> <span class="font-mono text-pienter-800">{{ suggestedName }}</span></div>
              <div class="text-xs"><span class="text-gray-500">Alt-tekst:</span> {{ suggestedAlt }}</div>
              <div class="text-xs"><span class="text-gray-500">Aanbevolen formaat:</span> {{ recommendedSize(upload.type) }}</div>
            </div>
          </div>
        </div>
        <div class="flex gap-3 mt-6">
          <button class="btn-primary" @click="handleUpload" :disabled="!upload.originalName">Toevoegen</button>
          <button class="btn-secondary" @click="showUpload = false">Annuleren</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useProjectStore } from '../../stores/projectStore'
import type { MediaItem } from '@shared/types'

const store = useProjectStore()
const showUpload = ref(false)

const upload = reactive({
  originalName: '',
  type: 'general' as MediaItem['type'],
  relatedPageId: '',
  sizeKb: 400,
})

const suggestedName = computed(() => {
  if (!upload.originalName) return ''
  const page = store.pages.find(p => p.id === upload.relatedPageId)
  const slug = page ? page.slug || 'home' : 'afbeelding'
  const ext = upload.originalName.split('.').pop() || 'jpg'
  return `${upload.type}-${slug}.${ext}`
})

const suggestedAlt = computed(() => {
  const page = store.pages.find(p => p.id === upload.relatedPageId)
  if (page) return `${page.title} – ${store.currentProject?.name || 'afbeelding'}`
  return `Afbeelding voor ${store.currentProject?.name || 'project'}`
})

function recommendedSize(type: string): string {
  const sizes: Record<string, string> = {
    hero: '1920×1080px, max 400KB, WebP',
    card: '800×600px, max 200KB, WebP',
    logo: '400×120px, max 50KB, SVG/PNG',
    general: '1200×800px, max 300KB, WebP',
  }
  return sizes[type] || '1200×800px'
}

async function handleUpload() {
  if (!upload.originalName || !store.currentProject) return
  await store.createMedia(store.currentProject.id, {
    originalName: upload.originalName,
    newName: suggestedName.value,
    sizeKb: upload.sizeKb,
    dimensions: { width: 1200, height: 800 },
    altTextSuggestion: suggestedAlt.value,
    relatedPageId: upload.relatedPageId || null,
    source: 'upload',
    sourceLabel: 'Upload',
    type: upload.type,
  })
  upload.originalName = ''
  upload.sizeKb = 400
  showUpload.value = false
}

async function scrapeMock() {
  if (!store.currentProject) return
  await store.scrapeMockMedia(store.currentProject.id)
}
</script>
