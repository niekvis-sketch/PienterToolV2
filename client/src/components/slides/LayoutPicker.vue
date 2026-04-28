<template>
  <div class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" @click.self="$emit('close')">
    <div class="bg-white rounded-xl shadow-xl p-6 w-[640px] max-w-full">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold text-gray-900">Kies een layout</h2>
        <button class="text-gray-400 hover:text-gray-600 text-2xl leading-none" @click="$emit('close')">×</button>
      </div>
      <div class="grid grid-cols-3 gap-3">
        <button
          v-for="opt in layouts"
          :key="opt.value"
          class="border border-gray-200 rounded-lg p-2 hover:border-pienter-400 hover:bg-pienter-50 transition-all text-left"
          @click="$emit('pick', opt.value)"
        >
          <div class="aspect-video bg-gray-50 rounded mb-2 relative overflow-hidden">
            <component :is="opt.preview" />
          </div>
          <div class="text-xs font-medium text-gray-700">{{ opt.label }}</div>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { h } from 'vue'
import type { SlideLayoutType } from '@shared/types'

defineEmits<{
  (e: 'close'): void
  (e: 'pick', layout: SlideLayoutType): void
}>()

const bar = (cls: string, style: Record<string, string>) =>
  h('div', { class: 'absolute bg-gray-300 rounded ' + cls, style })

const layouts = [
  {
    value: 'title_only' as SlideLayoutType, label: 'Alleen titel',
    preview: () => h('div', { class: 'absolute inset-0' }, [
      bar('', { left: '15%', right: '15%', top: '40%', height: '20%' }),
    ]),
  },
  {
    value: 'title_content' as SlideLayoutType, label: 'Titel + inhoud',
    preview: () => h('div', { class: 'absolute inset-0' }, [
      bar('', { left: '8%', right: '8%', top: '12%', height: '15%' }),
      bar('bg-gray-200', { left: '8%', right: '8%', top: '35%', bottom: '12%' }),
    ]),
  },
  {
    value: 'two_column' as SlideLayoutType, label: 'Twee kolommen',
    preview: () => h('div', { class: 'absolute inset-0' }, [
      bar('', { left: '8%', right: '8%', top: '12%', height: '15%' }),
      bar('bg-gray-200', { left: '8%', width: '40%', top: '35%', bottom: '12%' }),
      bar('bg-gray-200', { right: '8%', width: '40%', top: '35%', bottom: '12%' }),
    ]),
  },
  {
    value: 'image_text' as SlideLayoutType, label: 'Afbeelding + tekst',
    preview: () => h('div', { class: 'absolute inset-0' }, [
      bar('', { left: '8%', right: '8%', top: '12%', height: '15%' }),
      bar('bg-gray-300', { left: '8%', width: '40%', top: '35%', bottom: '12%' }),
      bar('bg-gray-200', { right: '8%', width: '40%', top: '35%', bottom: '12%' }),
    ]),
  },
  {
    value: 'full_image' as SlideLayoutType, label: 'Volledige afbeelding',
    preview: () => h('div', { class: 'absolute inset-0' }, [
      bar('bg-gray-300', { inset: '8%' }),
    ]),
  },
  {
    value: 'blank' as SlideLayoutType, label: 'Leeg',
    preview: () => h('div', { class: 'absolute inset-0 flex items-center justify-center text-gray-300 text-xs' }, '∅'),
  },
]
</script>
