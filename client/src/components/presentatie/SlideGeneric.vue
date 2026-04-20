<template>
  <div class="flex flex-col h-full px-12 py-8">
    <div class="mb-6">
      <h2 class="text-3xl font-bold" :class="textClass">{{ icon }} {{ title }}</h2>
      <p class="text-sm mt-1" :class="subtextClass">{{ description }}</p>
    </div>
    <div class="flex-1 flex flex-col gap-4 overflow-y-auto">
      <!-- Slide-inhoud: projectdata als beschikbaar -->
      <div v-if="projectContent" class="bg-white/5 rounded-xl border border-gray-200/20 p-6">
        <div class="prose prose-sm max-w-none" :class="textClass" v-html="projectContent"></div>
      </div>

      <!-- Presentatienotitie (read-only weergave) -->
      <div
        v-if="slideConfig?.notes"
        class="rounded-xl border border-amber-200/40 bg-amber-50/50 p-4"
      >
        <p class="text-xs font-medium text-amber-600 mb-1">📝 Presentatienotitie</p>
        <p class="text-sm text-amber-800 whitespace-pre-wrap">{{ slideConfig.notes }}</p>
      </div>

      <!-- Live aantekeningen -->
      <div class="mt-auto pt-4">
        <button
          v-if="!showLiveNote"
          class="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
          :class="subtextClass"
          @click="showLiveNote = true"
        >
          + Aantekening toevoegen
        </button>
        <div v-else>
          <textarea
            v-model="liveNoteText"
            class="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:ring-2 focus:ring-pienter-500 focus:border-pienter-500"
            :class="inputBgClass"
            rows="3"
            placeholder="Aantekening tijdens de sessie..."
            @keydown.meta.enter="saveLiveNote"
            @keydown.ctrl.enter="saveLiveNote"
          ></textarea>
          <div class="flex justify-end gap-2 mt-2">
            <button
              class="text-xs px-3 py-1 rounded-lg text-gray-500 hover:bg-gray-100"
              @click="showLiveNote = false; liveNoteText = ''"
            >Annuleren</button>
            <button
              class="text-xs px-3 py-1 rounded-lg bg-pienter-600 text-white hover:bg-pienter-700"
              @click="saveLiveNote"
            >Opslaan</button>
          </div>
        </div>
        <!-- Bestaande live aantekeningen -->
        <div v-if="slideNotes.length > 0" class="mt-3 space-y-2">
          <div
            v-for="note in slideNotes"
            :key="note.id"
            class="flex items-start gap-2 text-xs rounded-lg p-2"
            :class="subtextClass"
          >
            <span class="shrink-0 opacity-60">💬</span>
            <div>
              <p class="whitespace-pre-wrap">{{ note.text }}</p>
              <p class="opacity-50 mt-0.5">{{ new Date(note.createdAt).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' }) }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { PresentatieSessie, PresentatieSlideType, PresentatieSlideConfig, PresentatieLiveNote } from '@shared/types'

const props = defineProps<{
  sessie: PresentatieSessie
  slideType: PresentatieSlideType
  textClass: string
  subtextClass: string
  inputBgClass: string
}>()

const emit = defineEmits<{ (e: 'update', patch: Partial<PresentatieSessie>): void }>()

const showLiveNote = ref(false)
const liveNoteText = ref('')

const slideConfig = computed<PresentatieSlideConfig | undefined>(
  () => props.sessie.slides.find(s => s.type === props.slideType)
)

const slideNotes = computed<PresentatieLiveNote[]>(
  () => (props.sessie.liveNotes || []).filter(n => n.slideType === props.slideType)
)

// Slide metadata
const slideMeta: Record<string, { icon: string; title: string; description: string }> = {
  'projectdoel': { icon: '🎯', title: 'Projectdoel', description: 'Het doel van de website en wat we willen bereiken' },
  'planning': { icon: '📅', title: 'Planning & budget', description: 'Tijdlijn, mijlpalen en budgetrichting' },
  'rollen-teams': { icon: '👥', title: 'Rollen & teams', description: 'Wie is betrokken en welke rol heeft iedereen?' },
  'user-stories': { icon: '📖', title: 'User stories', description: 'Wat willen de gebruikers bereiken op de website?' },
  'concurrenten-inspiratie': { icon: '🔍', title: 'Concurrenten & inspiratie', description: 'Wat doen concurrenten en wat inspireert?' },
  'sitemap': { icon: '🗺️', title: 'Sitemap', description: 'De hoofdstructuur van de website' },
  'paginas': { icon: '📄', title: 'Pagina\'s & subpagina\'s', description: 'Overzicht van alle pagina\'s' },
  'paginadoel': { icon: '🎯', title: 'Doel per pagina', description: 'Wat is het doel van elke pagina?' },
  'pagina-prioriteit': { icon: '⭐', title: 'Pagina-prioriteiten', description: 'Welke pagina\'s hebben de hoogste prioriteit?' },
  'componenten-per-pagina': { icon: '🧩', title: 'Componenten per pagina', description: 'Welke blokken en componenten staan op elke pagina?' },
  'zoekthemas': { icon: '🔎', title: 'Zoekthema\'s', description: 'Zoekwoorden en thema\'s per pagina' },
  'contentstatus': { icon: '📊', title: 'Contentstatus', description: 'Overzicht van de status van alle content' },
  'wie-schrijft-wat': { icon: '✍️', title: 'Wie schrijft wat', description: 'Verdeling van teksten en verantwoordelijkheden' },
  'beeldmateriaal': { icon: '📸', title: 'Beeldmateriaal', description: 'Foto\'s, video\'s en visueel materiaal' },
  'content-ontbreekt': { icon: '⚠️', title: 'Content die nog ontbreekt', description: 'Wat moet er nog aangeleverd of geschreven worden?' },
  'stijlrichting': { icon: '🎨', title: 'Visuele stijlrichting', description: 'De look & feel van de website' },
  'kleur-typografie': { icon: '🎨', title: 'Kleur & typografie', description: 'Kleurpalet en lettertypen' },
  'componentvoorbeeld': { icon: '🧩', title: 'Componentvoorbeelden', description: 'Voorbeelden van herbruikbare componenten' },
  'voorbeeldpagina': { icon: '🖼️', title: 'Voorbeeldpagina\'s', description: 'Uitgewerkte voorbeeldpagina\'s' },
  'design-doelgroep-match': { icon: '🎯', title: 'Match doelgroep & doel', description: 'Waarom de designkeuzes passen bij doelgroep en doel' },
  'feedbackpunten': { icon: '💬', title: 'Feedbackpunten', description: 'Waar willen we graag feedback op?' },
  'functionaliteiten': { icon: '⚡', title: 'Functionaliteiten', description: 'Gewenste functionaliteiten en features' },
  'integraties': { icon: '🔗', title: 'Integraties', description: 'Externe koppelingen en systemen' },
  'functionele-toelichting': { icon: '📋', title: 'Functionele toelichting', description: 'Toelichting per blok of component' },
  'overdracht-development': { icon: '🔄', title: 'Overdracht naar development', description: 'Wat moet er gebouwd worden?' },
  'openstaande-punten': { icon: '❗', title: 'Openstaande punten', description: 'Onderdelen die nog afgehandeld moeten worden' },
  'risicos': { icon: '⚠️', title: 'Risico\'s & aandachtspunten', description: 'Potentiële risico\'s en aandachtspunten' },
  'samenvatting': { icon: '📋', title: 'Samenvatting', description: 'Overzicht van het project en de belangrijkste punten' },
  'besluiten': { icon: '✅', title: 'Besluiten', description: 'Afspraken en besluiten die gemaakt zijn' },
  'actiepunten': { icon: '📌', title: 'Actiepunten', description: 'Wat moet er nog gedaan worden en door wie?' },
  'volgende-stap': { icon: '➡️', title: 'Volgende stap', description: 'Wat zijn de vervolgstappen?' },
}

const meta = computed(() => slideMeta[props.slideType] || { icon: '📄', title: props.slideType, description: '' })
const icon = computed(() => meta.value.icon)
const title = computed(() => meta.value.title)
const description = computed(() => meta.value.description)

const projectContent = computed<string | null>(() => {
  // Placeholder: in the future this can pull data from the project store
  return null
})

function saveLiveNote() {
  if (!liveNoteText.value.trim()) return
  const newNote: PresentatieLiveNote = {
    id: Date.now().toString(36),
    slideType: props.slideType,
    text: liveNoteText.value.trim(),
    createdAt: new Date().toISOString(),
  }
  const updatedNotes = [...(props.sessie.liveNotes || []), newNote]
  emit('update', { liveNotes: updatedNotes })
  liveNoteText.value = ''
  showLiveNote.value = false
}
</script>
