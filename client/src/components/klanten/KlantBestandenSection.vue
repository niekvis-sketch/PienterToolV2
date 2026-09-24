<template>
  <div class="card p-5">
    <div class="flex items-center justify-between gap-3 mb-4 flex-wrap">
      <h3 class="font-semibold text-gray-800">Bestanden &amp; documenten</h3>
      <div class="flex items-center gap-2">
        <select v-model="uploadCategorie" class="select !w-auto" title="Categorie voor nieuwe uploads">
          <option v-for="c in CATEGORIEEN" :key="c.key" :value="c.key">{{ c.label }}</option>
        </select>
        <label class="btn-secondary btn-sm cursor-pointer">
          + Bestanden uploaden
          <input type="file" multiple class="hidden" @change="onFilesSelected" />
        </label>
      </div>
    </div>

    <div
      class="border-2 border-dashed rounded-lg p-4 text-center text-sm transition-colors mb-4"
      :class="dragOver ? 'border-pienter-500 bg-pienter-50 text-pienter-700' : 'border-gray-200 text-gray-500'"
      @dragover.prevent="dragOver = true"
      @dragleave.prevent="dragOver = false"
      @drop.prevent="onDrop"
    >
      <span v-if="uploading">Bezig met uploaden…</span>
      <span v-else>
        Sleep bestanden hierheen — PDF, Word, Excel, PowerPoint, afbeeldingen, video, zip, …
        <span class="block text-xs text-gray-400 mt-1">Max. 50 MB per bestand, 20 bestanden tegelijk</span>
      </span>
    </div>

    <div v-if="error" class="text-sm text-red-600 mb-2">{{ error }}</div>

    <div v-if="store.bestanden.length > 0" class="flex gap-1 flex-wrap mb-3">
      <button
        v-for="f in filters"
        :key="f.key"
        class="text-xs px-2.5 py-1 rounded-full border"
        :class="filter === f.key ? 'border-pienter-500 bg-pienter-50 text-pienter-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'"
        @click="filter = f.key"
      >{{ f.label }} <span class="text-gray-400">{{ f.count }}</span></button>
    </div>

    <div v-if="store.bestanden.length === 0 && !uploading" class="text-sm text-gray-500">
      Nog geen bestanden. Upload contracten, offertes, briefings, rapportages of ander materiaal.
    </div>

    <div v-else class="space-y-2">
      <div
        v-for="bestand in zichtbaar"
        :key="bestand.id"
        class="border border-gray-200 rounded-lg p-3 flex items-center justify-between gap-3"
      >
        <div class="flex items-center gap-3 min-w-0 flex-1">
          <img
            v-if="isAfbeelding(bestand.mimeType)"
            :src="fileUrl(bestand.filePath)"
            :alt="bestand.bestandsnaam"
            class="w-10 h-10 rounded object-cover shrink-0 bg-gray-100"
          />
          <span v-else class="w-10 text-2xl text-center shrink-0">{{ fileIcon(bestand) }}</span>
          <div class="min-w-0 flex-1">
            <a
              :href="fileUrl(bestand.filePath)"
              target="_blank"
              rel="noopener noreferrer"
              class="font-medium text-gray-900 hover:text-pienter-600 truncate block"
            >{{ bestand.bestandsnaam }}</a>
            <div class="text-xs text-gray-500 mt-0.5">
              {{ extensie(bestand.bestandsnaam).toUpperCase() || 'Bestand' }} · {{ formatSize(bestand.grootte) }} · {{ formatDate(bestand.createdAt) }}
            </div>
            <div v-if="editingId === bestand.id" class="flex gap-2 mt-2">
              <select v-model="editCategorie" class="select text-sm !w-40 shrink-0">
                <option v-for="c in CATEGORIEEN" :key="c.key" :value="c.key">{{ c.label }}</option>
              </select>
              <input
                v-model="editBeschrijving"
                class="input text-sm flex-1 min-w-0"
                placeholder="Beschrijving"
                @keyup.enter="saveEdit(bestand.id)"
              />
            </div>
            <p v-else-if="bestand.beschrijving" class="text-xs text-gray-600 mt-1">{{ bestand.beschrijving }}</p>
          </div>
        </div>
        <div class="flex items-center gap-1 shrink-0">
          <span v-if="editingId !== bestand.id" class="badge badge-todo">{{ categorieLabel(bestand.categorie) }}</span>
          <button v-if="editingId === bestand.id" class="text-pienter-600 text-xs px-2" @click="saveEdit(bestand.id)">Opslaan</button>
          <button v-else class="text-gray-400 hover:text-pienter-600 text-xs px-2" @click="startEdit(bestand)">Bewerken</button>
          <a
            :href="fileUrl(bestand.filePath)"
            :download="bestand.bestandsnaam"
            class="text-gray-400 hover:text-pienter-600 text-xs px-2"
            title="Downloaden"
          >⬇</a>
          <button class="text-gray-300 hover:text-red-500 text-xs px-2" @click="handleDelete(bestand.id)">✕</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useKlantenStore } from '../../stores/klantenStore'
import type { KlantBestand, KlantBestandCategorie } from '@shared/types'

const CATEGORIEEN: { key: KlantBestandCategorie; label: string }[] = [
  { key: 'contract', label: 'Contract' },
  { key: 'offerte', label: 'Offerte' },
  { key: 'briefing', label: 'Briefing' },
  { key: 'rapportage', label: 'Rapportage' },
  { key: 'beeldmateriaal', label: 'Beeldmateriaal' },
  { key: 'overig', label: 'Overig' },
]

const store = useKlantenStore()
const klant = computed(() => store.currentKlant!)

const uploading = ref(false)
const error = ref('')
const dragOver = ref(false)
const uploadCategorie = ref<KlantBestandCategorie>('overig')
const filter = ref<KlantBestandCategorie | 'alle'>('alle')
const editingId = ref<string | null>(null)
const editBeschrijving = ref('')
const editCategorie = ref<KlantBestandCategorie>('overig')

// Alleen categorieën tonen die daadwerkelijk bestanden bevatten
const filters = computed(() => [
  { key: 'alle' as const, label: 'Alle', count: store.bestanden.length },
  ...CATEGORIEEN
    .map(c => ({ ...c, count: store.bestanden.filter(b => b.categorie === c.key).length }))
    .filter(c => c.count > 0),
])

const zichtbaar = computed(() =>
  filter.value === 'alle' ? store.bestanden : store.bestanden.filter(b => b.categorie === filter.value)
)

async function upload(files: File[]) {
  if (files.length === 0) return
  uploading.value = true
  error.value = ''
  try {
    await store.uploadBestanden(klant.value.id, files, uploadCategorie.value)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Upload mislukt'
  } finally {
    uploading.value = false
  }
}

async function onFilesSelected(e: Event) {
  const input = e.target as HTMLInputElement
  await upload(Array.from(input.files ?? []))
  input.value = ''
}

function onDrop(e: DragEvent) {
  dragOver.value = false
  upload(Array.from(e.dataTransfer?.files ?? []))
}

function startEdit(b: KlantBestand) {
  editingId.value = b.id
  editBeschrijving.value = b.beschrijving
  editCategorie.value = b.categorie
}

async function saveEdit(id: string) {
  await store.updateBestand(klant.value.id, id, {
    beschrijving: editBeschrijving.value,
    categorie: editCategorie.value,
  })
  editingId.value = null
}

async function handleDelete(id: string) {
  if (confirm('Bestand verwijderen?')) {
    await store.deleteBestand(klant.value.id, id)
  }
}

function categorieLabel(key: KlantBestandCategorie): string {
  return CATEGORIEEN.find(c => c.key === key)?.label ?? 'Overig'
}

function fileUrl(filePath: string): string {
  return `/api/${filePath}`
}

function extensie(naam: string): string {
  const i = naam.lastIndexOf('.')
  return i > 0 ? naam.slice(i + 1).toLowerCase() : ''
}

function isAfbeelding(mime: string): boolean {
  return mime.startsWith('image/')
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })
}

// Op extensie én mimetype, want browsers geven Office-bestanden soms als octet-stream door
function fileIcon(b: KlantBestand): string {
  const ext = extensie(b.bestandsnaam)
  const mime = b.mimeType
  if (mime === 'application/pdf' || ext === 'pdf') return '📕'
  if (['doc', 'docx', 'odt', 'rtf', 'pages'].includes(ext)) return '📘'
  if (['xls', 'xlsx', 'ods', 'csv', 'numbers'].includes(ext)) return '📗'
  if (['ppt', 'pptx', 'odp', 'key'].includes(ext)) return '📙'
  if (mime.startsWith('video/')) return '🎬'
  if (mime.startsWith('audio/')) return '🎵'
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext) || mime.includes('zip')) return '🗜️'
  if (['ttf', 'otf', 'woff', 'woff2'].includes(ext)) return '🔤'
  if (['psd', 'ai', 'indd', 'fig', 'sketch', 'eps'].includes(ext)) return '🎨'
  if (mime.startsWith('text/') || ['txt', 'md'].includes(ext)) return '📝'
  if (['eml', 'msg'].includes(ext)) return '✉️'
  return '📎'
}
</script>
