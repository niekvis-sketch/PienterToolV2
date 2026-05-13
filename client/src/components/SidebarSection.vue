<template>
  <div>
    <button
      class="w-full flex items-center justify-between px-3 h-9 rounded-veld text-[13px] font-semibold transition-colors uppercase tracking-wider"
      :class="active
        ? 'text-pienter-700'
        : 'text-ink-3 hover:text-ink-2 hover:bg-cream-300'"
      @click="handleClick"
    >
      <span class="flex items-center gap-2.5 text-[11.5px]">
        <span class="text-base">{{ icon }}</span>
        {{ label }}
      </span>
      <svg
        class="w-3.5 h-3.5 text-ink-mute transition-transform"
        :class="{ 'rotate-180': open }"
        fill="none" stroke="currentColor" viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>
    <div v-if="open" class="mt-1 ml-2 pl-2 border-l border-cream-400 space-y-0.5">
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
