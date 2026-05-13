<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-bold text-gray-900">Doelen</h2>
      <div class="flex gap-2">
        <button class="btn-secondary btn-sm" @click="startAddDoel('lang')">+ Langetermijndoel</button>
        <button class="btn-primary btn-sm" @click="startAddDoel('kort')">+ Kortetermijndoel</button>
      </div>
    </div>

    <!-- Algemene doelstelling / context -->
    <div class="card p-5">
      <div class="flex items-center justify-between mb-3">
        <h3 class="font-semibold text-gray-800">Algemene doelstelling</h3>
        <button v-if="!editingAlgemeen" class="btn-secondary btn-sm" @click="startEditAlgemeen">Bewerken</button>
        <div v-else class="flex gap-2">
          <button class="btn-primary btn-sm" @click="saveAlgemeen">Opslaan</button>
          <button class="btn-secondary btn-sm" @click="editingAlgemeen = false">Annuleren</button>
        </div>
      </div>
      <p v-if="!editingAlgemeen" class="text-sm whitespace-pre-wrap text-gray-800">{{ klant.doelstellingen || 'Geen algemene doelstelling vastgelegd.' }}</p>
      <textarea v-else v-model="algemeenForm.doelstellingen" class="input min-h-[100px]" rows="4" placeholder="Wat wil de klant op hoofdlijnen bereiken?" />
    </div>

    <!-- Form voor nieuw / bestaand doel -->
    <div v-if="showDoelForm" class="card p-5 border-pienter-300 bg-pienter-50/40 space-y-3">
      <h3 class="font-semibold text-gray-800">{{ editingDoelId ? 'Doel bewerken' : 'Nieuw doel' }}</h3>
      <div class="grid grid-cols-3 gap-3">
        <div class="col-span-2">
          <label class="block text-sm font-medium text-gray-700 mb-1">Titel</label>
          <input v-model="doelForm.titel" class="input" placeholder="bijv. 50% meer leads in 2026" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Termijn</label>
          <select v-model="doelForm.type" class="select">
            <option value="kort">Korte termijn</option>
            <option value="lang">Lange termijn</option>
          </select>
        </div>
        <div class="col-span-3">
          <label class="block text-sm font-medium text-gray-700 mb-1">Beschrijving</label>
          <textarea v-model="doelForm.beschrijving" class="input min-h-[80px]" rows="3" placeholder="Wat houdt dit doel in en waarom is het belangrijk?" />
        </div>
      </div>
      <div class="flex gap-2">
        <button class="btn-primary btn-sm" :disabled="!doelForm.titel" @click="saveDoel">Opslaan</button>
        <button class="btn-secondary btn-sm" @click="cancelDoelForm">Annuleren</button>
      </div>
    </div>

    <!-- Lege staat -->
    <div v-if="store.doelen.length === 0 && !showDoelForm" class="card p-10 text-center">
      <div class="text-3xl mb-3">🎯</div>
      <p class="text-gray-500">Nog geen hoofddoelen vastgelegd.</p>
      <p class="text-xs text-gray-400 mt-2">Voeg een korte- of langetermijndoel toe en hang er per maand focuspunten onder, verdeeld over de teams.</p>
    </div>

    <!-- Hoofddoelen lijst -->
    <div v-else class="space-y-3">
      <div
        v-for="doel in sortedDoelen"
        :key="doel.id"
        class="card p-5"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <span
                class="text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded"
                :class="doel.type === 'lang' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'"
              >{{ doel.type === 'lang' ? 'Lange termijn' : 'Korte termijn' }}</span>
              <h3 class="font-semibold text-gray-900">{{ doel.titel }}</h3>
            </div>
            <p v-if="doel.beschrijving" class="text-sm text-gray-600 mt-2 whitespace-pre-wrap">{{ doel.beschrijving }}</p>
          </div>
          <div class="flex gap-1 shrink-0">
            <button class="text-gray-400 hover:text-pienter-600 text-xs px-2" @click="startEditDoel(doel.id)">Bewerken</button>
            <button class="text-gray-300 hover:text-red-500 text-xs px-2" @click="handleDeleteDoel(doel.id)">✕</button>
          </div>
        </div>

        <!-- Focuspunten per maand -->
        <div class="mt-4 border-t border-gray-100 pt-4">
          <div class="flex items-center justify-between mb-3">
            <h4 class="text-sm font-semibold text-gray-700">Maandelijkse focuspunten</h4>
            <button class="text-xs text-pienter-600 hover:text-pienter-700" @click="startAddFocuspunt(doel.id)">+ Focuspunt</button>
          </div>

          <div v-if="showFocusFormFor === doel.id" class="border border-pienter-200 rounded-lg p-3 mb-3 bg-white space-y-2">
            <div class="grid grid-cols-3 gap-2">
              <div>
                <label class="block text-xs font-medium text-gray-600 mb-0.5">Maand</label>
                <input v-model="focusForm.maand" type="month" class="input text-sm" />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-600 mb-0.5">Team</label>
                <select v-model="focusForm.team" class="select text-sm">
                  <option value="seo">SEO</option>
                  <option value="content">Content</option>
                  <option value="advertising">Advertising</option>
                  <option value="website">Website</option>
                  <option value="overig">Overig</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-600 mb-0.5">Verantwoordelijke</label>
                <MedewerkerSelect
                  v-model="focusForm.assigneeId"
                  :team="focusForm.team"
                  :allow-null="true"
                  placeholder="— Niemand toegewezen —"
                />
              </div>
              <div class="col-span-3">
                <label class="block text-xs font-medium text-gray-600 mb-0.5">Beschrijving</label>
                <input v-model="focusForm.beschrijving" class="input text-sm" placeholder="Wat ga je deze maand doen?" />
              </div>
            </div>
            <div class="flex gap-2">
              <button class="btn-primary btn-sm" :disabled="!focusForm.beschrijving" @click="saveFocuspunt">Opslaan</button>
              <button class="btn-secondary btn-sm" @click="cancelFocusForm">Annuleren</button>
            </div>
          </div>

          <div v-if="focuspuntenVoorDoel(doel.id).length === 0 && showFocusFormFor !== doel.id" class="text-xs text-gray-400">
            Nog geen focuspunten voor dit doel.
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="group in focuspuntenGegroepeerd(doel.id)"
              :key="group.maand"
            >
              <p class="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">{{ formatMonth(group.maand) }}</p>
              <div class="space-y-1">
                <div
                  v-for="fp in group.items"
                  :key="fp.id"
                  class="flex items-center gap-2 text-sm border border-gray-100 rounded px-2 py-1.5 bg-gray-50/50"
                >
                  <input type="checkbox" :checked="fp.voltooid" class="shrink-0" @change="toggleVoltooid(fp)" />
                  <span
                    class="text-xs font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded shrink-0"
                    :class="teamClass(fp.team)"
                  >{{ teamLabel(fp.team) }}</span>
                  <span class="flex-1 min-w-0" :class="fp.voltooid ? 'line-through text-gray-400' : 'text-gray-800'">{{ fp.beschrijving }}</span>
                  <MedewerkerTag v-if="fp.assigneeId" :medewerker-id="fp.assigneeId" />
                  <button class="text-gray-300 hover:text-red-500 text-xs px-1 shrink-0" @click="handleDeleteFocuspunt(fp.id)">✕</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useKlantenStore } from '../../stores/klantenStore'
import type { KlantDoel, KlantDoelType, KlantDoelTeam, KlantDoelFocuspunt } from '@shared/types'
import MedewerkerSelect from '../medewerkers/MedewerkerSelect.vue'
import MedewerkerTag from '../medewerkers/MedewerkerTag.vue'

const store = useKlantenStore()
const klant = computed(() => store.currentKlant!)

// ---- Algemene doelstelling ----
const editingAlgemeen = ref(false)
const algemeenForm = reactive({ doelstellingen: '' })

function startEditAlgemeen() {
  algemeenForm.doelstellingen = klant.value.doelstellingen
  editingAlgemeen.value = true
}

async function saveAlgemeen() {
  await store.updateKlant(klant.value.id, { doelstellingen: algemeenForm.doelstellingen })
  editingAlgemeen.value = false
}

// ---- Doelen ----
const sortedDoelen = computed(() => [...store.doelen].sort((a, b) => {
  // Lange termijn eerst
  if (a.type !== b.type) return a.type === 'lang' ? -1 : 1
  return a.sortOrder - b.sortOrder
}))

const showDoelForm = ref(false)
const editingDoelId = ref<string | null>(null)
const doelForm = reactive<{ titel: string; beschrijving: string; type: KlantDoelType }>({
  titel: '', beschrijving: '', type: 'kort',
})

function startAddDoel(type: KlantDoelType) {
  editingDoelId.value = null
  doelForm.titel = ''
  doelForm.beschrijving = ''
  doelForm.type = type
  showDoelForm.value = true
}

function startEditDoel(id: string) {
  const d = store.doelen.find(x => x.id === id)
  if (!d) return
  editingDoelId.value = id
  doelForm.titel = d.titel
  doelForm.beschrijving = d.beschrijving
  doelForm.type = d.type
  showDoelForm.value = true
}

function cancelDoelForm() {
  showDoelForm.value = false
  editingDoelId.value = null
}

async function saveDoel() {
  if (editingDoelId.value) {
    await store.updateDoel(klant.value.id, editingDoelId.value, { ...doelForm })
  } else {
    await store.createDoel(klant.value.id, { ...doelForm })
  }
  cancelDoelForm()
}

async function handleDeleteDoel(id: string) {
  if (confirm('Doel verwijderen? Bijbehorende focuspunten worden ook verwijderd.')) {
    await store.deleteDoel(klant.value.id, id)
  }
}

// ---- Focuspunten ----
const showFocusFormFor = ref<string | null>(null)
const focusForm = reactive<{ maand: string; team: KlantDoelTeam; beschrijving: string; assigneeId: string | null }>({
  maand: new Date().toISOString().slice(0, 7),
  team: 'content',
  beschrijving: '',
  assigneeId: null,
})

function focuspuntenVoorDoel(doelId: string): KlantDoelFocuspunt[] {
  return store.focuspunten.filter(f => f.doelId === doelId)
}

function focuspuntenGegroepeerd(doelId: string): Array<{ maand: string; items: KlantDoelFocuspunt[] }> {
  const items = focuspuntenVoorDoel(doelId)
  const byMaand = new Map<string, KlantDoelFocuspunt[]>()
  for (const f of items) {
    if (!byMaand.has(f.maand)) byMaand.set(f.maand, [])
    byMaand.get(f.maand)!.push(f)
  }
  return [...byMaand.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([maand, items]) => ({ maand, items: items.sort((a, b) => a.team.localeCompare(b.team)) }))
}

function startAddFocuspunt(doelId: string) {
  showFocusFormFor.value = doelId
  focusForm.maand = new Date().toISOString().slice(0, 7)
  focusForm.team = 'content'
  focusForm.beschrijving = ''
  focusForm.assigneeId = null
}

function cancelFocusForm() {
  showFocusFormFor.value = null
}

async function saveFocuspunt() {
  if (!showFocusFormFor.value) return
  await store.createFocuspunt(klant.value.id, showFocusFormFor.value, { ...focusForm, voltooid: false })
  cancelFocusForm()
}

async function toggleVoltooid(fp: KlantDoelFocuspunt) {
  await store.updateFocuspunt(klant.value.id, fp.id, { voltooid: !fp.voltooid })
}

async function handleDeleteFocuspunt(id: string) {
  if (confirm('Focuspunt verwijderen?')) {
    await store.deleteFocuspunt(klant.value.id, id)
  }
}

function formatMonth(yyyymm: string): string {
  if (!/^\d{4}-\d{2}$/.test(yyyymm)) return yyyymm
  const [y, m] = yyyymm.split('-')
  const date = new Date(Number(y), Number(m) - 1, 1)
  return date.toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' })
}

function teamLabel(t: KlantDoelTeam): string {
  return { seo: 'SEO', content: 'Content', advertising: 'Ads', website: 'Website', overig: 'Overig' }[t]
}

function teamClass(t: KlantDoelTeam): string {
  return {
    seo: 'bg-green-100 text-green-700',
    content: 'bg-yellow-100 text-yellow-700',
    advertising: 'bg-orange-100 text-orange-700',
    website: 'bg-blue-100 text-blue-700',
    overig: 'bg-gray-100 text-gray-600',
  }[t]
}
</script>
