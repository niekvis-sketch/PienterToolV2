<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-xl font-bold text-gray-900">Presentatiemodus</h1>
        <p class="text-sm text-gray-500 mt-1">Beheer en start presentatiesessies voor klantgesprekken</p>
      </div>
      <button
        class="bg-pienter-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-pienter-700 transition-colors"
        @click="showNewModal = true"
      >
        + Nieuwe sessie
      </button>
    </div>

    <!-- Sessie overzicht -->
    <div v-if="presStore.loading" class="text-center py-12 text-gray-400">Laden...</div>
    <div v-else-if="presStore.sessies.length === 0" class="text-center py-16">
      <div class="text-4xl mb-3">🎬</div>
      <p class="text-gray-500 text-sm">Nog geen presentatiesessies aangemaakt.</p>
      <button
        class="mt-4 bg-pienter-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-pienter-700"
        @click="showNewModal = true"
      >
        Start je eerste sessie
      </button>
    </div>
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="sessie in presStore.sessies"
        :key="sessie.id"
        class="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
      >
        <div class="flex items-start justify-between">
          <div class="flex-1 min-w-0">
            <h3 class="font-semibold text-gray-900 truncate">{{ sessie.name }}</h3>
            <p class="text-xs text-gray-400 mt-1">
              {{ new Date(sessie.createdAt).toLocaleDateString('nl-NL') }}
              · {{ sessie.slides.filter(s => s.enabled).length }} slides
              · {{ styleLabels[sessie.style] }}
            </p>
          </div>
          <span class="ml-2 text-lg">🎬</span>
        </div>
        <div class="flex gap-2 mt-4">
          <button
            class="flex-1 bg-pienter-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-pienter-700"
            @click="startPresentatie(sessie.id)"
          >
            ▶ Presenteren
          </button>
          <button
            class="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 text-gray-600 hover:bg-gray-50"
            @click="openEdit(sessie)"
          >
            Bewerken
          </button>
          <button
            class="px-3 py-1.5 rounded-lg text-xs font-medium border border-red-200 text-red-600 hover:bg-red-50"
            @click="confirmDelete(sessie)"
          >
            ✕
          </button>
        </div>
      </div>
    </div>

    <!-- Nieuwe/Bewerk sessie modal -->
    <div v-if="showNewModal" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50" @click.self="closeModal">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div class="p-6 border-b border-gray-100">
          <h2 class="text-lg font-bold text-gray-900">{{ editingSessie ? 'Sessie bewerken' : 'Nieuwe presentatiesessie' }}</h2>
          <p class="text-sm text-gray-500 mt-1">Stel de presentatie samen voor de klant</p>
        </div>
        <div class="p-6 space-y-5">
          <!-- Naam -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Sessienaam</label>
            <input
              v-model="form.name"
              type="text"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-pienter-500 focus:border-pienter-500"
              placeholder="Bijv. Kickoff websitesessie"
            />
          </div>

          <!-- Stijl -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Presentatiestijl</label>
            <div class="grid grid-cols-3 gap-2">
              <button
                v-for="st in styles"
                :key="st.key"
                class="border rounded-lg px-3 py-2.5 text-xs font-medium transition-colors text-center"
                :class="form.style === st.key
                  ? 'border-pienter-500 bg-pienter-50 text-pienter-700'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'"
                @click="form.style = st.key"
              >
                {{ st.icon }} {{ st.label }}
              </button>
            </div>
          </div>

          <!-- Slides -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Slides selecteren</label>
            <div class="space-y-1">
              <label
                v-for="slide in form.slides"
                :key="slide.type"
                class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                <input
                  v-model="slide.enabled"
                  type="checkbox"
                  class="rounded border-gray-300 text-pienter-600 focus:ring-pienter-500"
                />
                <span class="text-sm">{{ slideLabels[slide.type] }}</span>
              </label>
            </div>
          </div>
        </div>
        <div class="p-6 border-t border-gray-100 flex justify-end gap-2">
          <button
            class="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100"
            @click="closeModal"
          >
            Annuleren
          </button>
          <button
            class="bg-pienter-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-pienter-700"
            @click="saveSessie"
          >
            {{ editingSessie ? 'Opslaan' : 'Aanmaken & starten' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Verwijder bevestiging -->
    <div v-if="deletingSessie" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50" @click.self="deletingSessie = null">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
        <h3 class="font-semibold text-gray-900">Sessie verwijderen?</h3>
        <p class="text-sm text-gray-500 mt-2">
          Weet je zeker dat je "{{ deletingSessie.name }}" wilt verwijderen? Dit kan niet ongedaan worden gemaakt.
        </p>
        <div class="flex justify-end gap-2 mt-5">
          <button class="px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100" @click="deletingSessie = null">Annuleren</button>
          <button class="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700" @click="doDelete">Verwijderen</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useProjectStore } from '../../stores/projectStore'
import { usePresentatieStore } from '../../stores/presentatieStore'
import type { PresentatieSessie, PresentatieSlideType, PresentatieSlideConfig } from '@shared/types'

const router = useRouter()
const projectStore = useProjectStore()
const presStore = usePresentatieStore()

const showNewModal = ref(false)
const editingSessie = ref<PresentatieSessie | null>(null)
const deletingSessie = ref<PresentatieSessie | null>(null)

const styles: { key: PresentatieSessie['style']; label: string; icon: string }[] = [
  { key: 'pienter', label: 'Pienter', icon: '🟢' },
  { key: 'light', label: 'Licht', icon: '☀️' },
  { key: 'dark', label: 'Donker', icon: '🌙' },
]

const styleLabels: Record<string, string> = {
  pienter: 'Pienter stijl',
  light: 'Lichte stijl',
  dark: 'Donkere stijl',
}

const slideLabels: Record<PresentatieSlideType, string> = {
  introductie: '🏠 Introductie (sessienaam & klantnaam)',
  visie: '🔭 Visie van het bedrijf',
  missie: '🎯 Missie van het bedrijf',
  klantreis: '🗺️ Klantreis (See, Think, Do, Care)',
  doelgroepen: '👥 Doelgroepen aanmaken',
  merkwaarden: '💎 Merkwaarden',
  kernwaarden: '❤️ Kernwaarden',
  doelgroeppaspoort: '📋 Doelgroeppaspoort',
}

const defaultSlides: PresentatieSlideConfig[] = [
  { type: 'introductie', enabled: true, sortOrder: 0 },
  { type: 'visie', enabled: true, sortOrder: 1 },
  { type: 'missie', enabled: true, sortOrder: 2 },
  { type: 'klantreis', enabled: true, sortOrder: 3 },
  { type: 'doelgroepen', enabled: true, sortOrder: 4 },
  { type: 'merkwaarden', enabled: true, sortOrder: 5 },
  { type: 'kernwaarden', enabled: true, sortOrder: 6 },
  { type: 'doelgroeppaspoort', enabled: true, sortOrder: 7 },
]

const form = ref({
  name: '',
  style: 'pienter' as PresentatieSessie['style'],
  slides: [] as PresentatieSlideConfig[],
})

function resetForm() {
  form.value = {
    name: '',
    style: 'pienter',
    slides: defaultSlides.map(s => ({ ...s })),
  }
}

function closeModal() {
  showNewModal.value = false
  editingSessie.value = null
  resetForm()
}

function openEdit(sessie: PresentatieSessie) {
  editingSessie.value = sessie
  form.value = {
    name: sessie.name,
    style: sessie.style,
    slides: sessie.slides.map(s => ({ ...s })),
  }
  showNewModal.value = true
}

async function saveSessie() {
  const projectId = projectStore.currentProject!.id
  if (editingSessie.value) {
    await presStore.updateSessie(projectId, editingSessie.value.id, {
      name: form.value.name,
      style: form.value.style,
      slides: form.value.slides,
    })
    closeModal()
  } else {
    const sessie = await presStore.createSessie(projectId, {
      name: form.value.name,
      style: form.value.style,
      slides: form.value.slides,
    })
    closeModal()
    startPresentatie(sessie.id)
  }
}

function startPresentatie(sessieId: string) {
  const projectId = projectStore.currentProject!.id
  router.push({ name: 'presentatie', params: { id: projectId, sessieId } })
}

function confirmDelete(sessie: PresentatieSessie) {
  deletingSessie.value = sessie
}

async function doDelete() {
  if (!deletingSessie.value) return
  const projectId = projectStore.currentProject!.id
  await presStore.deleteSessie(projectId, deletingSessie.value.id)
  deletingSessie.value = null
}

onMounted(async () => {
  if (projectStore.currentProject) {
    await presStore.fetchSessies(projectStore.currentProject.id)
  }
  resetForm()
})
</script>
