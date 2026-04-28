<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-lg font-bold text-gray-900">Fase 1 · Klantvragen uit Doelgroepen</h3>
        <p class="text-sm text-gray-500 mt-1">Overzicht van alle vragen uit de doelgroep-analyse. Kopieer ze naar ChatGPT, verrijk ze daar en importeer het resultaat terug.</p>
      </div>
      <div class="flex gap-2">
        <button class="btn-secondary btn-sm" @click="copyAllToClipboard">📋 Kopieer alles</button>
        <button class="btn-primary btn-sm" @click="showBulkImport = true">📥 Bulk importeren</button>
      </div>
    </div>

    <!-- Copy success notification -->
    <div v-if="copySuccess" class="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2 text-sm text-green-700">
      <span>✅</span>
      <span>{{ copySuccess }}</span>
    </div>

    <!-- No doelgroepen warning -->
    <div v-if="projectStore.doelgroepen.length === 0" class="empty-state card p-12">
      <div class="text-4xl mb-4">🎯</div>
      <h3 class="text-lg font-semibold text-gray-700">Nog geen doelgroepen</h3>
      <p>Ga eerst naar de <strong>Doelgroepen</strong>-tab om doelgroepen aan te maken en vragen per journey-fase vast te leggen.</p>
    </div>

    <!-- Spreadsheet view per doelgroep -->
    <template v-for="dg in projectStore.doelgroepen" :key="dg.id">
      <div class="card overflow-hidden" v-if="vragenVoorDoelgroep(dg.id).length > 0">
        <!-- Doelgroep header -->
        <div class="px-5 py-3 bg-pienter-50 border-b border-pienter-100">
          <h4 class="font-bold text-pienter-800">Doelgroep: {{ dg.name }}</h4>
          <p v-if="dg.description" class="text-xs text-pienter-600 mt-0.5">{{ dg.description }}</p>
        </div>

        <!-- Table -->
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-gray-50 border-b border-gray-200">
                <th class="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide w-32">Fase</th>
                <th class="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Vraag</th>
                <th class="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide w-64">Antwoord / meer info</th>
                <th class="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide w-44">Webpagina</th>
                <th class="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide w-56">Opmerkingen / actiepunten</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="fase in fasen" :key="fase.key">
                <!-- Fase section header -->
                <tr v-if="vragenVoorDoelgroepFase(dg.id, fase.key).length > 0" class="border-t-2" :class="fase.borderClass">
                  <td :colspan="5" class="px-4 py-2 font-bold text-sm" :class="fase.headerClass">
                    {{ fase.label }}
                  </td>
                </tr>
                <!-- Vraag rows -->
                <tr
                  v-for="vraag in vragenVoorDoelgroepFase(dg.id, fase.key)"
                  :key="vraag.id"
                  class="border-b border-gray-100 hover:bg-gray-50/50 transition-colors group"
                >
                  <td class="px-4 py-2 text-xs align-top">
                    <span class="inline-block rounded-full px-2 py-0.5 text-[10px] font-medium" :class="fase.badgeClass">{{ fase.shortLabel }}</span>
                  </td>
                  <td class="px-4 py-2 align-top">
                    <EditableCell
                      :value="vraag.text"
                      placeholder="Vraag..."
                      @save="(val: string) => updateVraagField(dg.id, vraag.id, 'text', val)"
                    />
                  </td>
                  <td class="px-4 py-2 align-top">
                    <EditableCell
                      :value="vraag.answer"
                      placeholder="Antwoord invullen..."
                      @save="(val: string) => updateVraagField(dg.id, vraag.id, 'answer', val)"
                    />
                  </td>
                  <td class="px-4 py-2 align-top">
                    <EditableCell
                      :value="vraag.webpagina"
                      placeholder="Webpagina..."
                      @save="(val: string) => updateVraagField(dg.id, vraag.id, 'webpagina', val)"
                    />
                  </td>
                  <td class="px-4 py-2 align-top">
                    <EditableCell
                      :value="vraag.opmerkingen"
                      placeholder="Opmerkingen..."
                      @save="(val: string) => updateVraagField(dg.id, vraag.id, 'opmerkingen', val)"
                    />
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <!-- No questions at all -->
    <div v-if="allVragen.length === 0 && projectStore.doelgroepen.length > 0" class="empty-state card p-12">
      <div class="text-4xl mb-4">📝</div>
      <h3 class="text-lg font-semibold text-gray-700">Nog geen vragen vastgelegd</h3>
      <p>Ga naar de <strong>Doelgroepen</strong>-tab om per doelgroep vragen toe te voegen per journey-fase.</p>
    </div>

    <!-- Stats -->
    <div v-if="allVragen.length > 0" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      <div class="card p-4 text-center">
        <div class="text-2xl font-bold text-gray-900">{{ allVragen.length }}</div>
        <div class="text-xs text-gray-500 mt-1">Totaal vragen</div>
      </div>
      <div class="card p-4 text-center">
        <div class="text-2xl font-bold text-orange-600">{{ vragenPerFase('see') }}</div>
        <div class="text-xs text-gray-500 mt-1">See</div>
      </div>
      <div class="card p-4 text-center">
        <div class="text-2xl font-bold text-yellow-600">{{ vragenPerFase('think') }}</div>
        <div class="text-xs text-gray-500 mt-1">Think</div>
      </div>
      <div class="card p-4 text-center">
        <div class="text-2xl font-bold text-green-600">{{ vragenPerFase('do') }}</div>
        <div class="text-xs text-gray-500 mt-1">Do</div>
      </div>
      <div class="card p-4 text-center">
        <div class="text-2xl font-bold text-cyan-600">{{ vragenPerFase('care') }}</div>
        <div class="text-xs text-gray-500 mt-1">Care</div>
      </div>
    </div>

    <!-- Bulk import modal -->
    <div v-if="showBulkImport" class="fixed inset-0 bg-black/30 flex items-center justify-center z-50" @click.self="showBulkImport = false">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-3xl p-6 max-h-[85vh] flex flex-col">
        <h3 class="text-lg font-bold mb-2">📥 Bulk importeren</h3>
        <p class="text-sm text-gray-600 mb-4">
          Plak hieronder je vragen in tab-gescheiden formaat (bijv. vanuit ChatGPT of Excel).<br>
          <strong>Formaat per regel:</strong> <code class="text-xs bg-gray-100 px-1.5 py-0.5 rounded">Doelgroep[TAB]Fase[TAB]Vraag[TAB]Antwoord[TAB]Webpagina[TAB]Opmerkingen</code><br>
          <span class="text-xs text-gray-500">Fase moet zijn: see, think, do, of care. Doelgroep moet exact overeenkomen met een bestaande doelgroep. Antwoord/Webpagina/Opmerkingen zijn optioneel.</span>
        </p>
        <textarea
          v-model="bulkImportText"
          class="textarea font-mono text-xs flex-1 min-h-[250px]"
          placeholder="Ondernemers	see	Wat is de Drentse Onderneming van het Jaar?	Doel van de prijs	Home / Over de prijs
Ondernemers	think	Wat levert deelname concreet op?	Waarom meedoen?	Home / Over de prijs
Sponsoren	do	Hoe kan een bedrijf sponsor worden?		Partners > Word partner"
        />
        <div v-if="bulkImportPreview.length > 0" class="mt-3 text-xs text-gray-600">
          ✅ {{ bulkImportPreview.length }} vragen herkend
          <span v-if="bulkImportErrors.length > 0" class="text-red-500 ml-2">⚠️ {{ bulkImportErrors.length }} regels overgeslagen (onbekende doelgroep/fase)</span>
        </div>
        <div class="mt-3 flex items-center gap-2">
          <input type="checkbox" id="replaceExisting" v-model="bulkImportReplace" class="rounded border-gray-300 text-pienter-600 focus:ring-pienter-500" />
          <label for="replaceExisting" class="text-sm text-gray-700">Oude vragen verwijderen (vervangt alle huidige vragen van de doelgroepen in deze import)</label>
        </div>
        <div class="flex gap-3 mt-4">
          <button class="btn-primary" @click="executeBulkImport" :disabled="bulkImportPreview.length === 0">
            {{ bulkImportPreview.length }} vragen importeren
          </button>
          <button class="btn-secondary" @click="showBulkImport = false">Annuleren</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, defineComponent, h } from 'vue'
import { useStructuurStore } from '../../stores/structuurStore'
import { useProjectStore } from '../../stores/projectStore'
import type { DoelgroepVraag, JourneyFase } from '@shared/types'

const props = defineProps<{ projectId: string }>()
const store = useStructuurStore()
const projectStore = useProjectStore()

const showBulkImport = ref(false)
const bulkImportText = ref('')
const bulkImportReplace = ref(false)
const copySuccess = ref('')

// Editable cell component (inline)
const EditableCell = defineComponent({
  props: {
    value: { type: String, default: '' },
    placeholder: { type: String, default: '' },
  },
  emits: ['save'],
  setup(cellProps, { emit }) {
    const editing = ref(false)
    const editValue = ref('')

    function startEdit() {
      editing.value = true
      editValue.value = cellProps.value
    }

    function save() {
      editing.value = false
      if (editValue.value !== cellProps.value) {
        emit('save', editValue.value)
      }
    }

    function cancel() {
      editing.value = false
    }

    return () => {
      if (editing.value) {
        return h('input', {
          value: editValue.value,
          class: 'w-full text-sm border border-pienter-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-pienter-500',
          onInput: (e: Event) => { editValue.value = (e.target as HTMLInputElement).value },
          onBlur: save,
          onKeydown: (e: KeyboardEvent) => {
            if (e.key === 'Enter') save()
            if (e.key === 'Escape') cancel()
          },
          onVnodeMounted: (vnode: any) => { vnode.el?.focus() },
        })
      }
      return h('div', {
        class: `text-sm cursor-pointer min-h-[24px] rounded px-1 -mx-1 hover:bg-gray-100 transition-colors ${cellProps.value ? 'text-gray-800' : 'text-gray-300 italic'}`,
        onClick: startEdit,
      }, cellProps.value || cellProps.placeholder)
    }
  },
})

const fasen = [
  { key: 'see' as JourneyFase, label: 'See / Oriëntatie', shortLabel: 'See', headerClass: 'bg-orange-50 text-orange-700', badgeClass: 'bg-orange-100 text-orange-700', borderClass: 'border-orange-200' },
  { key: 'think' as JourneyFase, label: 'Think / Overweging', shortLabel: 'Think', headerClass: 'bg-yellow-50 text-yellow-700', badgeClass: 'bg-yellow-100 text-yellow-700', borderClass: 'border-yellow-200' },
  { key: 'do' as JourneyFase, label: 'Do / Kiezen', shortLabel: 'Do', headerClass: 'bg-green-50 text-green-700', badgeClass: 'bg-green-100 text-green-700', borderClass: 'border-green-200' },
  { key: 'care' as JourneyFase, label: 'Care / Behoud & Vergroten', shortLabel: 'Care', headerClass: 'bg-cyan-50 text-cyan-700', badgeClass: 'bg-cyan-100 text-cyan-700', borderClass: 'border-cyan-200' },
]

const allVragen = computed(() => projectStore.doelgroepVragen.filter(v => v.projectId === props.projectId))

function vragenVoorDoelgroep(doelgroepId: string): DoelgroepVraag[] {
  return allVragen.value.filter(v => v.doelgroepId === doelgroepId)
}

function vragenVoorDoelgroepFase(doelgroepId: string, fase: JourneyFase): DoelgroepVraag[] {
  return allVragen.value
    .filter(v => v.doelgroepId === doelgroepId && v.fase === fase)
    .sort((a, b) => a.sortOrder - b.sortOrder)
}

function vragenPerFase(fase: JourneyFase): number {
  return allVragen.value.filter(v => v.fase === fase).length
}

// Load all vragen on mount
onMounted(async () => {
  if (projectStore.doelgroepen.length === 0) {
    await projectStore.fetchDoelgroepen(props.projectId)
  }
  await projectStore.fetchAllDoelgroepVragen(props.projectId)
})

// Update a single field on a vraag
async function updateVraagField(doelgroepId: string, vraagId: string, field: string, value: string) {
  await projectStore.updateDoelgroepVraag(props.projectId, doelgroepId, vraagId, { [field]: value })
}

// Copy all questions to clipboard in a ChatGPT-friendly format
async function copyAllToClipboard() {
  const lines: string[] = []

  // Header
  lines.push('Doelgroep\tFase\tVraag\tAntwoord / meer informatie\tWebpagina\tOpmerkingen / actiepunten')

  for (const dg of projectStore.doelgroepen) {
    const vragen = vragenVoorDoelgroep(dg.id)
    for (const fase of fasen) {
      const faseVragen = vragen.filter(v => v.fase === fase.key).sort((a, b) => a.sortOrder - b.sortOrder)
      for (const v of faseVragen) {
        lines.push([dg.name, fase.shortLabel.toLowerCase(), v.text, v.answer || '', v.webpagina || '', v.opmerkingen || ''].join('\t'))
      }
    }
  }

  try {
    await navigator.clipboard.writeText(lines.join('\n'))
    copySuccess.value = `${allVragen.value.length} vragen gekopieerd naar klembord! Je kunt dit nu plakken in ChatGPT.`
    setTimeout(() => { copySuccess.value = '' }, 4000)
  } catch {
    // Fallback
    const textarea = document.createElement('textarea')
    textarea.value = lines.join('\n')
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    copySuccess.value = `${allVragen.value.length} vragen gekopieerd!`
    setTimeout(() => { copySuccess.value = '' }, 4000)
  }
}

// Bulk import parsing
const validFasen = ['see', 'think', 'do', 'care']

const bulkImportPreview = computed(() => {
  if (!bulkImportText.value.trim()) return []
  return parseBulkLines().valid
})

const bulkImportErrors = computed(() => {
  if (!bulkImportText.value.trim()) return []
  return parseBulkLines().errors
})

function parseBulkLines() {
  const lines = bulkImportText.value.trim().split('\n')
  const valid: Array<{ doelgroepId: string; fase: string; text: string; answer: string; webpagina: string; opmerkingen: string }> = []
  const errors: string[] = []

  // Build doelgroep name->id map
  const dgMap = new Map<string, string>()
  for (const dg of projectStore.doelgroepen) {
    dgMap.set(dg.name.toLowerCase().trim(), dg.id)
  }

  for (const line of lines) {
    if (!line.trim()) continue
    const parts = line.split('\t')
    if (parts.length < 3) {
      errors.push(line)
      continue
    }

    const dgName = parts[0].trim().toLowerCase()
    const fase = parts[1].trim().toLowerCase()
    const text = parts[2].trim()

    // Skip header row
    if (dgName === 'doelgroep' && fase === 'fase') continue

    const doelgroepId = dgMap.get(dgName)
    if (!doelgroepId) {
      errors.push(`Onbekende doelgroep: "${parts[0].trim()}"`)
      continue
    }
    if (!validFasen.includes(fase)) {
      errors.push(`Ongeldige fase: "${parts[1].trim()}"`)
      continue
    }
    if (!text) {
      errors.push(`Lege vraag op regel`)
      continue
    }

    valid.push({
      doelgroepId,
      fase,
      text,
      answer: parts[3]?.trim() || '',
      webpagina: parts[4]?.trim() || '',
      opmerkingen: parts[5]?.trim() || '',
    })
  }

  return { valid, errors }
}

async function executeBulkImport() {
  const rows = bulkImportPreview.value
  if (rows.length === 0) return

  await projectStore.bulkImportDoelgroepVragen(props.projectId, rows, bulkImportReplace.value)
  bulkImportText.value = ''
  bulkImportReplace.value = false
  showBulkImport.value = false
  // Reload alle vragen
  await projectStore.fetchAllDoelgroepVragen(props.projectId)
  copySuccess.value = `${rows.length} vragen succesvol geïmporteerd!`
  setTimeout(() => { copySuccess.value = '' }, 4000)
}
</script>
