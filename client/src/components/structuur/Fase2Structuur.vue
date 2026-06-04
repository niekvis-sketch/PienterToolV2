<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-lg font-bold text-gray-900">Fase 2 · Websitestructuur & Navigatie</h3>
        <p class="text-sm text-gray-500 mt-1">Bouw het menu visueel op. Kopieer de klantvragen naar ChatGPT en importeer de gegenereerde structuur inclusief pagina-indeling.</p>
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
        </div>
      </div>
    </div>

    <!-- View toggle: Menu | Plattegrond -->
    <div class="flex items-center gap-1 bg-gray-100 rounded-lg p-1 w-fit">
      <button
        v-for="v in fase2Views" :key="v.key"
        class="px-3 py-1.5 text-xs font-medium rounded-md transition-colors"
        :class="fase2View === v.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'"
        @click="fase2View = v.key"
      >{{ v.icon }} {{ v.label }}</button>
    </div>

    <!-- Menu builder -->
    <MenuStructuurBuilder v-if="fase2View === 'menu'" :project-id="projectId" />

    <!-- Plattegrond canvas -->
    <PlattegrondCanvas v-else-if="fase2View === 'plattegrond'" :project-id="projectId" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useStructuurStore } from '../../stores/structuurStore'
import { useProjectStore } from '../../stores/projectStore'
import type { JourneyFase } from '@shared/types'
import MenuStructuurBuilder from './MenuStructuurBuilder.vue'
import PlattegrondCanvas from './PlattegrondCanvas.vue'

const props = defineProps<{ projectId: string }>()
const store = useStructuurStore()
const projectStore = useProjectStore()

const fase2View = ref<'menu' | 'plattegrond'>('menu')
const fase2Views = [
  { key: 'menu' as const, icon: '🧩', label: 'Menu' },
  { key: 'plattegrond' as const, icon: '🗺️', label: 'Plattegrond' },
]

const showImport = ref(false)
const showAllWarnings = ref(false)
const importMode = ref<'json' | 'csv'>('json')
const importJson = ref('')
const importCsv = ref('')
const importMsg = ref('')
const importError = ref(false)
const importReplace = ref(true)
const copySuccess = ref('')

async function addRootNode() {
  await store.createNode(props.projectId, { title: 'Nieuwe pagina', slug: 'nieuwe-pagina' })
}

async function fetchWarnings() {
  await store.fetchWarnings(props.projectId)
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
</script>
