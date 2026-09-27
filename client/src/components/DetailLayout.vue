<template>
  <div :class="containerClass">
    <!-- Onderstreepte tab-balk (Kompas Tabs), optioneel -->
    <div v-if="tabs && tabs.length > 0" class="tab-nav mb-6 overflow-x-auto" role="tablist">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        type="button"
        role="tab"
        class="tab-item"
        :class="{ 'is-active': modelValue === tab.key }"
        :aria-selected="modelValue === tab.key"
        @click="$emit('update:modelValue', tab.key)"
      >
        <KIcon v-if="tab.icon" :name="tab.icon" :size="16" />
        {{ tab.label }}
      </button>
    </div>

    <div class="min-h-[200px]">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import KIcon from './ui/KIcon.vue'
import type { IconName } from './ui/icons'

const props = defineProps<{
  tabs?: ReadonlyArray<{ key: string; label: string; icon?: IconName }>
  modelValue?: string
  narrow?: boolean
}>()

defineEmits<{ 'update:modelValue': [value: string] }>()

const containerClass = computed(() =>
  props.narrow
    ? 'max-w-3xl mx-auto px-4 sm:px-6 py-8'
    : 'w-full px-4 sm:px-6 lg:px-8 xl:px-10 py-8',
)
</script>
