<template>
  <div class="flex flex-col h-full">
    <!-- Title -->
    <div class="px-12 pt-8 pb-4">
      <h2 class="text-3xl font-bold" :class="textClass">
        🖼️ {{ slideConfig?.title || 'Screenshot' }}
      </h2>
      <p v-if="slideConfig?.notes" class="text-sm mt-2" :class="subtextClass">{{ slideConfig.notes }}</p>
    </div>

    <!-- Image display -->
    <div class="flex-1 overflow-auto px-12 pb-8">
      <div v-if="images.length === 0" class="flex items-center justify-center h-full">
        <p class="text-sm" :class="subtextClass">Geen screenshots geüpload voor deze slide.</p>
      </div>

      <!-- Single image: full size centered -->
      <div v-else-if="images.length === 1" class="flex items-center justify-center h-full">
        <img
          :src="'/api/' + images[0]"
          class="max-w-full max-h-full object-contain rounded-lg shadow-lg cursor-pointer"
          :alt="slideConfig?.title || 'Screenshot'"
          @click="openFullscreen(0)"
        />
      </div>

      <!-- Multiple images: grid -->
      <div v-else class="grid gap-4 h-full" :class="images.length === 2 ? 'grid-cols-2' : 'grid-cols-2 lg:grid-cols-3'">
        <div
          v-for="(img, idx) in images"
          :key="idx"
          class="flex items-center justify-center"
        >
          <img
            :src="'/api/' + img"
            class="max-w-full max-h-full object-contain rounded-lg shadow-md cursor-pointer hover:shadow-xl transition-shadow"
            :alt="(slideConfig?.title || 'Screenshot') + ' ' + (idx + 1)"
            @click="openFullscreen(idx)"
          />
        </div>
      </div>
    </div>

    <!-- Fullscreen overlay -->
    <div
      v-if="fullscreenIndex !== null"
      class="fixed inset-0 bg-black/90 z-50 flex items-center justify-center cursor-pointer"
      @click="fullscreenIndex = null"
    >
      <img
        :src="'/api/' + images[fullscreenIndex]"
        class="max-w-[95vw] max-h-[95vh] object-contain"
        :alt="'Fullscreen screenshot'"
        @click.stop
      />
      <button
        class="absolute top-4 right-4 text-white/70 hover:text-white text-2xl"
        @click="fullscreenIndex = null"
      >✕</button>
      <button
        v-if="images.length > 1 && fullscreenIndex > 0"
        class="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white text-3xl px-3 py-6"
        @click.stop="fullscreenIndex!--"
      >‹</button>
      <button
        v-if="images.length > 1 && fullscreenIndex < images.length - 1"
        class="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white text-3xl px-3 py-6"
        @click.stop="fullscreenIndex!++"
      >›</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { PresentatieSessie, PresentatieSlideConfig } from '@shared/types'

const props = defineProps<{
  sessie: PresentatieSessie
  slideIndex: number
  textClass: string
  subtextClass: string
}>()

const fullscreenIndex = ref<number | null>(null)

const slideConfig = computed<PresentatieSlideConfig | undefined>(
  () => props.sessie.slides[props.slideIndex]
)

const images = computed<string[]>(
  () => slideConfig.value?.imagePaths?.filter(p => p && p !== '__pending__') || []
)

function openFullscreen(idx: number) {
  fullscreenIndex.value = idx
}
</script>
