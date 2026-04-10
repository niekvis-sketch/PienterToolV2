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
      </div>
      <div class="flex items-center gap-3">
        <span class="text-xs" :class="mutedClass">
          Slide {{ currentIndex + 1 }} / {{ activeSlides.length }}
        </span>
        <span v-if="saving" class="text-xs text-pienter-500 animate-pulse">Opslaan...</span>
        <span v-else class="text-xs" :class="mutedClass">Opgeslagen ✓</span>
      </div>
    </header>

    <!-- Slide content -->
    <div class="flex-1 overflow-hidden relative">
      <!-- Progress bar -->
      <div class="absolute top-0 left-0 right-0 h-1 bg-gray-200/30 z-10">
        <div
          class="h-full bg-pienter-500 transition-all duration-300"
          :style="{ width: `${((currentIndex + 1) / activeSlides.length) * 100}%` }"
        ></div>
      </div>

      <div class="h-full pt-1">
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
      </div>
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
      <div class="flex items-center gap-1.5">
        <button
          v-for="(slide, idx) in activeSlides"
          :key="slide.type"
          class="w-2.5 h-2.5 rounded-full transition-all"
          :class="idx === currentIndex ? 'bg-pienter-500 scale-125' : dotClass"
          @click="currentIndex = idx"
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
import { useRouter, useRoute } from 'vue-router'
import { useProjectStore } from '../stores/projectStore'
import { usePresentatieStore } from '../stores/presentatieStore'
import type { PresentatieSessie, PresentatieSlideConfig } from '@shared/types'

import SlideIntroductie from '../components/presentatie/SlideIntroductie.vue'
import SlideVisie from '../components/presentatie/SlideVisie.vue'
import SlideMissie from '../components/presentatie/SlideMissie.vue'
import SlideKlantreis from '../components/presentatie/SlideKlantreis.vue'
import SlideDoelgroepen from '../components/presentatie/SlideDoelgroepen.vue'
import SlideMerkwaarden from '../components/presentatie/SlideMerkwaarden.vue'
import SlideKernwaarden from '../components/presentatie/SlideKernwaarden.vue'
import SlideDoelgroeppaspoort from '../components/presentatie/SlideDoelgroeppaspoort.vue'

const props = defineProps<{ id: string; sessieId: string }>()
const router = useRouter()
const projectStore = useProjectStore()
const presStore = usePresentatieStore()

const currentIndex = ref(0)
const saving = ref(false)

const project = computed(() => projectStore.currentProject)
const sessie = computed(() => presStore.currentSessie)

const activeSlides = computed(() => {
  if (!sessie.value) return []
  return sessie.value.slides
    .filter(s => s.enabled)
    .sort((a, b) => a.sortOrder - b.sortOrder)
})

const currentSlideType = computed(() => activeSlides.value[currentIndex.value]?.type)

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
