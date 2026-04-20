<template>
  <div v-if="!sessie" class="flex items-center justify-center h-screen text-gray-400">Laden...</div>
  <div v-else class="h-screen flex flex-col" :class="bgClass">
    <!-- Top bar -->
    <header class="flex items-center justify-between px-6 py-3 shrink-0" :class="headerClass">
      <div class="flex items-center gap-3">
        <button
          class="text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
          :class="btnSecondaryClass"
          @click="exitPresentatie"
        >
          ← Terug
        </button>
        <span class="text-sm font-semibold" :class="textClass">{{ sessie.name }}</span>
        <span
          v-if="sessie.sessieType"
          class="text-[10px] font-medium uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-pienter-100 text-pienter-700"
        >{{ sessieTypeLabel(sessie.sessieType) }}</span>
      </div>
      <div class="flex items-center gap-3">
        <button
          class="text-xs font-medium px-2.5 py-1 rounded-lg transition-colors"
          :class="showNotesPanel ? 'bg-pienter-100 text-pienter-700' : btnSecondaryClass"
          @click="showNotesPanel = !showNotesPanel"
          title="Aantekeningen paneel"
        >
          📝 Notities
        </button>
        <span class="text-xs" :class="mutedClass">
          Slide {{ currentIndex + 1 }} / {{ activeSlides.length }}
        </span>
        <span v-if="saving" class="text-xs text-pienter-500 animate-pulse">Opslaan...</span>
        <span v-else class="text-xs" :class="mutedClass">Opgeslagen ✓</span>
      </div>
    </header>

    <!-- Slide content + optional notes panel -->
    <div class="flex-1 overflow-hidden relative flex">
      <!-- Progress bar -->
      <div class="absolute top-0 left-0 right-0 h-1 bg-gray-200/30 z-10">
        <div
          class="h-full bg-pienter-500 transition-all duration-300"
          :style="{ width: `${((currentIndex + 1) / activeSlides.length) * 100}%` }"
        ></div>
      </div>

      <!-- Main slide area -->
      <div class="flex-1 h-full pt-1">
        <SlideIntroductie
          v-if="currentSlideType === 'introductie'"
          :sessie="sessie"
          :project="project!"
          :textClass="textClass"
          :subtextClass="mutedClass"
        />
        <SlideVisie
          v-else-if="currentSlideType === 'visie'"
          :sessie="sessie"
          :textClass="textClass"
          :subtextClass="mutedClass"
          :inputBgClass="inputBgClass"
          @update="onSlideUpdate"
        />
        <SlideMissie
          v-else-if="currentSlideType === 'missie'"
          :sessie="sessie"
          :textClass="textClass"
          :subtextClass="mutedClass"
          :inputBgClass="inputBgClass"
          @update="onSlideUpdate"
        />
        <SlideKlantreis
          v-else-if="currentSlideType === 'klantreis'"
          :textClass="textClass"
          :subtextClass="mutedClass"
        />
        <SlideDoelgroepen
          v-else-if="currentSlideType === 'doelgroepen'"
          :textClass="textClass"
          :subtextClass="mutedClass"
        />
        <SlideMerkwaarden
          v-else-if="currentSlideType === 'merkwaarden'"
          :sessie="sessie"
          :textClass="textClass"
          :subtextClass="mutedClass"
          :inputBgClass="inputBgClass"
          @update="onSlideUpdate"
        />
        <SlideKernwaarden
          v-else-if="currentSlideType === 'kernwaarden'"
          :sessie="sessie"
          :textClass="textClass"
          :subtextClass="mutedClass"
          :inputBgClass="inputBgClass"
          @update="onSlideUpdate"
        />
        <SlideDoelgroeppaspoort
          v-else-if="currentSlideType === 'doelgroeppaspoort'"
          :sessie="sessie"
          :textClass="textClass"
          :subtextClass="mutedClass"
          @update="onSlideUpdate"
        />
        <!-- Screenshot slide -->
        <SlideScreenshot
          v-else-if="currentSlideType === 'screenshot'"
          :sessie="sessie"
          :slideIndex="sessie.slides.indexOf(activeSlides[currentIndex])"
          :textClass="textClass"
          :subtextClass="mutedClass"
        />
        <!-- Generieke slide voor alle andere typen -->
        <SlideGeneric
          v-else
          :sessie="sessie"
          :slideType="currentSlideType!"
          :textClass="textClass"
          :subtextClass="mutedClass"
          :inputBgClass="inputBgClass"
          @update="onSlideUpdate"
        />
      </div>

      <!-- Notes side panel -->
      <aside
        v-if="showNotesPanel"
        class="w-80 shrink-0 border-l overflow-y-auto pt-2 px-4 pb-4"
        :class="sessie.style === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'"
      >
        <h3 class="text-xs font-semibold uppercase tracking-wide mb-3" :class="mutedClass">
          Live aantekeningen
        </h3>

        <!-- Aantekening toevoegen -->
        <div class="mb-4">
          <textarea
            v-model="panelNoteText"
            class="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs resize-none focus:ring-1 focus:ring-pienter-500 focus:border-pienter-500"
            :class="inputBgClass"
            rows="3"
            placeholder="Nieuwe aantekening..."
            @keydown.meta.enter="savePanelNote"
            @keydown.ctrl.enter="savePanelNote"
          ></textarea>
          <button
            v-if="panelNoteText.trim()"
            class="mt-1 text-xs px-3 py-1 rounded-lg bg-pienter-600 text-white hover:bg-pienter-700"
            @click="savePanelNote"
          >Opslaan</button>
        </div>

        <!-- Lijst met aantekeningen -->
        <div v-if="allLiveNotes.length === 0" class="text-xs" :class="mutedClass">
          Nog geen aantekeningen. Voeg notities toe tijdens de presentatie.
        </div>
        <div v-else class="space-y-2">
          <div
            v-for="note in allLiveNotes"
            :key="note.id"
            class="rounded-lg p-2.5 text-xs border"
            :class="sessie.style === 'dark' ? 'border-gray-600 bg-gray-700' : 'border-gray-100 bg-gray-50'"
          >
            <div class="flex items-center gap-1.5 mb-1" :class="mutedClass">
              <span class="text-[10px] font-medium px-1.5 py-0.5 rounded bg-pienter-100 text-pienter-700">
                {{ slideLabel(note.slideType) }}
              </span>
              <span class="text-[10px] opacity-60">
                {{ new Date(note.createdAt).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' }) }}
              </span>
            </div>
            <p class="whitespace-pre-wrap" :class="textClass">{{ note.text }}</p>
          </div>
        </div>
      </aside>
    </div>

    <!-- Navigation bar -->
    <footer class="flex items-center justify-between px-6 py-4 shrink-0" :class="headerClass">
      <button
        class="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
        :class="currentIndex === 0 ? disabledClass : btnSecondaryClass"
        :disabled="currentIndex === 0"
        @click="prev"
      >
        ← Vorige
      </button>

      <!-- Slide dots -->
      <div class="flex items-center gap-1.5 flex-wrap justify-center max-w-lg">
        <button
          v-for="(slide, idx) in activeSlides"
          :key="slide.type"
          class="w-2.5 h-2.5 rounded-full transition-all"
          :class="idx === currentIndex ? 'bg-pienter-500 scale-125' : dotClass"
          @click="currentIndex = idx"
          :title="slideLabel(slide.type)"
        ></button>
      </div>

      <button
        class="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
        :class="currentIndex === activeSlides.length - 1 ? disabledClass : 'bg-pienter-600 text-white hover:bg-pienter-700'"
        :disabled="currentIndex === activeSlides.length - 1"
        @click="next"
      >
        Volgende →
      </button>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useProjectStore } from '../stores/projectStore'
import { usePresentatieStore } from '../stores/presentatieStore'
import type { PresentatieSessie, PresentatieSlideType, PresentatieSessieType, PresentatieLiveNote } from '@shared/types'

import SlideIntroductie from '../components/presentatie/SlideIntroductie.vue'
import SlideVisie from '../components/presentatie/SlideVisie.vue'
import SlideMissie from '../components/presentatie/SlideMissie.vue'
import SlideKlantreis from '../components/presentatie/SlideKlantreis.vue'
import SlideDoelgroepen from '../components/presentatie/SlideDoelgroepen.vue'
import SlideMerkwaarden from '../components/presentatie/SlideMerkwaarden.vue'
import SlideKernwaarden from '../components/presentatie/SlideKernwaarden.vue'
import SlideDoelgroeppaspoort from '../components/presentatie/SlideDoelgroeppaspoort.vue'
import SlideGeneric from '../components/presentatie/SlideGeneric.vue'
import SlideScreenshot from '../components/presentatie/SlideScreenshot.vue'

const props = defineProps<{ id: string; sessieId: string }>()
const router = useRouter()
const projectStore = useProjectStore()
const presStore = usePresentatieStore()

const currentIndex = ref(0)
const saving = ref(false)
const showNotesPanel = ref(false)
const panelNoteText = ref('')

const project = computed(() => projectStore.currentProject)
const sessie = computed(() => presStore.currentSessie)

const activeSlides = computed(() => {
  if (!sessie.value) return []
  return sessie.value.slides
    .filter(s => s.enabled)
    .sort((a, b) => a.sortOrder - b.sortOrder)
})

const currentSlideType = computed(() => activeSlides.value[currentIndex.value]?.type)

const allLiveNotes = computed(() =>
  [...(sessie.value?.liveNotes || [])].sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
)

// Slide labels for notes panel
const slideLabels: Record<string, string> = {
  introductie: 'Introductie',
  projectdoel: 'Projectdoel',
  planning: 'Planning',
  'rollen-teams': 'Rollen & teams',
  visie: 'Visie',
  missie: 'Missie',
  doelgroepen: 'Doelgroepen',
  doelgroeppaspoort: 'Doelgroeppaspoort',
  klantreis: 'Klantreis',
  'user-stories': 'User stories',
  merkwaarden: 'Merkwaarden',
  kernwaarden: 'Kernwaarden',
  'concurrenten-inspiratie': 'Concurrenten',
  sitemap: 'Sitemap',
  paginas: 'Pagina\'s',
  paginadoel: 'Paginadoel',
  'pagina-prioriteit': 'Prioriteiten',
  'componenten-per-pagina': 'Componenten',
  zoekthemas: 'Zoekthema\'s',
  contentstatus: 'Contentstatus',
  'wie-schrijft-wat': 'Wie schrijft wat',
  beeldmateriaal: 'Beeldmateriaal',
  'content-ontbreekt': 'Content ontbreekt',
  stijlrichting: 'Stijlrichting',
  'kleur-typografie': 'Kleur & typo',
  componentvoorbeeld: 'Componenten',
  voorbeeldpagina: 'Voorbeeldpagina',
  'design-doelgroep-match': 'Design match',
  feedbackpunten: 'Feedback',
  functionaliteiten: 'Functionaliteiten',
  integraties: 'Integraties',
  'functionele-toelichting': 'Toelichting',
  'overdracht-development': 'Overdracht',
  'openstaande-punten': 'Open punten',
  risicos: 'Risico\'s',
  samenvatting: 'Samenvatting',
  besluiten: 'Besluiten',
  actiepunten: 'Actiepunten',
  'volgende-stap': 'Volgende stap',
  screenshot: 'Screenshot',
}

function slideLabel(type: PresentatieSlideType): string {
  return slideLabels[type] || type
}

const sessieTypeLabels: Record<PresentatieSessieType, string> = {
  intake: 'Intake',
  websitesessie: 'Websitesessie',
  structuur: 'Structuur',
  design: 'Design',
  content: 'Content',
  'intern-overdracht': 'Intern',
}

function sessieTypeLabel(type: PresentatieSessieType): string {
  return sessieTypeLabels[type] || type
}

// Style classes based on presentation style
const bgClass = computed(() => {
  switch (sessie.value?.style) {
    case 'dark': return 'bg-gray-900'
    case 'light': return 'bg-white'
    default: return 'bg-gray-50'
  }
})

const headerClass = computed(() => {
  switch (sessie.value?.style) {
    case 'dark': return 'bg-gray-800 border-gray-700'
    case 'light': return 'bg-white border-b border-gray-200'
    default: return 'bg-white border-b border-gray-200'
  }
})

const textClass = computed(() => {
  switch (sessie.value?.style) {
    case 'dark': return 'text-white'
    default: return 'text-gray-900'
  }
})

const mutedClass = computed(() => {
  switch (sessie.value?.style) {
    case 'dark': return 'text-gray-400'
    default: return 'text-gray-500'
  }
})

const inputBgClass = computed(() => {
  switch (sessie.value?.style) {
    case 'dark': return 'bg-gray-800 text-white border-gray-600'
    default: return 'bg-white'
  }
})

const btnSecondaryClass = computed(() => {
  switch (sessie.value?.style) {
    case 'dark': return 'text-gray-300 hover:bg-gray-700'
    default: return 'text-gray-600 hover:bg-gray-100'
  }
})

const disabledClass = computed(() => {
  switch (sessie.value?.style) {
    case 'dark': return 'text-gray-600 cursor-not-allowed'
    default: return 'text-gray-300 cursor-not-allowed'
  }
})

const dotClass = computed(() => {
  switch (sessie.value?.style) {
    case 'dark': return 'bg-gray-600 hover:bg-gray-500'
    default: return 'bg-gray-300 hover:bg-gray-400'
  }
})

function prev() {
  if (currentIndex.value > 0) currentIndex.value--
}

function next() {
  if (currentIndex.value < activeSlides.value.length - 1) currentIndex.value++
}

async function onSlideUpdate(patch: Partial<PresentatieSessie>) {
  if (!sessie.value) return
  saving.value = true
  try {
    await presStore.autoSave(props.id, patch)
  } finally {
    saving.value = false
  }
}

async function savePanelNote() {
  if (!panelNoteText.value.trim() || !sessie.value || !currentSlideType.value) return
  const newNote: PresentatieLiveNote = {
    id: Date.now().toString(36),
    slideType: currentSlideType.value,
    text: panelNoteText.value.trim(),
    createdAt: new Date().toISOString(),
  }
  const updatedNotes = [...(sessie.value.liveNotes || []), newNote]
  await onSlideUpdate({ liveNotes: updatedNotes })
  panelNoteText.value = ''
}

function exitPresentatie() {
  router.push({ name: 'project-detail', params: { id: props.id } })
}

// Keyboard navigation
function onKeydown(e: KeyboardEvent) {
  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return
  if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); next() }
  if (e.key === 'ArrowLeft') { e.preventDefault(); prev() }
  if (e.key === 'Escape') exitPresentatie()
}

onMounted(async () => {
  window.addEventListener('keydown', onKeydown)

  // Load project if needed
  if (!projectStore.currentProject || projectStore.currentProject.id !== props.id) {
    await projectStore.fetchProject(props.id)
  }
  // Load doelgroepen for doelgroepen slide
  await projectStore.fetchDoelgroepen(props.id)
  // Load sessie
  await presStore.fetchSessie(props.id, props.sessieId)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
})
</script>
