<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-xl font-bold text-gray-900 mb-1">Doelgroepen & Customer Journey</h2>
        <p class="text-sm text-gray-500">Breng per doelgroep de vragen in kaart die zij stellen in elke fase van hun journey</p>
      </div>
      <button class="btn-primary btn-sm" @click="showNewDoelgroep = true">+ Doelgroep toevoegen</button>
    </div>

    <!-- Geen doelgroepen -->
    <div v-if="store.doelgroepen.length === 0" class="empty-state card p-12">
      <div class="text-4xl mb-3">🎯</div>
      <h3 class="text-sm font-semibold text-gray-700">Nog geen doelgroepen</h3>
      <p class="text-xs">Voeg een doelgroep toe en breng de klantvragen per journey-fase in kaart.</p>
    </div>

    <!-- Doelgroep selector tabs -->
    <div v-else>
      <div class="flex items-center gap-2 mb-4 flex-wrap">
        <button
          v-for="dg in store.doelgroepen"
          :key="dg.id"
          class="px-4 py-2 rounded-lg text-sm font-medium transition-colors border"
          :class="selectedDoelgroepId === dg.id
            ? 'bg-pienter-600 text-white border-pienter-600'
            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'"
          @click="selectDoelgroep(dg.id)"
        >
          {{ dg.name }}
        </button>
      </div>

      <!-- Selected doelgroep header -->
      <div v-if="selectedDoelgroep" class="card p-4 mb-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3 flex-1">
            <div v-if="!editingDoelgroep" class="flex items-center gap-3">
              <h3 class="text-lg font-semibold text-gray-900">{{ selectedDoelgroep.name }}</h3>
              <span v-if="selectedDoelgroep.description" class="text-sm text-gray-500">— {{ selectedDoelgroep.description }}</span>
              <button class="text-gray-400 hover:text-pienter-600 text-xs" @click="startEditDoelgroep">✏️ Bewerken</button>
            </div>
            <div v-else class="flex items-center gap-2 flex-1">
              <input
                v-model="editDoelgroepName"
                class="input text-sm w-48"
                placeholder="Naam doelgroep"
                @keyup.enter="saveDoelgroep"
              />
              <input
                v-model="editDoelgroepDescription"
                class="input text-sm flex-1"
                placeholder="Korte beschrijving (optioneel)"
                @keyup.enter="saveDoelgroep"
              />
              <button class="btn-primary btn-sm" @click="saveDoelgroep">Opslaan</button>
              <button class="btn-secondary btn-sm" @click="editingDoelgroep = false">Annuleren</button>
            </div>
          </div>
          <button
            class="text-gray-400 hover:text-red-500 text-xs ml-4"
            @click="confirmDeleteDoelgroep"
          >🗑️ Verwijderen</button>
        </div>
      </div>

      <!-- Journey board: 4 columns -->
      <div v-if="selectedDoelgroep" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div
          v-for="fase in fasen"
          :key="fase.key"
          class="rounded-xl border-2 min-h-[300px] flex flex-col"
          :class="fase.borderColor"
        >
          <!-- Column header -->
          <div
            class="px-4 py-3 rounded-t-[10px] flex items-center justify-between"
            :class="fase.headerBg"
          >
            <div class="flex items-center gap-2">
              <h4 class="text-sm font-bold" :class="fase.textColor">{{ fase.label }}</h4>
              <span class="text-xs font-medium px-1.5 py-0.5 rounded-full" :class="fase.countBg">
                {{ vragenVoorFase(fase.key).length }}
              </span>
            </div>
          </div>

          <!-- Questions list -->
          <div class="flex-1 p-2 space-y-2">
            <div
              v-for="vraag in vragenVoorFase(fase.key)"
              :key="vraag.id"
              class="group rounded-lg border p-3 text-sm transition-all hover:shadow-sm"
              :class="fase.cardBorder"
            >
              <!-- View mode -->
              <div v-if="editingVraagId !== vraag.id" class="flex items-start justify-between gap-2">
                <span class="text-gray-800 leading-relaxed flex-1">{{ vraag.text }}</span>
                <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button
                    class="text-gray-400 hover:text-pienter-600 p-0.5"
                    title="Bewerken"
                    @click="startEditVraag(vraag)"
                  >
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  </button>
                  <button
                    class="text-gray-400 hover:text-red-500 p-0.5"
                    title="Verwijderen"
                    @click="deleteVraag(vraag)"
                  >
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>

              <!-- Edit mode -->
              <div v-else>
                <textarea
                  v-model="editVraagText"
                  class="textarea text-sm"
                  rows="2"
                  @keydown.enter.exact.prevent="saveEditVraag(vraag)"
                  @keydown.escape="editingVraagId = null"
                />
                <div class="flex gap-2 mt-2">
                  <button class="btn-primary btn-sm" @click="saveEditVraag(vraag)">Opslaan</button>
                  <button class="btn-secondary btn-sm" @click="editingVraagId = null">Annuleren</button>
                </div>
              </div>
            </div>
          </div>

          <!-- Add new question -->
          <div class="p-2 border-t" :class="fase.borderColor">
            <div v-if="addingFase === fase.key">
              <textarea
                v-model="newVraagText"
                class="textarea text-sm mb-2"
                rows="2"
                :placeholder="`Nieuwe vraag in ${fase.label}...`"
                @keydown.enter.exact.prevent="addVraag(fase.key)"
                @keydown.escape="addingFase = null"
                ref="newVraagInput"
              />
              <div class="flex gap-2">
                <button class="btn-primary btn-sm" @click="addVraag(fase.key)" :disabled="!newVraagText.trim()">Toevoegen</button>
                <button class="btn-secondary btn-sm" @click="addingFase = null">Annuleren</button>
              </div>
            </div>
            <button
              v-else
              class="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-1.5"
              @click="startAddVraag(fase.key)"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
              Vraag toevoegen
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- New doelgroep modal -->
    <div v-if="showNewDoelgroep" class="fixed inset-0 bg-black/30 flex items-center justify-center z-50" @click.self="showNewDoelgroep = false">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h3 class="text-lg font-bold mb-4">Nieuwe doelgroep</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Naam</label>
            <input
              v-model="newDoelgroepName"
              class="input"
              placeholder="bijv. HR-managers, Eventbezoekers, Studenten"
              @keyup.enter="createDoelgroep"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Beschrijving (optioneel)</label>
            <input
              v-model="newDoelgroepDescription"
              class="input"
              placeholder="Korte beschrijving van deze doelgroep"
            />
          </div>
        </div>
        <div class="flex gap-3 mt-6">
          <button class="btn-primary" @click="createDoelgroep" :disabled="!newDoelgroepName.trim()">Toevoegen</button>
          <button class="btn-secondary" @click="showNewDoelgroep = false">Annuleren</button>
        </div>
      </div>
    </div>

    <!-- Delete confirmation modal -->
    <div v-if="showDeleteConfirm" class="fixed inset-0 bg-black/30 flex items-center justify-center z-50" @click.self="showDeleteConfirm = false">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
        <h3 class="text-lg font-bold mb-2">Doelgroep verwijderen?</h3>
        <p class="text-sm text-gray-600 mb-4">
          Dit verwijdert de doelgroep <strong>{{ selectedDoelgroep?.name }}</strong> en alle bijbehorende vragen. Dit kan niet ongedaan worden.
        </p>
        <div class="flex gap-3">
          <button class="btn-danger" @click="executeDeleteDoelgroep">Verwijderen</button>
          <button class="btn-secondary" @click="showDeleteConfirm = false">Annuleren</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue'
import { useProjectStore } from '../../stores/projectStore'
import type { Doelgroep, DoelgroepVraag, JourneyFase } from '@shared/types'

const store = useProjectStore()

// State
const selectedDoelgroepId = ref<string | null>(null)
const showNewDoelgroep = ref(false)
const showDeleteConfirm = ref(false)
const newDoelgroepName = ref('')
const newDoelgroepDescription = ref('')
const editingDoelgroep = ref(false)
const editDoelgroepName = ref('')
const editDoelgroepDescription = ref('')

// Vraag state
const addingFase = ref<JourneyFase | null>(null)
const newVraagText = ref('')
const editingVraagId = ref<string | null>(null)
const editVraagText = ref('')

// Fase definitions
const fasen = [
  {
    key: 'see' as JourneyFase,
    label: 'See / Oriëntatie',
    headerBg: 'bg-orange-50',
    borderColor: 'border-orange-200',
    textColor: 'text-orange-700',
    countBg: 'bg-orange-100 text-orange-700',
    cardBorder: 'border-orange-200 bg-orange-50/50',
  },
  {
    key: 'think' as JourneyFase,
    label: 'Think / Overweging',
    headerBg: 'bg-yellow-50',
    borderColor: 'border-yellow-300',
    textColor: 'text-yellow-700',
    countBg: 'bg-yellow-100 text-yellow-700',
    cardBorder: 'border-yellow-200 bg-yellow-50/50',
  },
  {
    key: 'do' as JourneyFase,
    label: 'Do / Kiezen',
    headerBg: 'bg-green-50',
    borderColor: 'border-green-300',
    textColor: 'text-green-700',
    countBg: 'bg-green-100 text-green-700',
    cardBorder: 'border-green-200 bg-green-50/50',
  },
  {
    key: 'care' as JourneyFase,
    label: 'Care / Behoud & Vergroten',
    headerBg: 'bg-cyan-50',
    borderColor: 'border-cyan-300',
    textColor: 'text-cyan-700',
    countBg: 'bg-cyan-100 text-cyan-700',
    cardBorder: 'border-cyan-200 bg-cyan-50/50',
  },
]

// Computed
const selectedDoelgroep = computed(() =>
  store.doelgroepen.find(d => d.id === selectedDoelgroepId.value) ?? null
)

function vragenVoorFase(fase: JourneyFase): DoelgroepVraag[] {
  if (!selectedDoelgroepId.value) return []
  return store.doelgroepVragen
    .filter(v => v.doelgroepId === selectedDoelgroepId.value && v.fase === fase)
    .sort((a, b) => a.sortOrder - b.sortOrder)
}

// Auto-select first doelgroep
watch(() => store.doelgroepen, (dgs) => {
  if (dgs.length > 0 && !selectedDoelgroepId.value) {
    selectDoelgroep(dgs[0].id)
  }
}, { immediate: true })

// Actions
async function selectDoelgroep(id: string) {
  selectedDoelgroepId.value = id
  if (store.currentProject) {
    await store.fetchDoelgroepVragen(store.currentProject.id, id)
  }
}

async function createDoelgroep() {
  if (!newDoelgroepName.value.trim() || !store.currentProject) return
  const dg = await store.createDoelgroep(store.currentProject.id, {
    name: newDoelgroepName.value.trim(),
    description: newDoelgroepDescription.value.trim(),
  })
  newDoelgroepName.value = ''
  newDoelgroepDescription.value = ''
  showNewDoelgroep.value = false
  selectDoelgroep(dg.id)
}

function startEditDoelgroep() {
  if (!selectedDoelgroep.value) return
  editDoelgroepName.value = selectedDoelgroep.value.name
  editDoelgroepDescription.value = selectedDoelgroep.value.description
  editingDoelgroep.value = true
}

async function saveDoelgroep() {
  if (!selectedDoelgroep.value || !store.currentProject || !editDoelgroepName.value.trim()) return
  await store.updateDoelgroep(store.currentProject.id, selectedDoelgroep.value.id, {
    name: editDoelgroepName.value.trim(),
    description: editDoelgroepDescription.value.trim(),
  })
  editingDoelgroep.value = false
}

function confirmDeleteDoelgroep() {
  showDeleteConfirm.value = true
}

async function executeDeleteDoelgroep() {
  if (!selectedDoelgroep.value || !store.currentProject) return
  const id = selectedDoelgroep.value.id
  await store.deleteDoelgroep(store.currentProject.id, id)
  showDeleteConfirm.value = false
  selectedDoelgroepId.value = store.doelgroepen.length > 0 ? store.doelgroepen[0].id : null
  if (selectedDoelgroepId.value && store.currentProject) {
    await store.fetchDoelgroepVragen(store.currentProject.id, selectedDoelgroepId.value)
  }
}

// Vraag actions
async function startAddVraag(fase: JourneyFase) {
  addingFase.value = fase
  newVraagText.value = ''
  await nextTick()
}

async function addVraag(fase: JourneyFase) {
  if (!newVraagText.value.trim() || !selectedDoelgroep.value || !store.currentProject) return
  await store.createDoelgroepVraag(store.currentProject.id, selectedDoelgroep.value.id, {
    fase,
    text: newVraagText.value.trim(),
  })
  newVraagText.value = ''
  // Stay in add mode for fast entry
}

function startEditVraag(vraag: DoelgroepVraag) {
  editingVraagId.value = vraag.id
  editVraagText.value = vraag.text
}

async function saveEditVraag(vraag: DoelgroepVraag) {
  if (!editVraagText.value.trim() || !store.currentProject || !selectedDoelgroep.value) return
  await store.updateDoelgroepVraag(store.currentProject.id, selectedDoelgroep.value.id, vraag.id, {
    text: editVraagText.value.trim(),
  })
  editingVraagId.value = null
}

async function deleteVraag(vraag: DoelgroepVraag) {
  if (!store.currentProject || !selectedDoelgroep.value) return
  await store.deleteDoelgroepVraag(store.currentProject.id, selectedDoelgroep.value.id, vraag.id)
}
</script>
