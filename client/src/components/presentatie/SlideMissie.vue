<template>
  <div class="flex flex-col h-full px-12 py-8">
    <div class="mb-6">
      <h2 class="text-3xl font-bold" :class="textClass">🎯 Missie</h2>
      <p class="text-sm mt-1" :class="subtextClass">Wat is de kernopdracht van het bedrijf? Waarom bestaan ze?</p>
    </div>
    <div class="flex-1">
      <textarea
        :value="sessie.missie"
        @input="onInput"
        class="w-full h-full resize-none rounded-xl border border-gray-200 p-6 text-lg leading-relaxed focus:ring-2 focus:ring-pienter-500 focus:border-pienter-500"
        :class="inputBgClass"
        placeholder="Beschrijf hier de missie van het bedrijf..."
      ></textarea>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PresentatieSessie } from '@shared/types'

const props = defineProps<{
  sessie: PresentatieSessie
  textClass: string
  subtextClass: string
  inputBgClass: string
}>()

const emit = defineEmits<{ (e: 'update', patch: Partial<PresentatieSessie>): void }>()

let debounceTimer: ReturnType<typeof setTimeout>
function onInput(e: Event) {
  const val = (e.target as HTMLTextAreaElement).value
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    emit('update', { missie: val })
  }, 500)
}
</script>
