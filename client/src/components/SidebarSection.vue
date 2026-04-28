<template>
  <div>
    <button
      class="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
      :class="active ? 'bg-pienter-50 text-pienter-700' : 'text-gray-700 hover:bg-gray-50'"
      @click="handleClick"
    >
      <span class="flex items-center gap-2.5">
        <span class="text-base">{{ icon }}</span>
        {{ label }}
      </span>
      <svg
        class="w-4 h-4 text-gray-400 transition-transform"
        :class="{ 'rotate-180': open }"
        fill="none" stroke="currentColor" viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>
    <div v-if="open" class="mt-0.5 ml-2 pl-3 border-l border-gray-200 space-y-0.5">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label: string
  icon: string
  open: boolean
  active?: boolean
}>()

const emit = defineEmits<{ toggle: [] }>()

function handleClick() {
  emit('toggle')
}
</script>
