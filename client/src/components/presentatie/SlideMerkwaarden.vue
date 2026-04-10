<template>
  <div class="flex flex-col h-full px-12 py-8">
    <div class="mb-6">
      <h2 class="text-3xl font-bold" :class="textClass">💎 Merkwaarden</h2>
      <p class="text-sm mt-1" :class="subtextClass">Waar staat het merk voor? Welke waarden straal je uit naar de buitenwereld?</p>
    </div>
    <div class="flex-1 overflow-y-auto">
      <!-- Tags weergave -->
      <div class="flex flex-wrap gap-2 mb-6">
        <span
          v-for="(val, i) in sessie.merkwaarden"
          :key="i"
          class="inline-flex items-center gap-1.5 bg-purple-100 text-purple-800 px-4 py-2 rounded-full text-sm font-medium"
        >
          {{ val }}
          <button class="text-purple-400 hover:text-purple-700 ml-1" @click="removeWaarde(i)">✕</button>
        </span>
        <span v-if="sessie.merkwaarden.length === 0" class="text-gray-400 text-sm italic py-2">Nog geen merkwaarden toegevoegd</span>
      </div>

      <!-- Input -->
      <div class="flex gap-2">
        <input
          v-model="newWaarde"
          type="text"
          class="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-pienter-500 focus:border-pienter-500"
          :class="inputBgClass"
          placeholder="Typ een merkwaarde en druk op Enter..."
          @keyup.enter="addWaarde"
        />
        <button
          class="bg-purple-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-purple-700 shrink-0"
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
  const updated = [...props.sessie.merkwaarden, val]
  emit('update', { merkwaarden: updated })
  newWaarde.value = ''
}

function removeWaarde(index: number) {
  const updated = props.sessie.merkwaarden.filter((_, i) => i !== index)
  emit('update', { merkwaarden: updated })
}
</script>
