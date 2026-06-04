<template>
  <div
    class="group menu-row"
    :style="{ marginLeft: item.level * 24 + 'px' }"
    :class="{ 'opacity-40': isDragging }"
    draggable="true"
    @dragstart="emit('dragstart')"
    @dragend="emit('dragend')"
    @dragover.prevent="emit('dragover', $event)"
    @drop.prevent="emit('drop')"
  >
    <div class="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 hover:border-pienter-300 transition-colors">
      <!-- Sleep-handvat -->
      <span class="cursor-grab select-none text-gray-300 group-hover:text-gray-400" title="Sleep om te verplaatsen">⋮⋮</span>

      <!-- Label -->
      <span class="flex-1 truncate text-sm font-medium text-gray-900">{{ displayLabel }}</span>

      <!-- Subitem-tag -->
      <span v-if="item.level > 0" class="italic text-[11px] text-gray-400">Subitem</span>

      <!-- Verwijder (bij hover) -->
      <button
        class="text-gray-300 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
        title="Uit menu halen"
        @click="emit('remove')"
      >✕</button>

      <!-- Uitklappen -->
      <button
        class="text-gray-400 hover:text-gray-600"
        :title="item.expanded ? 'Inklappen' : 'Uitklappen'"
        @click="emit('toggle')"
      >
        <span class="inline-block transition-transform" :class="{ 'rotate-180': item.expanded }">▾</span>
      </button>
    </div>

    <!-- Uitgeklapt paneel -->
    <div v-if="item.expanded" class="mt-1 rounded-lg border border-gray-100 bg-gray-50 px-3 py-3 space-y-2">
      <div>
        <label class="mb-1 block text-xs font-medium text-gray-600">Label in menu</label>
        <input
          class="input text-sm"
          :value="item.customLabel ?? ''"
          :placeholder="page?.title || 'Naamloos item'"
          @input="emit('update-label', ($event.target as HTMLInputElement).value)"
        />
      </div>
      <div class="text-xs text-gray-500">
        <div class="flex items-center gap-1">
          <span>📄</span>
          <span class="font-medium text-gray-700">{{ page?.title || 'Onbekende pagina' }}</span>
        </div>
        <div v-if="page" class="mt-0.5 font-mono text-pienter-600">{{ page.fullUrl }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { SiteNode } from '@shared/types'
import type { FlatMenuItem } from './menuTypes'

const props = defineProps<{
  item: FlatMenuItem
  page?: SiteNode
  isDragging: boolean
}>()

const emit = defineEmits<{
  (e: 'remove'): void
  (e: 'toggle'): void
  (e: 'update-label', value: string): void
  (e: 'dragstart'): void
  (e: 'dragend'): void
  (e: 'dragover', event: DragEvent): void
  (e: 'drop'): void
}>()

const displayLabel = computed(() => props.item.customLabel || props.page?.title || 'Naamloos item')
</script>
