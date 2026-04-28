<template>
  <div class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" @click.self="$emit('close')">
    <div class="bg-white rounded-xl shadow-xl p-6 w-[720px] max-w-full max-h-[80vh] flex flex-col">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold text-gray-900">Preset bibliotheek</h2>
        <button class="text-gray-400 hover:text-gray-600 text-2xl leading-none" @click="$emit('close')">×</button>
      </div>

      <div v-if="store.presets.length === 0" class="empty-state py-8">
        <p>Geen presets opgeslagen. Sla een slide op vanuit de editor om hier te verschijnen.</p>
      </div>

      <div v-else class="grid grid-cols-2 gap-3 overflow-y-auto">
        <div
          v-for="p in store.presets"
          :key="p.id"
          class="border border-gray-200 rounded-lg p-3 hover:border-pienter-400 transition-all"
        >
          <div class="aspect-video bg-gray-50 rounded mb-2 relative overflow-hidden">
            <div
              v-for="el in p.content.elements"
              :key="el.id"
              class="absolute"
              :style="elPreviewStyle(el)"
            >
              <div v-if="el.type === 'text'" class="overflow-hidden" :style="textPreviewStyle(el)">{{ el.value }}</div>
              <img v-else :src="resolveSrc(el.src)" class="w-full h-full object-contain" />
            </div>
          </div>
          <div class="flex items-center justify-between gap-2">
            <span class="text-sm font-medium text-gray-800 truncate">{{ p.name }}</span>
            <div class="flex gap-1 shrink-0">
              <button class="btn-secondary btn-sm" @click="$emit('insert', p)">Invoegen</button>
              <button
                class="text-xs text-red-600 hover:bg-red-50 px-2 py-1 rounded"
                @click="confirmDelete(p)"
                title="Preset verwijderen"
              >🗑</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useSlidesStore } from '../../stores/slidesStore'
import type { SlideElement, SlidePreset, SlideTextElement } from '@shared/types'

const store = useSlidesStore()

defineEmits<{
  (e: 'close'): void
  (e: 'insert', preset: SlidePreset): void
}>()

onMounted(() => { void store.fetchPresets() })

// Preview-canvas is 10x5.625 inch geschaald naar de cell-breedte. Gebruik percentage.
function elPreviewStyle(el: SlideElement): Record<string, string> {
  return {
    left: (el.x / 10 * 100) + '%',
    top: (el.y / 5.625 * 100) + '%',
    width: (el.w / 10 * 100) + '%',
    height: (el.h / 5.625 * 100) + '%',
  }
}

function textPreviewStyle(el: SlideTextElement): Record<string, string> {
  return {
    fontSize: Math.max(6, el.fontSize / 6) + 'px',
    fontWeight: el.bold ? '700' : '400',
    color: '#' + el.color,
    textAlign: el.align,
    lineHeight: '1.1',
  }
}

function resolveSrc(src: string): string {
  if (src.startsWith('http') || src.startsWith('data:')) return src
  return `/api/${src}`
}

async function confirmDelete(p: SlidePreset) {
  if (!window.confirm(`Preset "${p.name}" verwijderen?`)) return
  await store.deletePreset(p.id)
}
</script>
