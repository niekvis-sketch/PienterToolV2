<template>
  <div :class="containerClass">
    <!-- Outer frame -->
    <div class="rounded-xl border border-gray-200 bg-white shadow-sm p-3">
      <!-- Tab bar (optional) -->
      <div v-if="tabs && tabs.length > 0" class="flex gap-1 mb-3 px-1 overflow-x-auto">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="px-4 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-1.5"
          :class="modelValue === tab.key
            ? 'bg-white border border-pienter-500 text-pienter-700 shadow-sm'
            : 'border border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50'"
          @click="$emit('update:modelValue', tab.key)"
        >
          <span v-if="tab.icon" class="text-base">{{ tab.icon }}</span>
          {{ tab.label }}
        </button>
      </div>

      <!-- Inner content frame -->
      <div class="rounded-lg bg-gray-50 border border-gray-100 p-6 min-h-[200px]">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  tabs?: ReadonlyArray<{ key: string; label: string; icon?: string }>
  modelValue?: string
  narrow?: boolean
}>()

defineEmits<{ 'update:modelValue': [value: string] }>()

const containerClass = computed(() =>
  props.narrow
    ? 'max-w-3xl mx-auto px-4 sm:px-6 py-6'
    : 'w-full px-4 sm:px-6 lg:px-8 xl:px-10 py-6',
)
</script>
