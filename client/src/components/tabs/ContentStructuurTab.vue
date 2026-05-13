<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-xl font-bold text-gray-900">Content Structuur</h1>
        <p class="text-sm text-gray-500 mt-1">Beheer de content status van alle pagina's in een spreadsheet overzicht.</p>
      </div>
      <div class="flex items-center gap-2">
        <button @click="loadStructuur" class="text-sm px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Structuur inladen</button>
        <!-- Preset selector -->
        <select
          v-model="activePresetId"
          class="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white"
        >
          <option value="">Alle kolommen</option>
          <option v-for="p in store.presets" :key="p.id" :value="p.id">{{ p.name }}</option>
        </select>
        <button @click="showPresetModal = true" class="text-sm px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50" title="Presets beheren">⚙️ Presets</button>
        <button @click="exportCsv" class="text-sm px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">📤 Export CSV</button>
        <label class="text-sm px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
          📥 Import CSV
          <input type="file" accept=".csv" class="hidden" @change="handleCsvImport" />
        </label>
        <button @click="addRow" class="text-sm px-4 py-2 bg-pienter-600 text-white rounded-lg hover:bg-pienter-700">+ Rij toevoegen</button>
      </div>
    </div>

    <!-- Spreadsheet tabel -->
    <div class="bg-white rounded-xl border border-gray-200 overflow-x-auto">
      <div v-if="syncMessage" class="px-4 py-3 text-sm text-green-700 bg-green-50 border-b border-green-100">
        {{ syncMessage }}
      </div>
      <table class="w-full text-sm">
        <thead>
          <tr class="bg-gray-50 border-b border-gray-200">
            <th class="px-2 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-8">#</th>
            <th
              v-for="col in visibleColumns"
              :key="col.key"
              class="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap"
              :class="col.width"
            >
              {{ col.label }}
            </th>
            <th class="px-2 py-3 w-10"></th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(row, index) in store.rows"
            :key="row.id"
            class="border-b border-gray-100 hover:bg-gray-50/50 group"
          >
            <td class="px-2 py-1 text-xs text-gray-400">{{ index + 1 }}</td>

            <!-- Naam pagina -->
            <td v-if="isVisible('naamPagina')" class="px-1 py-1">
              <input
                v-model="row.naamPagina"
                @blur="saveRow(row)"
                class="w-full px-2 py-1.5 text-sm border-0 bg-transparent hover:bg-gray-50 focus:bg-white focus:ring-1 focus:ring-pienter-500 rounded"
                placeholder="Paginanaam..."
              />
            </td>

            <!-- Zoektermen -->
            <td v-if="isVisible('zoektermen')" class="px-1 py-1">
              <input
                v-model="row.zoektermen"
                @blur="saveRow(row)"
                class="w-full px-2 py-1.5 text-sm border-0 bg-transparent hover:bg-gray-50 focus:bg-white focus:ring-1 focus:ring-pienter-500 rounded"
                placeholder="Zoektermen..."
              />
            </td>

            <!-- Tekst klaar -->
            <td v-if="isVisible('tekstKlaar')" class="px-1 py-1 text-center">
              <input
                type="checkbox"
                v-model="row.tekstKlaar"
                @change="saveRow(row)"
                class="w-4 h-4 text-pienter-600 rounded border-gray-300 focus:ring-pienter-500"
              />
            </td>

            <!-- Wie plaatst -->
            <td v-if="isVisible('wiePlaatst')" class="px-1 py-1">
              <div class="flex items-center gap-1">
                <MedewerkerSelect
                  v-model="row.wiePlaatstId"
                  :allow-null="true"
                  placeholder="— Geen —"
                  @update:model-value="saveRow(row)"
                />
                <span
                  v-if="row.wiePlaatstLegacy"
                  class="text-[10px] text-amber-600 italic truncate"
                  :title="`Oud: ${row.wiePlaatstLegacy}`"
                >({{ row.wiePlaatstLegacy }})</span>
              </div>
            </td>

            <!-- Status -->
            <td v-if="isVisible('status')" class="px-1 py-1">
              <select
                v-model="row.status"
                @change="saveRow(row)"
                class="w-full px-2 py-1.5 text-sm border-0 bg-transparent hover:bg-gray-50 focus:bg-white focus:ring-1 focus:ring-pienter-500 rounded"
              >
                <option value="niet-gestart">Niet gestart</option>
                <option value="in-progress">In progress</option>
                <option value="klaar">Klaar</option>
                <option value="review">Review</option>
              </select>
            </td>

            <!-- Wat mist nog -->
            <td v-if="isVisible('watMistNog')" class="px-1 py-1">
              <input
                v-model="row.watMistNog"
                @blur="saveRow(row)"
                class="w-full px-2 py-1.5 text-sm border-0 bg-transparent hover:bg-gray-50 focus:bg-white focus:ring-1 focus:ring-pienter-500 rounded"
                placeholder="Wat mist..."
              />
            </td>

            <!-- Nieuwe URL -->
            <td v-if="isVisible('nieuweUrl')" class="px-1 py-1">
              <input
                v-model="row.nieuweUrl"
                @blur="saveRow(row)"
                class="w-full px-2 py-1.5 text-sm border-0 bg-transparent hover:bg-gray-50 focus:bg-white focus:ring-1 focus:ring-pienter-500 rounded"
                placeholder="/nieuwe-url"
              />
            </td>

            <!-- Slug -->
            <td v-if="isVisible('slug')" class="px-1 py-1">
              <input
                v-model="row.slug"
                @blur="saveRow(row)"
                class="w-full px-2 py-1.5 text-sm border-0 bg-transparent hover:bg-gray-50 focus:bg-white focus:ring-1 focus:ring-pienter-500 rounded font-mono text-xs"
                placeholder="slug"
              />
            </td>

            <!-- Meta titel -->
            <td v-if="isVisible('metaTitel')" class="px-1 py-1">
              <input
                v-model="row.metaTitel"
                @blur="saveRow(row)"
                class="w-full px-2 py-1.5 text-sm border-0 bg-transparent hover:bg-gray-50 focus:bg-white focus:ring-1 focus:ring-pienter-500 rounded"
                placeholder="Meta titel..."
              />
            </td>

            <!-- Meta description -->
            <td v-if="isVisible('metaDescription')" class="px-1 py-1">
              <input
                v-model="row.metaDescription"
                @blur="saveRow(row)"
                class="w-full px-2 py-1.5 text-sm border-0 bg-transparent hover:bg-gray-50 focus:bg-white focus:ring-1 focus:ring-pienter-500 rounded"
                placeholder="Meta description..."
              />
            </td>

            <!-- Verwijder -->
            <td class="px-2 py-1">
              <button
                @click="removeRow(row.id)"
                class="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all"
                title="Verwijder rij"
              >✕</button>
            </td>
          </tr>

          <!-- Lege state -->
          <tr v-if="store.rows.length === 0">
            <td :colspan="visibleColumns.length + 2" class="text-center py-12 text-gray-400">
              Nog geen rijen. Klik op "+ Rij toevoegen" of importeer een CSV bestand.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Preset Modal -->
    <div v-if="showPresetModal" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50" @click.self="showPresetModal = false">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-bold text-gray-900">Presets beheren</h2>
          <button @click="showPresetModal = false" class="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <!-- Bestaande presets -->
        <div class="space-y-3 mb-6">
          <div v-if="store.presets.length === 0" class="text-sm text-gray-400 text-center py-4">Nog geen presets aangemaakt.</div>
          <div v-for="preset in store.presets" :key="preset.id" class="border border-gray-200 rounded-lg p-3">
            <div class="flex items-center justify-between mb-2">
              <input
                v-model="preset.name"
                @blur="savePreset(preset)"
                class="font-medium text-sm border-0 bg-transparent focus:ring-1 focus:ring-pienter-500 rounded px-1"
              />
              <button @click="removePreset(preset.id)" class="text-xs text-red-500 hover:text-red-700">Verwijderen</button>
            </div>
            <div class="flex flex-wrap gap-2">
              <label
                v-for="col in allColumns"
                :key="col.key"
                class="flex items-center gap-1 text-xs cursor-pointer"
              >
                <input
                  type="checkbox"
                  :checked="preset.visibleColumns.includes(col.key)"
                  @change="togglePresetColumn(preset, col.key)"
                  class="w-3 h-3 text-pienter-600 rounded border-gray-300"
                />
                {{ col.label }}
              </label>
            </div>
          </div>
        </div>

        <!-- Nieuwe preset -->
        <div class="border-t border-gray-100 pt-4">
          <h3 class="text-sm font-semibold text-gray-700 mb-2">Nieuw preset</h3>
          <div class="flex gap-2">
            <input
              v-model="newPresetName"
              class="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-2"
              placeholder="Preset naam, bijv. SEO"
              @keyup.enter="addPreset"
            />
            <button @click="addPreset" class="text-sm px-4 py-2 bg-pienter-600 text-white rounded-lg hover:bg-pienter-700">Toevoegen</button>
          </div>
          <div class="flex flex-wrap gap-2 mt-3">
            <label
              v-for="col in allColumns"
              :key="col.key"
              class="flex items-center gap-1 text-xs cursor-pointer"
            >
              <input
                type="checkbox"
                v-model="newPresetColumns"
                :value="col.key"
                class="w-3 h-3 text-pienter-600 rounded border-gray-300"
              />
              {{ col.label }}
            </label>
          </div>
        </div>
      </div>
    </div>

    <!-- CSV Import modal -->
    <div v-if="showImportModal" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50" @click.self="showImportModal = false">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <h2 class="text-lg font-bold text-gray-900 mb-4">CSV Importeren</h2>
        <p class="text-sm text-gray-600 mb-4">{{ importRows.length }} rijen gevonden in het bestand.</p>
        <label class="flex items-center gap-2 text-sm mb-4">
          <input type="checkbox" v-model="importReplace" class="w-4 h-4 text-pienter-600 rounded border-gray-300" />
          Bestaande rijen vervangen
        </label>
        <div class="flex gap-2 justify-end">
          <button @click="showImportModal = false" class="text-sm px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Annuleren</button>
          <button @click="confirmImport" class="text-sm px-4 py-2 bg-pienter-600 text-white rounded-lg hover:bg-pienter-700">Importeren</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useContentStructuurStore } from '../../stores/contentStructuurStore'
import type { ContentStructuurRow, ContentStructuurPreset } from '@shared/types'
import MedewerkerSelect from '../medewerkers/MedewerkerSelect.vue'

const route = useRoute()
const projectId = computed(() => route.params.id as string)
const store = useContentStructuurStore()

// Column definitions
const allColumns = [
  { key: 'naamPagina', label: 'Naam pagina', width: 'min-w-[160px]' },
  { key: 'zoektermen', label: 'Te benutten zoektermen', width: 'min-w-[180px]' },
  { key: 'tekstKlaar', label: 'Tekst klaar', width: 'min-w-[80px]' },
  { key: 'wiePlaatst', label: 'Wie plaatst op site', width: 'min-w-[140px]' },
  { key: 'status', label: 'Status', width: 'min-w-[130px]' },
  { key: 'watMistNog', label: 'Wat mist nog', width: 'min-w-[160px]' },
  { key: 'nieuweUrl', label: 'Nieuwe URL', width: 'min-w-[160px]' },
  { key: 'slug', label: 'Slug', width: 'min-w-[120px]' },
  { key: 'metaTitel', label: 'Meta titel', width: 'min-w-[180px]' },
  { key: 'metaDescription', label: 'Meta description', width: 'min-w-[220px]' },
]

// Preset state
const activePresetId = ref('')
const showPresetModal = ref(false)
const newPresetName = ref('')
const newPresetColumns = ref<string[]>([])

// Import state
const showImportModal = ref(false)
const importRows = ref<Partial<ContentStructuurRow>[]>([])
const importReplace = ref(false)
const syncMessage = ref('')

const visibleColumns = computed(() => {
  if (!activePresetId.value) return allColumns
  const preset = store.presets.find(p => p.id === activePresetId.value)
  if (!preset) return allColumns
  return allColumns.filter(c => preset.visibleColumns.includes(c.key))
})

function isVisible(key: string): boolean {
  return visibleColumns.value.some(c => c.key === key)
}

// ---- Row CRUD ----
async function addRow() {
  await store.createRow(projectId.value, { naamPagina: '' })
}

async function loadStructuur() {
  const result = await store.syncFromStructuur(projectId.value)
  syncMessage.value = `${result.created} toegevoegd, ${result.updated} bijgewerkt vanuit de structuur.`
  window.setTimeout(() => {
    if (syncMessage.value) syncMessage.value = ''
  }, 3000)
}

let saveTimeout: ReturnType<typeof setTimeout> | null = null
function saveRow(row: ContentStructuurRow) {
  if (saveTimeout) clearTimeout(saveTimeout)
  saveTimeout = setTimeout(() => {
    store.updateRow(projectId.value, row.id, { ...row })
  }, 300)
}

async function removeRow(rowId: string) {
  await store.deleteRow(projectId.value, rowId)
}

// ---- Presets ----
async function addPreset() {
  if (!newPresetName.value.trim()) return
  await store.createPreset(projectId.value, {
    name: newPresetName.value.trim(),
    visibleColumns: newPresetColumns.value.length > 0 ? [...newPresetColumns.value] : allColumns.map(c => c.key),
  })
  newPresetName.value = ''
  newPresetColumns.value = []
}

async function savePreset(preset: ContentStructuurPreset) {
  await store.updatePreset(projectId.value, preset.id, { name: preset.name, visibleColumns: preset.visibleColumns })
}

function togglePresetColumn(preset: ContentStructuurPreset, key: string) {
  const idx = preset.visibleColumns.indexOf(key)
  if (idx >= 0) {
    preset.visibleColumns.splice(idx, 1)
  } else {
    preset.visibleColumns.push(key)
  }
  savePreset(preset)
}

async function removePreset(presetId: string) {
  if (activePresetId.value === presetId) activePresetId.value = ''
  await store.deletePreset(projectId.value, presetId)
}

// ---- CSV Export ----
function exportCsv() {
  const cols = visibleColumns.value
  const header = cols.map(c => c.label)

  const csvRows = store.rows.map(row => {
    return cols.map(col => {
      const val = (row as any)[col.key]
      if (typeof val === 'boolean') return val ? 'Ja' : 'Nee'
      const str = String(val ?? '')
      // Escape CSV: als er komma's, aanhalingstekens of newlines in zitten
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return '"' + str.replace(/"/g, '""') + '"'
      }
      return str
    })
  })

  const csv = [header.join(','), ...csvRows.map(r => r.join(','))].join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `content-structuur-${projectId.value}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ---- CSV Import ----
function handleCsvImport(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    const text = e.target?.result as string
    const parsed = parseCsv(text)
    if (parsed.length > 0) {
      importRows.value = parsed
      showImportModal.value = true
    }
  }
  reader.readAsText(file, 'utf-8')
  // Reset input so same file can be re-imported
  ;(event.target as HTMLInputElement).value = ''
}

function parseCsv(text: string): Partial<ContentStructuurRow>[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim())
  if (lines.length < 2) return []

  const headerLine = lines[0]
  const headers = parseCsvLine(headerLine)

  // Map CSV headers to field keys
  const labelToKey: Record<string, string> = {}
  for (const col of allColumns) {
    labelToKey[col.label.toLowerCase()] = col.key
  }

  const fieldIndices: Array<{ index: number; key: string }> = []
  headers.forEach((h, i) => {
    const key = labelToKey[h.trim().toLowerCase()]
    if (key) fieldIndices.push({ index: i, key })
  })

  const result: Partial<ContentStructuurRow>[] = []
  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i])
    const row: any = {}
    for (const { index, key } of fieldIndices) {
      const val = values[index]?.trim() ?? ''
      if (key === 'tekstKlaar') {
        row[key] = val.toLowerCase() === 'ja' || val === '1' || val.toLowerCase() === 'true'
      } else if (key === 'status') {
        const valid = ['niet-gestart', 'in-progress', 'klaar', 'review']
        row[key] = valid.includes(val) ? val : 'niet-gestart'
      } else {
        row[key] = val
      }
    }
    if (Object.keys(row).length > 0) result.push(row)
  }

  return result
}

function parseCsvLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        current += ch
      }
    } else {
      if (ch === '"') {
        inQuotes = true
      } else if (ch === ',') {
        result.push(current)
        current = ''
      } else {
        current += ch
      }
    }
  }
  result.push(current)
  return result
}

async function confirmImport() {
  await store.bulkImport(projectId.value, importRows.value, importReplace.value)
  showImportModal.value = false
  importRows.value = []
  importReplace.value = false
}

// ---- Init ----
onMounted(async () => {
  await Promise.all([
    store.fetchRows(projectId.value),
    store.fetchPresets(projectId.value),
  ])
  if (store.rows.length === 0) {
    await loadStructuur()
  }
})
</script>
