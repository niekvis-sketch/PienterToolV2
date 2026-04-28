<template>
  <div class="card p-5">
    <div class="flex items-center justify-between mb-4">
      <h3 class="font-semibold text-gray-800">Huisstijlbestanden</h3>
      <label class="btn-secondary btn-sm cursor-pointer">
        + Bestand uploaden
        <input type="file" class="hidden" @change="onFileSelected" />
      </label>
    </div>

    <div v-if="uploading" class="text-sm text-gray-500 mb-2">Bezig met uploaden…</div>
    <div v-if="error" class="text-sm text-red-600 mb-2">{{ error }}</div>

    <div v-if="store.huisstijl.length === 0 && !uploading" class="text-sm text-gray-500">
      Nog geen bestanden. Upload logo, brandbook, kleurenpalet of fonts.
    </div>

    <div v-else-if="store.huisstijl.length > 0" class="space-y-2">
      <div
        v-for="bestand in store.huisstijl"
        :key="bestand.id"
        class="border border-gray-200 rounded-lg p-3 flex items-center justify-between gap-3"
      >
        <div class="flex items-center gap-3 min-w-0 flex-1">
          <span class="text-2xl shrink-0">{{ fileIcon(bestand.mimeType) }}</span>
          <div class="min-w-0 flex-1">
            <a
              :href="fileUrl(bestand.filePath)"
              target="_blank"
              rel="noopener noreferrer"
              class="font-medium text-gray-900 hover:text-pienter-600 truncate block"
            >{{ bestand.bestandsnaam }}</a>
            <div class="text-xs text-gray-500 mt-0.5">
              {{ formatSize(bestand.grootte) }} · {{ formatDate(bestand.createdAt) }}
            </div>
            <input
              v-if="editingId === bestand.id"
              v-model="editBeschrijving"
              class="input mt-2 text-sm"
              placeholder="Beschrijving"
              @keyup.enter="saveBeschrijving(bestand.id)"
            />
            <p v-else-if="bestand.beschrijving" class="text-xs text-gray-600 mt-1">{{ bestand.beschrijving }}</p>
          </div>
        </div>
        <div class="flex gap-1 shrink-0">
          <button v-if="editingId === bestand.id" class="text-pienter-600 text-xs px-2" @click="saveBeschrijving(bestand.id)">Opslaan</button>
          <button v-else class="text-gray-400 hover:text-pienter-600 text-xs px-2" @click="startEditDescription(bestand.id, bestand.beschrijving)">Beschrijving</button>
          <button class="text-gray-300 hover:text-red-500 text-xs px-2" @click="handleDelete(bestand.id)">✕</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useKlantenStore } from '../../stores/klantenStore'

const store = useKlantenStore()
const klant = computed(() => store.currentKlant!)

const uploading = ref(false)
const error = ref('')
const editingId = ref<string | null>(null)
const editBeschrijving = ref('')

async function onFileSelected(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  uploading.value = true
  error.value = ''
  try {
    await store.uploadHuisstijl(klant.value.id, file)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Upload mislukt'
  } finally {
    uploading.value = false
    input.value = ''
  }
}

function startEditDescription(id: string, current: string) {
  editingId.value = id
  editBeschrijving.value = current
}

async function saveBeschrijving(id: string) {
  await store.updateHuisstijl(klant.value.id, id, { beschrijving: editBeschrijving.value })
  editingId.value = null
}

async function handleDelete(id: string) {
  if (confirm('Bestand verwijderen?')) {
    await store.deleteHuisstijl(klant.value.id, id)
  }
}

function fileUrl(filePath: string): string {
  return `/api/${filePath}`
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })
}

function fileIcon(mime: string): string {
  if (mime.startsWith('image/')) return '🖼️'
  if (mime === 'application/pdf') return '📄'
  if (mime.includes('zip') || mime.includes('compressed')) return '🗜️'
  if (mime.includes('font') || mime.includes('ttf') || mime.includes('otf') || mime.includes('woff')) return '🔤'
  return '📎'
}
</script>
