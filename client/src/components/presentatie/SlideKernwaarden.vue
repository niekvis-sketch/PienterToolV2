<template>
  <div class="flex flex-col h-full px-12 py-8">
    <div class="mb-6">
      <h2 class="text-3xl font-bold" :class="textClass">❤️ Kernwaarden</h2>
      <p class="text-sm mt-1" :class="subtextClass">Wat zijn de interne kernwaarden van het bedrijf? Waar staat het team voor?</p>
    </div>
    <div class="flex-1 overflow-y-auto">
      <!-- Tags weergave -->
      <div class="flex flex-wrap gap-2 mb-6">
        <span
          v-for="(val, i) in sessie.kernwaarden"
          :key="i"
          class="inline-flex items-center gap-1.5 bg-rose-100 text-rose-800 px-4 py-2 rounded-full text-sm font-medium"
        >
          {{ val }}
          <button class="text-rose-400 hover:text-rose-700 ml-1" @click="removeWaarde(i)">✕</button>
        </span>
        <span v-if="sessie.kernwaarden.length === 0" class="text-gray-400 text-sm italic py-2">Nog geen kernwaarden toegevoegd</span>
      </div>

      <!-- Input -->
      <div class="flex gap-2">
        <input
          v-model="newWaarde"
          type="text"
          class="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-pienter-500 focus:border-pienter-500"
          :class="inputBgClass"
          placeholder="Typ een kernwaarde en druk op Enter..."
          @keyup.enter="addWaarde"
        />
        <button
          class="bg-rose-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-rose-700 shrink-0"
          @click="addWaarde"
        >
          + Toevoegen
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { PresentatieSessie } from '@shared/types'

const props = defineProps<{
  sessie: PresentatieSessie
  textClass: string
  subtextClass: string
  inputBgClass: string
}>()

const emit = defineEmits<{ (e: 'update', patch: Partial<PresentatieSessie>): void }>()

const newWaarde = ref('')

function addWaarde() {
  const val = newWaarde.value.trim()
  if (!val) return
  const updated = [...props.sessie.kernwaarden, val]
  emit('update', { kernwaarden: updated })
  newWaarde.value = ''
}

function removeWaarde(index: number) {
  const updated = props.sessie.kernwaarden.filter((_, i) => i !== index)
  emit('update', { kernwaarden: updated })
}
</script>
