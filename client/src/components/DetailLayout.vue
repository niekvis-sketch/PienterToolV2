<template>
  <div :class="containerClass">
    <!-- Outer card frame (Veld) -->
    <div class="rounded-veld bg-white border border-cream-400 shadow-veld-1 p-2.5">
      <!-- Tab pills (optional) -->
      <div v-if="tabs && tabs.length > 0" class="flex gap-1 mb-2.5 px-1 overflow-x-auto">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="tab-pill"
          :class="modelValue === tab.key ? 'is-active' : ''"
          @click="$emit('update:modelValue', tab.key)"
        >
          <span v-if="tab.icon" class="text-base leading-none">{{ tab.icon }}</span>
          {{ tab.label }}
        </button>
      </div>

      <!-- Inner content frame -->
      <div class="rounded-veld border border-cream-400 p-6 min-h-[200px]" style="background: var(--bg);">
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

<style scoped>
.tab-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: var(--r-2);
  font-size: 13px;
  font-weight: 500;
  color: var(--ink-3);
  background: transparent;
  border: 1px solid transparent;
  cursor: pointer;
  transition: color .15s, background .12s, border-color .12s, box-shadow .15s;
  white-space: nowrap;
}
.tab-pill:hover {
  color: var(--ink);
  background: var(--surface-2);
}
.tab-pill.is-active {
  color: var(--primary);
  background: var(--surface);
  border-color: var(--primary);
  box-shadow: var(--shadow-1, 0 1px 0 rgba(20,36,27,0.04));
}
</style>
